/**
 * DashPlayer OpenAI 服务实现
 *
 * 职责：
 * - 管理 OpenAI API 客户端实例
 * - 处理 API 密钥和端点配置
 * - 提供语音转文字服务
 * - 支持 GPT 模型文本生成
 *
 * 技术特性：
 * - 智能客户端缓存和复用
 * - 配置变更自动重建客户端
 * - 错误处理和异常管理
 * - 支持 OpenAI 兼容端点
 */

import { OpenAiService } from '@/backend/services/OpenAiService';
import OpenAI from 'openai';
import { injectable } from 'inversify';
import { storeGet } from '@/backend/store';
import StrUtil from '@/common/utils/str-util';
import fs from "fs";
import { TranscriptionVerbose } from 'openai/src/resources/audio/transcriptions';

/**
 * OpenAI 服务实现类
 * 使用 @injectable 装饰器支持依赖注入
 */
@injectable()
export class OpenAIServiceImpl implements OpenAiService {
    /**
     * OpenAI 客户端实例
     * 使用懒加载模式，仅在需要时创建
     */
    private openai: OpenAI | null = null;

    /**
     * 当前 API 密钥缓存
     * 用于检测配置变更，必要时重新创建客户端
     */
    private apiKey: string | null = null;

    /**
     * 当前 API 端点缓存
     * 用于检测配置变更，必要时重新创建客户端
     */
    private endpoint: string | null = null;

    /**
     * 获取 OpenAI 客户端实例
     *
     * 功能：
     * - 从配置中读取 API 密钥和端点
     * - 检查配置完整性，缺失时抛出异常
     * - 实现智能缓存，避免重复创建客户端
     * - 配置变更时自动重建客户端实例
     *
     * 缓存策略：
     * - 只有当 API 密钥或端点发生变更时才重新创建
     * - 配置验证失败时抛出明确的错误信息
     *
     * @returns 配置好的 OpenAI 客户端实例
     * @throws 当 API 密钥或端点未配置时抛出错误
     */
    public getOpenAi(): OpenAI {
        // 从应用设置中获取 OpenAI API 配置
        const ak = storeGet('apiKeys.openAi.key');       // API 密钥
        const ep = storeGet('apiKeys.openAi.endpoint'); // API 端点

        // 验证配置完整性
        if (StrUtil.hasBlank(ak, ep)) {
            throw new Error('未设置 OpenAI 密钥或端点');
        }

        // 智能缓存检查：只有配置变更时才重新创建客户端
        if (this.openai && this.apiKey === ak && this.endpoint === ep) {
            return this.openai; // 返回缓存的客户端实例
        }

        // 配置发生变更，重建客户端实例
        this.apiKey = ak;    // 更新密钥缓存
        this.endpoint = ep;  // 更新端点缓存

        // 创建新的 OpenAI 客户端实例
        this.openai = new OpenAI({
            baseURL: ep + '/v1',  // 设置 API 基础 URL
            apiKey: ak            // 设置 API 密钥
        });

        return this.openai;
    }
}
