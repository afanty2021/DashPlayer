/**
 * DashPlayer 后端 API 调度器
 *
 * 职责：
 * - 初始化和注册所有后端控制器路由
 * - 配置依赖注入容器
 * - 设置系统服务的窗口引用
 * - 建立 IPC 通信桥梁
 *
 * 工作流程：
 * 1. 从 IOC 容器获取所有控制器实例
 * 2. 调用每个控制器的 registerRoutes() 方法注册 IPC 处理器
 * 3. 配置系统服务的主窗口引用，用于向前端发送消息
 */

import Controller from '@/backend/interfaces/controller';
import container from '@/backend/ioc/inversify.config';
import TYPES from '@/backend/ioc/types';
import SystemService from '@/backend/services/SystemService';
import { BrowserWindow } from 'electron';

/**
 * 注册后端 API 处理程序
 *
 * 这是后端系统的核心初始化函数，负责：
 * - 路由注册：将所有控制器的 API 路由注册到 Electron IPC
 * - 依赖注入：配置服务间的依赖关系
 * - 窗口管理：为主窗口提供系统服务访问能力
 *
 * @param mainWindowRef - 主窗口引用对象，用于系统服务向前端发送消息
 */
export default function registerHandler(mainWindowRef: { current: BrowserWindow | null }) {
    /**
     * 步骤 1: 从 IOC 容器获取所有控制器实例
     *
     * TYPES.Controller 标识符会返回所有注册为 Controller 类型的服务
     * 这些控制器负责处理前端的 API 请求
     */
    const controllerBeans = container.getAll<Controller>(TYPES.Controller);

    /**
     * 步骤 2: 注册所有控制器的路由
     *
     * 遍历每个控制器实例，调用其 registerRoutes() 方法
     * 每个控制器会向 Electron 的 ipcMain 注册自己的 IPC 处理程序
     * 这样前端就可以通过 ipcRenderer.invoke() 调用对应的 API
     */
    controllerBeans.forEach((bean) => {
        bean.registerRoutes();
    });

    /**
     * 步骤 3: 配置系统服务的主窗口引用
     *
     * 将主窗口引用传递给 SystemService
     * SystemService 使用这个引用向前端发送：
     * - 状态更新通知
     * - 错误消息
     * - 信息消息
     * - 进度更新等
     */
    container.get<SystemService>(TYPES.SystemService).setMainWindow(mainWindowRef);
}
