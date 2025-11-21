/**
 * DashPlayer Electron 主进程入口文件
 *
 * 职责：
 * - 应用生命周期管理
 * - 主窗口创建和配置
 * - 自定义协议注册
 * - 数据库初始化
 * - 后台任务管理
 * - IPC 路由注册
 */

import { app, BrowserWindow, protocol, net } from 'electron';
import path from 'path';
import registerHandler from '@/backend/dispatcher';
import runMigrate from '@/backend/db/migrate';
import { DP_FILE, DP } from '@/common/utils/UrlUtil';
import * as base32 from 'hi-base32';
import DpTaskServiceImpl from '@/backend/services/impl/DpTaskServiceImpl';
import 'reflect-metadata';

/**
 * 主窗口引用，用于全局访问主窗口实例
 * 采用引用对象模式，便于在各个模块间共享窗口实例
 */
const mainWindowRef = {
    current: null as BrowserWindow | null
};
/**
 * 创建并配置主应用窗口
 *
 * 功能：
 * - 创建无边框窗口，支持自定义标题栏
 * - 配置预加载脚本以实现安全的进程间通信
 * - 根据环境加载开发服务器或生产构建文件
 * - 开发环境下自动打开开发者工具
 */
const createWindow = () => {
    // 创建浏览器窗口实例
    const mainWindow = new BrowserWindow({
        width: 1200,                    // 窗口宽度
        height: 800,                    // 窗口高度
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')  // 预加载脚本路径
        },
        frame: false,                   // 移除原生窗口边框
        titleBarStyle: 'customButtonsOnHover'  // 悬停时显示自定义窗口控制按钮
    });

    // 保存窗口引用供全局使用
    mainWindowRef.current = mainWindow;

    // 根据环境加载应用内容
    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
        // 开发环境：加载 Vite 开发服务器
        mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
        // 开发环境：自动打开开发者工具
        mainWindow.webContents.openDevTools();
    } else {
        // 生产环境：加载构建后的 HTML 文件
        mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
    }
};

/**
 * 注册自定义协议为特权协议
 *
 * 此方法必须在 Electron 应用准备好之前调用
 * 某些 API 只能在应用初始化完成后使用
 *
 * DP 协议用于：
 * - 安全的本地文件访问
 * - 跨域资源共享控制
 * - 服务工作者支持
 * - 流式媒体传输
 */
protocol.registerSchemesAsPrivileged([
    {
        scheme: DP,  // DashPlayer 自定义协议
        privileges: {
            standard: true,            // 标准协议（遵循 URL RFC）
            secure: true,              // 安全协议（类似 HTTPS）
            bypassCSP: true,           // 绕过内容安全策略
            allowServiceWorkers: true, // 允许服务工作者
            supportFetchAPI: true,     // 支持 Fetch API
            stream: true,              // 支持流式传输
            codeCache: true,           // 启用代码缓存
            corsEnabled: false         // 禁用 CORS（本地文件访问）
        }
    }
]);
/**
 * 应用就绪事件处理程序
 *
 * 执行启动序列：
 * 1. 运行数据库迁移，确保数据结构最新
 * 2. 取消所有未完成的后台任务
 * 3. 创建主窗口
 * 4. 注册文件协议处理器
 * 5. 注册自定义网络协议处理器
 */
app.on('ready', async () => {
    // 1. 执行数据库迁移，确保表结构与代码同步
    await runMigrate();

    // 2. 取消所有未完成的后台任务，避免异常状态
    await DpTaskServiceImpl.cancelAll();

    // 3. 创建并显示主窗口
    createWindow();

    /**
     * 注册 DP_FILE 文件协议处理器
     *
     * 功能：处理本地文件访问请求
     * 用途：安全地访问本地视频、字幕等文件
     * 格式：dp-file://encoded-file-path
     */
    protocol.registerFileProtocol(DP_FILE, (request, callback) => {
        // 从协议 URL 中提取文件路径
        const url: string = request.url.replace(`${DP_FILE}://`, '');
        try {
            // 解码 URI 编码的文件路径并返回
            return callback(decodeURIComponent(url));
        } catch (error) {
            // 错误处理：记录错误并返回空路径
            console.error('文件协议解析错误:', error);
            return callback('');
        }
    });

    /**
     * 注册 DP 自定义协议处理器
     *
     * 功能：处理编码的网络请求和本地文件请求
     * 用途：通过 Base32 编码安全地传递文件路径
     * 格式：dp://base32-encoded-url
     */
    protocol.handle(DP, (request) => {
        // 提取并解码 Base32 编码的 URL
        let url = request.url
            .slice(`${DP}://`.length, request.url.length - 1)  // 移除协议头和尾部斜杠
            .toUpperCase();  // Base32 使用大写字母

        // Base32 解码获取原始 URL
        url = base32.decode(url);

        if (url.startsWith('http')) {
            // HTTP/HTTPS 请求：直接转发到网络
            return net.fetch(url);
        } else {
            // 本地文件请求：确保路径安全性
            const parts = url.split(path.sep);
            // 对路径各部分进行 URI 编码，防止路径注入攻击
            const encodedParts = parts.map(part => encodeURIComponent(part));
            const encodedUrl = encodedParts.join(path.sep);
            return net.fetch(`file:///${encodedUrl}`);
        }
    });
});

/**
 * 所有窗口关闭事件处理程序
 *
 * 平台差异处理：
 * - Windows/Linux：所有窗口关闭时退出应用
 * - macOS：保持应用运行，用户必须通过 Cmd+Q 退出
 * 这是 macOS 的标准行为，符合用户习惯
 */
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        // 非 macOS 平台：直接退出应用
        app.quit();
    }
    // macOS：保持应用运行，等待用户手动退出
});

/**
 * 应用激活事件处理程序
 *
 * macOS 特有行为：
 * - 当点击 Dock 图标且没有窗口打开时，重新创建窗口
 * - 这确保了用户可以通过 Dock 图标随时恢复应用
 */
app.on('activate', () => {
    // 检查是否没有任何窗口打开
    if (BrowserWindow.getAllWindows().length === 0) {
        // 重新创建主窗口
        createWindow();
    }
});

/**
 * 注册 IPC 通信处理器
 *
 * 在所有初始化完成后注册后端 API 路由
 * 将主窗口引用传递给后端系统，用于发送消息到渲染进程
 *
 * 这标志着主进程初始化的完成
 */
registerHandler(mainWindowRef);
