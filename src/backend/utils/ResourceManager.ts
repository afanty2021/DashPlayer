/**
 * 资源管理器
 * 管理定时器、子进程、文件句柄等资源的生命周期
 */

import { ChildProcess } from 'child_process';
import dpLog from '@/backend/ioc/logger';

export class ResourceManager {
    private timers = new Set<NodeJS.Timeout>();
    private intervals = new Set<NodeJS.Timeout>();
    private processes = new Set<ChildProcess>();
    private watchers: Set<unknown> = new Set();
    private name: string;

    constructor(name: string) {
        this.name = name;
    }

    /**
     * 添加定时器
     */
    addTimer(timer: NodeJS.Timeout): void {
        this.timers.add(timer);
        dpLog.debug(`[ResourceManager:${this.name}] Added timer: ${timer}`);
    }

    /**
     * 添加间隔定时器
     */
    addInterval(interval: NodeJS.Timeout): void {
        this.intervals.add(interval);
        dpLog.debug(`[ResourceManager:${this.name}] Added interval: ${interval}`);
    }

    /**
     * 添加子进程
     */
    addProcess(process: ChildProcess): void {
        this.processes.add(process);

        // 自动清理已退出的进程
        process.once('exit', () => {
            this.processes.delete(process);
            dpLog.debug(`[ResourceManager:${this.name}] Process exited: ${process.pid}`);
        });

        process.once('error', (error) => {
            this.processes.delete(process);
            dpLog.error(`[ResourceManager:${this.name}] Process error: ${error}`, { pid: process.pid });
        });

        dpLog.debug(`[ResourceManager:${this.name}] Added process: ${process.pid}`);
    }

    /**
     * 添加文件观察器
     */
    addWatcher(watcher: unknown): void {
        this.watchers.add(watcher);
        dpLog.debug(`[ResourceManager:${this.name}] Added watcher`);
    }

    /**
     * 清理所有资源
     */
    cleanup(): void {
        dpLog.info(`[ResourceManager:${this.name}] Starting cleanup...`);

        // 清理定时器
        this.timers.forEach(timer => {
            clearTimeout(timer);
            dpLog.debug(`[ResourceManager:${this.name}] Cleared timer`);
        });
        this.timers.clear();

        // 清理间隔定时器
        this.intervals.forEach(interval => {
            clearInterval(interval);
            dpLog.debug(`[ResourceManager:${this.name}] Cleared interval`);
        });
        this.intervals.clear();

        // 终止子进程
        this.processes.forEach(process => {
            if (!process.killed) {
                try {
                    // 先尝试优雅关闭
                    process.kill('SIGTERM');

                    // 5秒后强制终止
                    setTimeout(() => {
                        if (!process.killed) {
                            process.kill('SIGKILL');
                            dpLog.warn(`[ResourceManager:${this.name}] Force killed process: ${process.pid}`);
                        }
                    }, 5000);
                } catch (error) {
                    dpLog.error(`[ResourceManager:${this.name}] Failed to kill process: ${error}`, {
                        pid: process.pid
                    });
                }
            }
        });
        this.processes.clear();

        // 关闭文件观察器
        this.watchers.forEach(watcher => {
            try {
                if (watcher && typeof watcher === 'object' && 'close' in watcher) {
                    (watcher as any).close();
                }
            } catch (error) {
                dpLog.error(`[ResourceManager:${this.name}] Failed to close watcher: ${error}`);
            }
        });
        this.watchers.clear();

        dpLog.info(`[ResourceManager:${this.name}] Cleanup completed`);
    }

    /**
     * 获取资源统计
     */
    getStats(): { timers: number; intervals: number; processes: number; watchers: number } {
        return {
            timers: this.timers.size,
            intervals: this.intervals.size,
            processes: this.processes.size,
            watchers: this.watchers.size
        };
    }

    /**
     * 检查是否有资源泄露
     */
    hasLeaks(): boolean {
        const stats = this.getStats();
        return stats.timers > 0 || stats.intervals > 0 || stats.processes > 0 || stats.watchers > 0;
    }
}

/**
 * 全局资源管理器单例
 */
class GlobalResourceManager {
    private managers = new Map<string, ResourceManager>();

    getManager(name: string): ResourceManager {
        if (!this.managers.has(name)) {
            this.managers.set(name, new ResourceManager(name));
        }
        return this.managers.get(name)!;
    }

    cleanupAll(): void {
        dpLog.info('[GlobalResourceManager] Cleaning up all managers...');
        this.managers.forEach(manager => manager.cleanup());
        this.managers.clear();
    }

    getStats(): Record<string, { timers: number; intervals: number; processes: number; watchers: number }> {
        const stats: Record<string, { timers: number; intervals: number; processes: number; watchers: number }> = {};
        this.managers.forEach((manager, name) => {
            stats[name] = manager.getStats();
        });
        return stats;
    }
}

export const globalResourceManager = new GlobalResourceManager();

// 应用退出时清理所有资源
process.on('exit', () => {
    globalResourceManager.cleanupAll();
});

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
    dpLog.error('Uncaught exception:', error);
    globalResourceManager.cleanupAll();
    process.exit(1);
});

// 处理未处理的 Promise 拒绝
process.on('unhandledRejection', (reason, promise) => {
    dpLog.error('Unhandled rejection at:', promise, 'reason:', reason);
});