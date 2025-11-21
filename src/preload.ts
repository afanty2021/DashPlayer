/**
 * DashPlayer 预加载脚本 (Preload Script)
 *
 * 职责：
 * - 在渲染进程中安全地暴露 Node.js API
 * - 提供类型安全的 IPC 通信接口
 * - 建立主进程与渲染进程之间的桥梁
 * - 实现进程间的事件监听和消息传递
 *
 * 安全性：
 * - 通过 contextBridge 安全地暴露 API
 * - 使用 TypeScript 类型系统确保类型安全
 * - 限制可访问的 IPC 通道
 *
 * 文档参考：
 * https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
 */

import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import { SettingKey } from './common/types/store_schema';
import { ApiDefinitions, ApiMap } from '@/common/api/api-def';

/**
 * IPC 通信通道类型定义
 *
 * 限制可用的通信通道，提高安全性
 * - main-state: 主进程状态变化通知
 * - store-update: 应用设置更新通知
 * - error-msg: 错误消息传递
 * - info-msg: 信息消息传递
 */
export type Channels =
    | 'main-state'
    | 'store-update'
    | 'error-msg'
    | 'info-msg';
/**
 * IPC 事件监听器包装函数
 *
 * 功能：
 * - 封装 ipcRenderer.on 调用，提供更简洁的接口
 * - 自动处理事件对象，只传递业务数据
 * - 返回取消监听的函数，便于内存管理
 *
 * @param channel - IPC 通道名称
 * @param func - 事件处理回调函数
 * @returns 取消监听的函数
 */
const on = (channel: Channels, func: (...args: unknown[]) => void) => {
    // 创建事件处理函数，过滤掉 IPC 事件对象
    const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
        func(...args);

    // 注册事件监听器
    ipcRenderer.on(channel, subscription);

    // 返回取消监听的清理函数
    return () => {
        ipcRenderer.removeListener(channel, subscription);
    };
};
/**
 * Electron 处理程序对象
 *
 * 提供给渲染进程的安全 API 接口，包含：
 * - 事件监听器：监听主进程发送的各种消息
 * - API 调用器：调用后端服务的类型安全接口
 * - 错误处理：统一处理 IPC 通信错误
 */
const electronHandler = {
    /**
     * 监听应用设置更新事件
     *
     * 当主进程中的设置发生变更时，会触发此回调
     * 用于实现设置的双向同步
     *
     * @param func - 设置更新回调函数，接收键值对参数
     * @returns 取消监听的函数
     */
    onStoreUpdate: (func: (key: SettingKey, value: string) => void) => {
        console.log('注册设置更新监听器');
        return on('store-update', func as never);
    },

    /**
     * 监听错误消息事件
     *
     * 当主进程发生错误时，会向渲染进程发送错误消息
     * 用于在界面中显示系统错误提示
     *
     * @param func - 错误消息回调函数
     * @returns 取消监听的函数
     */
    onErrorMsg: (func: (error: Error) => void) => {
        return on('error-msg', func as never);
    },

    /**
     * 监听信息消息事件
     *
     * 当主进程需要向用户展示信息时，会触发此回调
     * 用于在界面中显示系统信息提示
     *
     * @param func - 信息消息回调函数
     * @returns 取消监听的函数
     */
    onInfoMsg: (func: (info: string) => void) => {
        return on('info-msg', func as never);
    },

    /**
     * 调用后端 API 的标准方法
     *
     * 提供类型安全的 IPC 调用接口，所有错误会向上抛出
     * 适用于需要精确错误处理的场景
     *
     * @template K - API 路径键类型
     * @param path - API 路径，类型安全约束
     * @param param - API 参数，可选
     * @returns Promise 包装的 API 返回值
     */
    call: async function invok<K extends keyof ApiMap>(
        path: K,
        param?: ApiDefinitions[K]['params']
    ): Promise<ApiDefinitions[K]['return']> {
        return ipcRenderer.invoke(path, param);
    },

    /**
     * 调用后端 API 的安全方法
     *
     * 提供类型安全的 IPC 调用接口，内部捕获所有异常
     * 适用于不需要精确错误处理、只关心结果成功的场景
     *
     * @template K - API 路径键类型
     * @param path - API 路径，类型安全约束
     * @param param - API 参数，可选
     * @returns Promise 包装的 API 返回值，失败时返回 null
     */
    safeCall: async function invok<K extends keyof ApiMap>(
        path: K,
        param?: ApiDefinitions[K]['params']
    ): Promise<ApiDefinitions[K]['return'] | null> {
        try {
            return await ipcRenderer.invoke(path, param);
        } catch (e) {
            // 记录错误但不抛出，返回 null 表示调用失败
            console.error('IPC 调用失败:', e);
            return null;
        }
    }
};
/**
 * 将处理程序安全地暴露到渲染进程的全局对象
 *
 * 通过 contextBridge 在渲染进程的 window 对象上创建 electron 属性
 * 这确保了渲染进程可以安全地访问预定义的 API，而无法访问整个 Node.js API
 *
 * 安全性：
 * - 只暴露必要的 API 接口
 * - 保持类型安全
 * - 防止恶意代码访问系统资源
 */
contextBridge.exposeInMainWorld('electron', electronHandler);

/**
 * 导出 Electron 处理程序类型定义
 *
 * 供渲染进程中的 TypeScript 代码使用
 * 确保类型安全的 API 调用
 */
export type ElectronHandler = typeof electronHandler;
