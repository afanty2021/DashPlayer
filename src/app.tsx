/**
 * DashPlayer React 应用根组件
 *
 * 职责：
 * - 应用路由配置和导航
 * - 全局主题管理
 * - 错误边界和异常处理
 * - 全局通知系统集成
 * - 系统状态同步
 * - 全局快捷键支持
 *
 * 架构：
 * - 使用 React Router v6 进行客户端路由
 * - Zustand 管理全局状态和主题
 * - 基于组件的错误边界处理
 * - 多种通知系统集成
 */

import { createRoot } from 'react-dom/client';
import React, { useEffect } from 'react';

// 状态管理和钩子
import useSetting from '@/fronted/hooks/useSetting';
import { syncStatus } from '@/fronted/hooks/useSystem';

// 路由相关
import { HashRouter, Route, Routes } from 'react-router-dom';

// 页面组件
import HomePage from '@/fronted/pages/HomePage';
import TitleBarLayout from '@/fronted/pages/TieleBarLayout';
import PlayerWithControlsPage from '@/fronted/pages/PlayerWithControlsPage';
import Layout from '@/fronted/pages/Layout';
import About from '@/fronted/pages/About';

// 设置页面组件
import SettingLayout from '@/fronted/pages/setting/SettingLayout';
import ShortcutSetting from '@/fronted/pages/setting/ShortcutSetting';
import YouDaoSetting from '@/fronted/pages/setting/YouDaoSetting';
import TenantSetting from '@/fronted/pages/setting/TenantSetting';
import StorageSetting from '@/fronted/pages/setting/StorageSetting';
import CheckUpdate from '@/fronted/pages/setting/CheckUpdate';
import AppearanceSetting from '@/fronted/pages/setting/AppearanceSetting';
import OpenAiSetting from '@/fronted/pages/setting/OpenAiSetting';

// 功能页面组件
import Transcript from '@/fronted/pages/transcript/Transcript';
import Split from '@/fronted/pages/split/Split';
import DownloadVideo from '@/fronted/pages/DownloadVideo';
import Convert from '@/fronted/pages/convert/Convert';
import Favorite from '@/fronted/pages/favourite/Favorite';

// 工具和错误处理组件
import { ErrorBoundary } from 'react-error-boundary';
import FallBack from '@/fronted/components/FallBack';
import Eb from '@/fronted/components/Eb';
import GlobalShortCut from '@/fronted/components/short-cut/GlobalShortCut';

// 通知系统
import { Toaster } from '@/fronted/components/ui/sonner';
import toast, { Toaster as HotToaster } from 'react-hot-toast';

/**
 * 获取 Electron API 实例
 * 提供与主进程通信的接口
 */
const api = window.electron;

/**
 * 主应用组件
 *
 * 功能：
 * - 动态主题切换
 * - 路由配置
 * - 全局组件集成
 * - 错误边界处理
 */
const App = () => {
    // 从全局设置中获取当前主题配置
    const theme = useSetting((s) => s.values.get('appearance.theme'));

    /**
     * 主题切换效果处理
     *
     * 根据用户设置动态应用主题类名到文档根元素
     * 使用 Tailwind CSS 的 dark 模式支持
     *
     * 清理函数：组件卸载时移除主题类名，避免样式污染
     */
    useEffect(() => {
        // 应用主题到文档根元素
        document.documentElement.classList.add(theme ?? 'dark');

        // 返回清理函数，组件卸载时移除主题类名
        return () => {
            document.documentElement.classList.remove(theme ?? 'dark');
        };
    }, [theme]); // 依赖项：主题变更时重新执行
      return (
        <>
            {/* 应用主容器 */}
            <div className="w-full h-screen text-black overflow-hidden select-none font-sans">
                <HashRouter>
                    <Routes>
                        {/* 首页路由 - 兼容根路径和 /home 路径 */}
                        <Route path="/" element={<HomePage />} />
                        <Route path="home" element={<HomePage />} />

                        {/* 需要自定义标题栏的页面布局 */}
                        <Route element={<TitleBarLayout />}>
                            {/* 视频播放器页面 - 包含视频 ID 参数 */}
                            <Route
                                path="player/:videoId"
                                element={<PlayerWithControlsPage />}
                            />

                            {/* 主要功能页面 - 使用标准布局 */}
                            <Route path="*" element={<Layout />}>
                                {/* 字幕转写页面 */}
                                <Route
                                    path="transcript"
                                    element={<Eb key="transcript"><Transcript /></Eb>}
                                />

                                {/* 收藏管理页面 */}
                                <Route
                                    path="favorite"
                                    element={<Eb key="favorite"><Favorite /></Eb>}
                                />

                                {/* 视频分割页面 */}
                                <Route
                                    path="split"
                                    element={<Eb key="split"><Split /></Eb>}
                                />

                                {/* 视频下载页面 */}
                                <Route
                                    path="download"
                                    element={<Eb key="download"><DownloadVideo /></Eb>}
                                />

                                {/* 格式转换页面 */}
                                <Route
                                    path="convert"
                                    element={<Eb key="convert"><Convert /></Eb>}
                                />

                                {/* 关于页面 */}
                                <Route path="about" element={<Eb key="about"><About />} />

                                {/* 设置页面组 - 嵌套路由结构 */}
                                <Route path="settings" element={<SettingLayout />}>
                                    {/* 设置默认页面 - 快捷键设置 */}
                                    <Route
                                        path="*"
                                        element={<Eb><ShortcutSetting /></Eb>}
                                    />

                                    {/* 快捷键设置页面 */}
                                    <Route
                                        path="shortcut"
                                        element={<Eb><ShortcutSetting /></Eb>}
                                    />

                                    {/* 有道翻译设置页面 */}
                                    <Route
                                        path="you-dao"
                                        element={<Eb><YouDaoSetting /></Eb>}
                                    />

                                    {/* 租户设置页面 */}
                                    <Route
                                        path="tenant"
                                        element={<Eb><TenantSetting /></Eb>}
                                    />

                                    {/* OpenAI 设置页面 */}
                                    <Route
                                        path="open-ai"
                                        element={<Eb><OpenAiSetting /></Eb>}
                                    />

                                    {/* 存储设置页面 */}
                                    <Route
                                        path="storage"
                                        element={<Eb><StorageSetting /></Eb>}
                                    />

                                    {/* 更新设置页面 */}
                                    <Route
                                        path="update"
                                        element={<Eb><CheckUpdate /></Eb>}
                                    />

                                    {/* 外观设置页面 */}
                                    <Route
                                        path="appearance"
                                        element={<Eb><AppearanceSetting /></Eb>}
                                    />
                                </Route>
                            </Route>
                        </Route>
                    </Routes>
                </HashRouter>
            </div>

            {/* 全局通知系统 */}
            {/* Sonner 通知组件 - 位置在左下角 */}
            <Toaster position="bottom-left" />

            {/* React Hot Toast 通知组件 - 用于其他类型的通知 */}
            <HotToaster />

            {/* 全局快捷键支持组件 */}
            <GlobalShortCut />
        </>
    );
};

/**
 * 创建并渲染 React 应用
 * 使用 React 18 的 createRoot API 启用并发特性
 */
const root = createRoot(document.body);
root.render(
    <ErrorBoundary FallbackComponent={FallBack}>
        <App />
    </ErrorBoundary>
);

/**
 * 同步系统状态
 * 在应用启动时初始化系统状态监听
 */
syncStatus();

/**
 * 注册全局错误消息监听器
 *
 * 当主进程发送错误消息时，在界面中显示错误提示
 * 使用 react-hot-toast 显示错误通知
 */
api.onErrorMsg((error: Error) => {
    toast.error(error.message);
});

/**
 * 注册全局信息消息监听器
 *
 * 当主进程发送信息消息时，在界面中显示成功提示
 * 使用 react-hot-toast 显示成功通知
 */
api.onInfoMsg((info: string) => {
    toast.success(info);
});
