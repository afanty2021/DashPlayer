/**
 * 输入验证工具
 * 提供安全的输入验证和清理功能
 */

import path from 'path';
import { isValidVideoFile, isValidSubtitleFile, isValidAudioFile } from '@/common/utils/FileUtil';

/**
 * 验证文件路径是否安全
 */
export function validateFilePath(filePath: string, allowedExtensions?: string[]): boolean {
    if (!filePath || typeof filePath !== 'string') {
        return false;
    }

    // 检查路径遍历攻击
    if (filePath.includes('..') || filePath.includes('~')) {
        return false;
    }

    // 检查绝对路径（除非明确允许）
    if (path.isAbsolute(filePath)) {
        // 只允许用户主目录下的绝对路径
        if (!filePath.startsWith(process.env.HOME || '/Users/')) {
            return false;
        }
    }

    // 检查文件扩展名
    if (allowedExtensions && allowedExtensions.length > 0) {
        const ext = path.extname(filePath).toLowerCase();
        if (!allowedExtensions.includes(ext)) {
            return false;
        }
    }

    // 检查危险字符
    const dangerousChars = /[<>:"|?*]/;
    if (dangerousChars.test(filePath)) {
        return false;
    }

    return true;
}

/**
 * 验证音频文件路径
 */
export function validateAudioFilePath(filePath: string): boolean {
    const audioExtensions = ['.mp3', '.wav', '.m4a', '.flac', '.aac', '.ogg'];
    return validateFilePath(filePath, audioExtensions);
}

/**
 * 验证视频文件路径
 */
export function validateVideoFilePath(filePath: string): boolean {
    const videoExtensions = ['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.webm'];
    return validateFilePath(filePath, videoExtensions);
}

/**
 * 验证字幕文件路径
 */
export function validateSubtitleFilePath(filePath: string): boolean {
    const subtitleExtensions = ['.srt', '.vtt', '.ass'];
    return validateFilePath(filePath, subtitleExtensions);
}

/**
 * 清理字符串输入
 */
export function sanitizeInput(input: unknown): string {
    if (input === null || input === undefined) {
        return '';
    }

    if (typeof input !== 'string') {
        input = String(input);
    }

    // 移除潜在的 HTML/JavaScript 标签
    return input
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<[^>]*>/g, '')
        .trim();
}

/**
 * 验证 Python 路径
 */
export function validatePythonPath(pythonPath: string): boolean {
    if (!pythonPath || typeof pythonPath !== 'string') {
        return false;
    }

    // 只允许常见的 Python 命令
    const allowedCommands = ['python', 'python3', 'python3.8', 'python3.9', 'python3.10', 'python3.11'];

    // 如果是相对路径，检查命令名
    if (!path.isAbsolute(pythonPath)) {
        const command = path.basename(pythonPath);
        return allowedCommands.includes(command);
    }

    // 如果是绝对路径，验证路径安全性
    return validateFilePath(pythonPath);
}

/**
 * 验证 Whisper 模型名称
 */
export function validateWhisperModel(model: string): boolean {
    const validModels = ['tiny.en', 'base.en', 'small.en', 'medium.en', 'large-v3', 'large-v3-turbo'];
    return validModels.includes(model);
}

/**
 * 验证并发数设置
 */
export function validateConcurrency(concurrency: string | number): boolean {
    const num = typeof concurrency === 'string' ? parseInt(concurrency, 10) : concurrency;
    return Number.isInteger(num) && num >= 1 && num <= 4;
}

/**
 * 统一的验证错误类
 */
export class ValidationError extends Error {
    public readonly code: string;
    public readonly field: string;

    constructor(message: string, code: string, field: string) {
        super(message);
        this.name = 'ValidationError';
        this.code = code;
        this.field = field;
    }
}