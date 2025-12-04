import { storeGet } from '@/backend/store';
import fs from 'fs';
import path from 'path';
import StrUtil from '@/common/utils/str-util';
import { Cancelable } from '@/common/interfaces';
import dpLog from '@/backend/ioc/logger';
import { WhisperResponseFormatError } from '@/backend/errors/errors';
import { WhisperResponse, WhisperResponseVerifySchema } from '@/common/types/video-info';
import { WaitRateLimit } from '@/common/utils/RateLimiter';
import { spawn, ChildProcess } from 'child_process';

/**
 * 本地 Whisper 请求类
 *
 * 功能：
 * - 通过 Python 脚本调用本地 Whisper 模型
 * - 支持模型选择和参数配置
 * - 处理进程管理和结果解析
 * - 支持任务取消
 */
class LocalWhisperRequest implements Cancelable {
    private readonly file: string;
    private readonly model: string;
    private pythonProcess: ChildProcess | null = null;

    constructor(file: string, model: string = 'medium.en') {
        this.file = file;
        this.model = model;
    }

    /**
     * 构建本地Whisper请求实例
     *
     * @param file 音频文件路径
     * @param model Whisper模型名称
     * @returns 请求实例或null（如果参数无效）
     */
    public static build(file: string, model?: string): LocalWhisperRequest | null {
        if (StrUtil.isBlank(file) || !fs.existsSync(file)) {
            dpLog.error(`[LocalWhisperRequest] 音频文件不存在: ${file}`);
            return null;
        }

        // 检查Python环境是否可用
        const pythonPath = storeGet('whisper.local.pythonPath') || 'python3';
        try {
            const result = require('child_process').spawnSync(pythonPath, ['--version'], { encoding: 'utf8' });
            if (result.error) {
                dpLog.error(`[LocalWhisperRequest] Python环境不可用: ${result.error.message}`);
                return null;
            }
        } catch (error) {
            dpLog.error(`[LocalWhisperRequest] 检查Python环境失败:`, error);
            return null;
        }

        return new LocalWhisperRequest(file, model);
    }

    /**
     * 执行Whisper转录
     *
     * @returns Promise<WhisperResponse> 转录结果
     */
    @WaitRateLimit('local-whisper')
    public async invoke(): Promise<WhisperResponse> {
        this.cancel(); // 取消之前的进程

        const pythonPath = storeGet('whisper.local.pythonPath') || 'python3';
        const scriptPath = path.join(__dirname, '..', 'scripts', 'whisper_runner.py');

        dpLog.info(`[LocalWhisperRequest] 开始转录: ${this.file} (模型: ${this.model})`);

        return new Promise((resolve, reject) => {
            let output = '';
            let errorOutput = '';

            this.pythonProcess = spawn(pythonPath, [
                scriptPath,
                this.file,
                '--model', this.model,
                '--language', 'en',
                '--task', 'transcribe',
                '--output-format', 'json'
            ]);

            this.pythonProcess.stdout?.on('data', (data) => {
                output += data.toString();
            });

            this.pythonProcess.stderr?.on('data', (data) => {
                errorOutput += data.toString();
                dpLog.warn(`[LocalWhisperRequest] stderr: ${data.toString()}`);
            });

            this.pythonProcess.on('close', (code) => {
                this.pythonProcess = null;

                if (code === 0) {
                    try {
                        // 解析JSON输出
                        const jsonOutput = (output || '').trim();
                        if (!jsonOutput) {
                            throw new Error('Whisper输出为空');
                        }

                        const result = JSON.parse(jsonOutput);

                        // 验证返回格式
                        const parseRes = WhisperResponseVerifySchema.safeParse(result);
                        if (!parseRes.success) {
                            dpLog.error('[LocalWhisperRequest] Whisper返回格式无效:', parseRes.error.errors);
                            throw new WhisperResponseFormatError();
                        }

                        dpLog.info(`[LocalWhisperRequest] 转录完成: ${result.text?.substring(0, 50)}...`);
                        resolve(result);
                    } catch (error) {
                        dpLog.error('[LocalWhisperRequest] 解析Whisper结果失败:', error);
                        reject(new Error(`解析转录结果失败: ${error instanceof Error ? error.message : String(error)}`));
                    }
                } else {
                    const errorMessage = `Whisper进程退出，代码: ${code}${errorOutput ? ', 错误: ' + (errorOutput || '').trim() : ''}`;
                    dpLog.error(`[LocalWhisperRequest] ${errorMessage}`);
                    reject(new Error(errorMessage));
                }
            });

            this.pythonProcess.on('error', (error) => {
                this.pythonProcess = null;
                dpLog.error('[LocalWhisperRequest] 启动Whisper进程失败:', error);
                reject(new Error(`启动Whisper失败: ${error.message}`));
            });
        });
    }

    /**
     * 取消当前的转录任务
     */
    public cancel(): void {
        if (this.pythonProcess) {
            dpLog.info('[LocalWhisperRequest] 取消转录任务');
            this.pythonProcess.kill('SIGTERM');
            this.pythonProcess = null;
        }
    }
}

export default LocalWhisperRequest;