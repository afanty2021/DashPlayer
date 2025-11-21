/**
 * DashPlayer 媒体控制器
 *
 * 职责：
 * - 处理视频分割相关请求
 * - 管理视频缩略图生成
 * - 提供视频时长获取功能
 * - 统一媒体文件处理接口
 *
 * API 端点：
 * - split-video/preview: 预览视频分割结果
 * - split-video/split: 执行视频分割
 * - split-video/thumbnail: 生成视频缩略图
 * - split-video/video-length: 获取视频时长
 *
 * 技术架构：
 * - 基于 Inversify 的依赖注入
 * - FFmpeg 集成进行媒体处理
 * - 异步处理和错误处理
 */

import {ChapterParseResult} from '@/common/types/chapter-result';
import registerRoute from '@/common/api/register';
import FfmpegServiceImpl from '@/backend/services/impl/FfmpegServiceImpl';
import { inject, injectable } from 'inversify';
import Controller from '@/backend/interfaces/controller';
import TYPES from '@/backend/ioc/types';
import SplitVideoService from '@/backend/services/SplitVideoService';
import MediaService from '../services/MediaService';

/**
 * 媒体控制器实现类
 * 使用 @injectable 装饰器支持依赖注入
 */
@injectable()
export default class MediaController implements Controller {

    /**
     * 视频分割服务依赖注入
     * 处理按章节分割视频的业务逻辑
     */
    @inject(TYPES.SplitVideoService)
    private splitVideoService!: SplitVideoService;

    /**
     * FFmpeg 服务依赖注入
     * 提供视频处理的底层能力
     */
    @inject(TYPES.FfmpegService)
    private ffmpegService!: FfmpegServiceImpl;

    /**
     * 媒体服务依赖注入
     * 提供通用媒体处理功能
     */
    @inject(TYPES.MediaService)
    private mediaService!: MediaService;

      /**
     * 预览视频分割结果
     *
     * 功能：
     * - 解析视频文件的章节信息
     * - 返回分割预览结果，但不实际执行分割
     * - 用于用户确认分割参数
     *
     * @param str - 视频文件路径
     * @returns 章节解析结果数组
     */
    public async previewSplit(str: string): Promise<ChapterParseResult[]> {
        return this.splitVideoService.previewSplit(str);
    }

    /**
     * 执行视频分割
     *
     * 功能：
     * - 根据章节信息分割视频文件
     * - 支持字幕文件同步处理
     * - 返回分割后的文件路径
     *
     * @param videoPath - 源视频文件路径
     * @param srtPath - 字幕文件路径（可选）
     * @param chapters - 章节信息数组
     * @returns 分割操作结果
     */
    public async split({
                           videoPath,
                           srtPath,
                           chapters
                       }: {
        videoPath: string,
        srtPath: string | null,
        chapters: ChapterParseResult[]
    }): Promise<string> {
        return await this.splitVideoService.splitByChapters({
            videoPath,
            srtPath,
            chapters
        });
    }

    /**
     * 生成视频缩略图
     *
     * 功能：
     * - 从指定时间点提取视频帧
     * - 生成缩略图文件并返回路径
     * - 用于视频预览和封面展示
     *
     * @param filePath - 视频文件路径
     * @param time - 时间点（秒）
     * @returns 缩略图文件路径
     */
    public async thumbnail({filePath, time}: { filePath: string, time: number }): Promise<string> {
        return this.mediaService.thumbnail(filePath, time);
    }

    /**
     * 获取视频时长
     *
     * 功能：
     * - 使用 FFmpeg 分析视频文件
     * - 返回视频的总时长（秒）
     * - 用于播放控制和进度显示
     *
     * @param filePath - 视频文件路径
     * @returns 视频时长（秒）
     */
    public videoLength(filePath: string): Promise<number> {
        return this.ffmpegService.duration(filePath);
    }

    /**
     * 注册 API 路由
     *
     * 功能：
     * - 将控制器的所有方法注册为 IPC 路由
     * - 建立前端调用与后端服务的映射关系
     * - 实现 Controller 接口要求
     */
    registerRoutes(): void {
        registerRoute('split-video/preview', (p)=>this.previewSplit(p));
        registerRoute('split-video/split', (p)=>this.split(p));
        registerRoute('split-video/thumbnail', (p)=>this.thumbnail(p));
        registerRoute('split-video/video-length', (p)=>this.videoLength(p));
    }
}
