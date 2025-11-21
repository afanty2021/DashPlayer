/**
 * DashPlayer 首页组件
 *
 * 职责：
 * - 应用入口界面和导航中心
 * - 观看历史记录展示
 * - 文件和文件夹选择功能
 * - 应用窗口大小管理
 * - 视频格式兼容性检查
 *
 * 功能特性：
 * - 支持单个文件选择播放
 * - 支持文件夹批量导入
 * - 显示最近观看的视频记录
 * - 智能视频格式检查和转换提示
 * - 响应式布局和用户交互优化
 */

import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

// UI 组件
import TitleBar from '@/fronted/components/TitleBar/TitleBar';
import { cn } from '@/fronted/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/fronted/components/ui/card';
import { Button } from '@/fronted/components/ui/button';
import { ChevronsDown } from 'lucide-react';

// 文件选择组件
import ProjectListCard from '@/fronted/components/fileBowser/project-list-card';
import ProjectListItem from '@/fronted/components/fileBowser/project-list-item';
import FolderSelector, { FolderSelectAction } from '@/fronted/components/fileBowser/FolderSelector';
import FileSelector, { FileAction } from '@/fronted/components/fileBowser/FileSelector';

// 状态管理和工具
import useLayout from '@/fronted/hooks/useLayout';
import useFile from '@/fronted/hooks/useFile';
import useConvert from '@/fronted/hooks/useConvert';
import useSWR from 'swr';
import { apiPath, SWR_KEY } from '@/fronted/lib/swr-util';
import { toast } from 'sonner';

/**
 * Electron API 实例
 * 提供与主进程通信的能力
 */
const api = window.electron;

/**
 * 首页组件主体
 */
const HomePage = () => {
    // 路由导航钩子
    const navigate = useNavigate();

    // 布局状态管理
    const changeSideBar = useLayout((s) => s.changeSideBar);

    /**
     * 处理视频历史记录点击事件
     *
     * 功能：
     * - 切换窗口到播放器模式
     * - 隐藏侧边栏
     * - 导航到播放器页面并传入视频ID
     *
     * @param vId - 视频ID，用于播放器页面加载对应视频
     */
    async function handleClickById(vId: string) {
        // 切换窗口大小到播放器模式
        await api.call('system/window-size/change', 'player');
        // 隐藏侧边栏以提供更佳的播放体验
        changeSideBar(false);
        // 导航到播放器页面
        navigate(`/player/${vId}`);
    }

    /**
     * 获取观看历史记录数据
     * 使用 SWR 进行数据缓存和状态管理
     * 自动处理加载状态、错误状态和数据更新
     */
    const { data: vps } = useSWR(
        apiPath('watch-history/list'),
        () => api.call('watch-history/list')
    );

    // 获取文件状态清除函数
    const clear = useFile((s) => s.clear);

    // 控制显示的历史记录数量
    const [num, setNum] = React.useState(4);

    /**
     * 计算要显示的额外历史记录
     * 从第4个开始（跳过前3个卡片显示的）
     */
    const rest = vps?.slice(3, num + 3);

    /**
     * 页面初始化效果
     *
     * 功能：
     * - 设置窗口为首页模式
     * - 清除之前的文件状态
     */
    useEffect(() => {
        // 设置窗口大小为首页模式
        api.call('system/window-size/change', 'home').then();
        // 清除文件状态，确保干净的状态
        clear();
    }, [clear]);

    // 调试日志：监控数据状态
    console.log('vpsl', vps?.length, rest?.length, num);
    return (
        <div className="flex h-screen w-full flex-col text-foreground bg-muted/40">
            <header className="top-0 flex h-9 items-center">
                <TitleBar
                    maximizable={false}
                    className="top-0 left-0 w-full h-9 z-50"
                />
            </header>
            <main
                className="flex h-0 flex-1 gap-4 p-4 md:gap-8">


                <nav
                    className="flex flex-col gap-4 text-sm text-muted-foreground font-semibold md:p-10 md:pr-0"
                >
                    <h1 className="text-3xl font-semibold -translate-x-1">DashPlayer</h1>
                    <Link
                        onClick={() => api.call('system/window-size/change', 'player')}
                        to="/home" className="font-semibold text-primary mt-28 text-base ">
                        Home Page
                    </Link>
                    <Link onClick={() => api.call('system/window-size/change', 'player')} to={'/favorite'}
                          className="font-semibold ">Favorite Clips</Link>
                    <Link onClick={() => api.call('system/window-size/change', 'player')} to={'/transcript'}
                          className="font-semibold ">Transcript</Link>
                    <Link onClick={() => api.call('system/window-size/change', 'player')} to="/split"
                          className="font-semibold ">Split Video</Link>
                    <Link onClick={() => api.call('system/window-size/change', 'player')} to={'/download'}
                          className="font-semibold ">Download</Link>
                    <Link onClick={() => api.call('system/window-size/change', 'player')} to={'/convert'}
                          className="font-semibold ">Convert</Link>
                </nav>
                <div className="flex flex-col overflow-y-auto scrollbar-none md:p-10 md:pl-0 w-0 flex-1">
                    <div
                        className={cn('justify-self-end flex flex-wrap w-full justify-center items-center gap-2 min-h-20 rounded border border-dashed p-2')}
                    >
                        <FileSelector
                            onSelected={FileAction.playerAction2(navigate)}
                            withMkv
                        />
                        <FolderSelector
                            onSelected={FolderSelectAction.defaultAction2(async (vid, fp) => {
                                await api.call('system/window-size/change', 'player');
                                changeSideBar(false);
                                navigate(`/player/${vid}`);
                                const analyse = await api.call('watch-history/analyse-folder', fp);
                                if (analyse?.unsupported > 0) {
                                    const folderList = await api.call('convert/from-folder', [fp]);
                                    setTimeout(() => {
                                        toast('MKV 格式的的视频可能会遇到问题', {
                                            description: '如果您遇到问题，请尝试转换视频格式',
                                            position: 'top-right',
                                            action: {
                                                label: 'Convert',
                                                onClick: () => {
                                                    useConvert.getState().addFolders(folderList);
                                                    navigate(`/convert`);
                                                }
                                            }
                                        });
                                    }, 500);
                                }
                            })}
                        />
                    </div>

                    <Card x-chunk="dashboard-04-chunk-1" className={'mt-16 '}>
                        <CardHeader>
                            <CardTitle>Recent Watch</CardTitle>
                            <CardDescription>
                                Pick up where you left off
                            </CardDescription>
                        </CardHeader>
                        <CardContent className={'grid grid-cols-3 gap-8'}>
                            {vps?.slice(0, 3)
                                .map((v) => (
                                    <ProjectListCard
                                        key={v.id}
                                        onSelected={() => handleClickById(v.id)}
                                        video={v} />
                                ))}
                        </CardContent>
                    </Card>
                    <div className={'flex flex-col mt-10'}>
                        {rest?.map((v) => (
                            <ProjectListItem
                                key={v.id}
                                onSelected={() => handleClickById(v.id)}
                                video={v} />
                        ))}
                    </div>
                    <Button
                        onClick={() => setNum(num + 10)}
                        disabled={num + 3 >= (vps?.length ?? 0)}
                        variant={'ghost'}>
                        <ChevronsDown className={'text-muted-foreground'} />
                    </Button>
                </div>
            </main>
        </div>
    );
};

export default HomePage;
