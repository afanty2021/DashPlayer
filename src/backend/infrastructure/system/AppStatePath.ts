import path from 'path';
import { app } from 'electron';

/**
 * 应用内部状态目录类型。
 */
export enum AppStateDirectoryType {
    DATA = 'data',
    LOGS = 'logs',
}

/**
 * 获取应用内部状态根目录。
 * @returns Electron `userData` 目录。
 */
export function getAppStateBasePath(): string {
    return app.getPath('userData');
}

/**
 * 获取应用内部状态子目录。
 * @param type 内部状态目录类型。
 * @returns 对应绝对路径。
 */
export function getAppStatePath(type: AppStateDirectoryType): string {
    return path.join(getAppStateBasePath(), type);
}
