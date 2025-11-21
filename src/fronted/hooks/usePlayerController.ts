/**
 * DashPlayer 播放器核心状态管理 Hook
 *
 * 这是整个播放器系统的状态管理中心，采用 Zustand 切片式架构设计
 * 负责协调视频播放、字幕处理、用户交互等所有播放器相关功能
 *
 * 架构特点：
 * - 切片式设计：将复杂状态分解为多个独立切片
 * - 响应式更新：基于 Zustand 的订阅机制
 * - 类型安全：完整的 TypeScript 类型约束
 * - 性能优化：选择性订阅和浅比较
 *
 * 主要功能：
 * - 视频播放控制（播放/暂停/跳转）
 * - 字幕加载和同步
 * - 句子级别的精确控制
 * - 自动暂停和单句重复
 * - 播放进度管理
 * - 观看历史记录
 * - 字幕翻译集成
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';

// 状态切片导入
import createSubtitleSlice from './usePlayerControllerSlices/createSubtitleSlice';
import {
    ControllerSlice,
    InternalSlice,
    ModeSlice,
    PlayerSlice,
    SentenceSlice,
    SubtitleSlice
} from './usePlayerControllerSlices/SliceTypes';
import createPlayerSlice from './usePlayerControllerSlices/createPlayerSlice';
import createSentenceSlice from './usePlayerControllerSlices/createSentenceSlice';
import createInternalSlice from './usePlayerControllerSlices/createInternalSlice';
import createModeSlice from './usePlayerControllerSlices/createModeSlice';
import createControllerSlice from './usePlayerControllerSlices/createControllerSlice';

// 类型定义
import { Sentence, SrtSentence } from '@/common/types/SentenceC';

// 其他 Hook 和工具
import useFile from './useFile';
import { sleep } from '@/common/utils/Util';
import useSetting from './useSetting';
import TransHolder from '../../common/utils/TransHolder';
import { SWR_KEY, swrMutate } from '@/fronted/lib/swr-util';
import useFavouriteClip from '@/fronted/hooks/useFavouriteClip';
import StrUtil from '@/common/utils/str-util';
import { ObjUtil } from '@/backend/utils/ObjUtil';

/**
 * Electron API 实例
 * 提供与主进程通信的能力
 */
const api = window.electron;

/**
 * 创建播放器控制器状态存储
 *
 * 使用 Zustand 的切片式架构，组合多个功能切片：
 * - PlayerSlice: 基础播放控制（播放、暂停、音量等）
 * - SentenceSlice: 句子级别的控制和状态管理
 * - ModeSlice: 播放模式（单句重复、自动暂停等）
 * - InternalSlice: 内部状态（精确播放时间、字幕提供者等）
 * - SubtitleSlice: 字幕数据和翻译管理
 * - ControllerSlice: 控制器级别的操作和业务逻辑
 *
 * subscribeWithSelector 中间件允许对特定状态进行精细订阅
 */
const usePlayerController = create<
    PlayerSlice &
    SentenceSlice &
    ModeSlice &
    InternalSlice &
    SubtitleSlice &
    ControllerSlice
>()(
    subscribeWithSelector((...a) => ({
        ...createPlayerSlice(...a),      // 播放基础功能
        ...createSentenceSlice(...a),    // 句子控制
        ...createModeSlice(...a),        // 播放模式
        ...createInternalSlice(...a),    // 内部状态
        ...createSubtitleSlice(...a),    // 字幕管理
        ...createControllerSlice(...a)   // 控制器逻辑
        // 未来扩展：单词级别功能
        // ...createWordLevelSlice(...a),
    }))
);

export default usePlayerController;

/**
 * 播放时间同步定时器引用
 * 用于定期同步精确播放时间到显示时间
 */
let interval: number | null = null;

/**
 * 同步 exactPlayTime 到 playTime
 */
usePlayerController.subscribe(
    (state) => state.playing,
    (playing) => {
        if (playing) {
            const sync = () => {
                usePlayerController.setState((state) => ({
                    playTime: state.internal.exactPlayTime
                }));
            };
            sync();
            interval = window.setInterval(sync, 300);
        } else if (interval) {
            window.clearInterval(interval);
            interval = null;
        }
    }
);

/**
 * 同步播放时间到后台
 */
let count = 0;
usePlayerController.subscribe(
    (state) => ({
        playTime: state.playTime,
        duration: state.duration
    }),
    async ({ playTime, duration }) => {
        if (useFile.getState().videoLoaded) {
            count += 1;
            if (count % 5 !== 0) {
                return;
            }
            const file = useFile.getState().videoPath;
            if (!file) {
                return;
            }

            await api.call('watch-history/progress/update', {
                file: file,
                currentPosition: playTime,
            });
        }
    },
    { equalityFn: shallow }
);

/**
 * 视频暂停时也尝试更新当前句子
 */
let updateSentenceInterval: number | null = null;
usePlayerController.subscribe(
    (state) => ({
        playing: state.playing
    }),
    async ({ playing }) => {
        if (!playing) {
            const state = usePlayerController.getState();
            const srtTender = state.srtTender;
            if (state.autoPause || state.singleRepeat || !srtTender) {
                return;
            }
            updateSentenceInterval = window.setInterval(() => {
                if (useFile.getState().videoLoaded) {
                    const currentTime = state.internal.exactPlayTime;
                    const nextSentence: Sentence = srtTender.getByTime(currentTime);
                    const cs: Sentence | undefined = state.currentSentence;
                    const isCurrent = cs === nextSentence;
                    if (isCurrent) {
                        return;
                    }
                    usePlayerController.setState({ currentSentence: nextSentence });
                }
            }, 1000);
        } else if (updateSentenceInterval) {
            window.clearInterval(updateSentenceInterval);
            updateSentenceInterval = null;
        }
    },
    { equalityFn: shallow }
);

/**
 *
 */

function filterUserCanSee(finishedGroup: Set<number>, subtitle: Sentence[]) {
    const currentGroup =
        usePlayerController.getState().currentSentence?.transGroup ?? 1;
    let shouldTransGroup = [currentGroup - 1, currentGroup, currentGroup + 1];
    shouldTransGroup = shouldTransGroup.filter(
        (item) => !finishedGroup.has(item)
    );
    if (shouldTransGroup.length === 0) {
        // eslint-disable-next-line no-continue
        return [];
    }
    console.log('trans group', shouldTransGroup);
    const groupSubtitles = subtitle.filter((item) =>
        shouldTransGroup.includes(item.transGroup)
    );
    shouldTransGroup.forEach((item) => {
        finishedGroup.add(item);
    });
    return groupSubtitles;
}

/**
 * 加载与翻译
 */
useFile.subscribe(
    (s) => s.subtitlePath,
    async (subtitlePath) => {
        if (StrUtil.isBlank(subtitlePath)) {
            return;
        }
        const CURRENT_FILE = useFile.getState().subtitlePath;
        const srtSubtitles: SrtSentence | null = await api.call('subtitle/srt/parse-to-sentences', subtitlePath);
        if (ObjUtil.isNull(srtSubtitles)) {
            if (CURRENT_FILE !== useFile.getState().subtitlePath) {
                return;
            }
            useFile.setState({
                subtitlePath: null
            });
            usePlayerController.getState().setSubtitle([]);
            return;
        }
        const subtitle = srtSubtitles.sentences;
        if (CURRENT_FILE !== useFile.getState().subtitlePath) {
            return;
        }
        usePlayerController.getState().setSubtitle(subtitle);
        useFile.setState({
            srtHash: srtSubtitles.fileHash
        });
        const finishedGroup = new Set<number>();
        while (CURRENT_FILE === useFile.getState().subtitlePath) {
            const userCanSee = filterUserCanSee(finishedGroup, subtitle);
            // console.log('userCanSee', userCanSee);
            if (userCanSee.length > 0) {
                console.log('test error before');
                const transHolder = TransHolder.from(
                    // eslint-disable-next-line no-await-in-loop
                    await api.call('ai-trans/batch-translate',
                        userCanSee.map((s) => s.text ?? '')
                    )
                );
                console.log('test error after');
                if (CURRENT_FILE !== useFile.getState().subtitlePath) {
                    return;
                }
                console.log('transHolder', transHolder);
                if (!transHolder.isEmpty()) {
                    usePlayerController
                        .getState()
                        .mergeSubtitleTrans(transHolder);
                }
                // 加载收藏
                useFavouriteClip.getState().updateClipInfo(srtSubtitles.fileHash, userCanSee.map((s) => s.index));
            }
            await sleep(500);
        }
    }
);

/**
 * 监听腾讯密钥更新
 */
useSetting.subscribe(
    (s) =>
        `${s.setting('apiKeys.tencent.secretId')}:${s.setting(
            'apiKeys.tencent.secretKey'
        )}`,
    (s, ps) => {
        useFile.setState({
            subtitlePath: null
        });
        swrMutate(SWR_KEY.PLAYER_P).then();
    }
);
