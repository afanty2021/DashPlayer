/**
 * DashPlayer URL 处理工具类
 *
 * 职责：
 * - 管理自定义文件协议 (dp:// 和 dp-file://)
 * - 提供安全的文件路径编码和解码
 * - 处理跨平台路径转换
 * - 支持网络 URL 的智能拼接
 *
 * 协议说明：
 * - dp://: Base32 编码的文件路径，用于安全传递文件路径
 * - dp-file://: 直接文件路径，用于本地文件访问
 *
 * 安全特性：
 * - Base32 编码防止路径注入攻击
 * - 跨平台路径分隔符处理
 * - URL 编码确保安全性
 */

import * as base32 from 'hi-base32';
import PathUtil from '@/common/utils/PathUtil';

/**
 * DashPlayer 自定义协议常量
 * - DP: Base32 编码的文件协议
 * - DP_FILE: 直接文件访问协议
 */
export const DP = 'dp';
export const DP_FILE = 'dp-file';

/**
 * URL 工具类
 * 提供 DashPlayer 特有的 URL 处理功能
 */
export default class UrlUtil {
    /**
     * 创建 DashPlayer 自定义协议 URL (Base32 编码)
     *
     * 功能：
     * - 将文件路径转换为 Base32 编码的安全 URL
     * - 支持多路径参数的智能拼接
     * - 防止路径注入攻击
     * - 适合在网络环境中安全传递文件路径
     *
     * 使用场景：
     * - API 参数中的文件路径传递
     * - 跨进程的文件路径共享
     * - 需要安全编码的路径传输
     *
     * @param paths - 文件路径片段
     * @returns Base32 编码的 dp:// 协议 URL
     *
     * @example
     * ```typescript
     * UrlUtil.dp('/path/to/video.mp4')
     * // 返回: 'dp://MJQXGZDFON2HK5DFON2B...'
     *
     * UrlUtil.dp('/videos', 'movie', 'film.mp4')
     * // 返回: 'dp://...'
     * ```
     */
    public static dp(...paths: string[]) {
        // 使用 PathUtil 智能拼接路径，处理跨平台分隔符
        const url = PathUtil.join(...paths);

        // Base32 编码确保 URL 安全性，防止特殊字符问题
        return `${DP}://${base32.encode(url)}`;
    }

    /**
     * 创建 DashPlayer 文件协议 URL (直接路径)
     *
     * 功能：
     * - 创建直接的文件路径 URL
     * - 适用于本地文件系统访问
     * - 保持原始路径格式
     * - 高性能的路径访问
     *
     * 使用场景：
     * - 本地文件系统访问
     * - 性能要求高的路径处理
     * - 不需要编码的内部路径传递
     *
     * @param paths - 文件路径片段
     * @returns dp-file:// 协议 URL
     *
     * @example
     * ```typescript
     * UrlUtil.file('/Users/user/Videos/video.mp4')
     * // 返回: 'dp-file:///Users/user/Videos/video.mp4'
     * ```
     */
    public static file(...paths: string[]) {
        // 直接拼接路径，不进行编码
        const url = PathUtil.join(...paths);
        return `${DP_FILE}://${url}`;
    }

    /**
     * 智能拼接 Web URL
     *
     * 功能：
     * - 处理多个 URL 片段的智能拼接
     * - 自动处理协议、路径分隔符
     * - 清理多余的斜杠和路径字符
     * - 保持 URL 格式的正确性
     *
     * 处理逻辑：
     * 1. 移除空字符串片段
     * 2. 智能处理协议部分的双斜杠
     * 3. 正确拼接路径分隔符
     * 4. 清理多余的斜杠
     * 5. 保持查询参数和锚点的完整性
     *
     * @param paths - URL 路径片段
     * @returns 拼接后的完整 URL
     *
     * @example
     * ```typescript
     * UrlUtil.joinWebUrl('https://api.example.com', '/v1', '/users')
     * // 返回: 'https://api.example.com/v1/users'
     *
     * UrlUtil.joinWebUrl('https://example.com/', '/path/', '/file')
     * // 返回: 'https://example.com/path/file'
     * ```
     */
    public static joinWebUrl(...paths: string[]): string {
        // 1. 过滤掉空字符串路径片段
        const cleanPaths = paths.filter(path => path !== '');

        // 2. 获取第一个路径片段作为基础（可能包含协议）
        let result = cleanPaths[0] || '';

        // 3. 逐个处理剩余的路径片段
        for (let i = 1; i < cleanPaths.length; i++) {
            const segment = cleanPaths[i];

            if (result.endsWith('/')) {
                // 如果结果以 / 结尾，移除片段开头的 /
                result += segment.startsWith('/') ? segment.slice(1) : segment;
            } else {
                // 如果结果不以 / 结尾，确保片段以 / 开头
                result += segment.startsWith('/') ? segment : '/' + segment;
            }
        }

        // 4. 修复协议后的双斜杠问题（https://example.com -> https://example.com）
        result = result.replace(/^(https?:)\/+/, '$1//');

        // 5. 清理 URL 参数和锚点前的多余斜杠
        result = result.replace(/\/+([?#])/, '$1');

        // 6. 清理路径中间的多余斜杠（但保留协议后的双斜杠）
        result = result.replace(/([^:]\/)\/+/g, '$1');

        return result;
    }
}
