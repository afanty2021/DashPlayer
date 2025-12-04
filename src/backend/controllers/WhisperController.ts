import registerRoute from '@/common/api/register';
import Controller from '@/backend/interfaces/controller';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { storeGet } from '@/backend/store';
import dpLog from '@/backend/ioc/logger';
import { injectable } from 'inversify';
import {
    validateFilePath,
    validateAudioFilePath,
    validatePythonPath,
    validateWhisperModel,
    validateConcurrency,
    ValidationError
} from '@/backend/utils/validation';
import { ErrorHandler, BusinessError, FileNotFoundError, ValidationError as ValidationErrorError } from '@/backend/errors/BusinessError';
import { globalResourceManager } from '@/backend/utils/ResourceManager';

@injectable()
export default class WhisperController implements Controller {
    private resourceManager = globalResourceManager.getManager('WhisperController');

    public registerRoutes(): void {
        registerRoute('whisper:test-environment', (p) => this.testEnvironment(p));
        registerRoute('whisper:install', (p) => this.install(p));
        registerRoute('whisper:get-available-models', () => this.getAvailableModels());
        registerRoute('whisper:test-transcription', (p) => this.testTranscription(p));
    }

    /**
     * 测试Python环境和Whisper依赖
     */
    async testEnvironment(params: { pythonPath?: string }): Promise<{ success: boolean; error?: string }> {
        return ErrorHandler.handleAsync(async () => {
            // 验证输入参数
            const pythonPath = params.pythonPath || storeGet('whisper.local.pythonPath') || 'python3';

            if (!validatePythonPath(pythonPath)) {
                throw new ValidationErrorError('pythonPath', '无效的 Python 路径');
            }

            // 测试Python是否可用
            const pythonResult = await this.executeCommand(pythonPath, ['--version']);
            if (!pythonResult.success) {
                throw new BusinessError('Python不可用，请确保Python已正确安装', 'PYTHON_UNAVAILABLE');
            }

            // 测试whisper是否已安装
            const whisperResult = await this.executeCommand(pythonPath, ['-c', 'import whisper; print(whisper.__version__)']);
            if (!whisperResult.success) {
                throw new BusinessError('Whisper未安装，请先运行：pip install openai-whisper torch', 'WHISPER_NOT_INSTALLED');
            }

            // 测试torch是否已安装
            const torchResult = await this.executeCommand(pythonPath, ['-c', 'import torch; print(torch.__version__)']);
            if (!torchResult.success) {
                throw new BusinessError('PyTorch未安装，请先运行：pip install torch torchaudio', 'TORCH_NOT_INSTALLED');
            }

            // 测试Apple Silicon GPU支持（如果可用）
            const mpsResult = await this.executeCommand(pythonPath, [
                '-c',
                'import torch; print("MPS可用" if torch.backends.mps.is_available() else "MPS不可用")'
            ]);

            const gpuInfo = mpsResult.success ? (mpsResult.output || '').trim() : 'GPU检测失败';

            dpLog.info(`[WhisperController] 环境检测成功: Python=${(pythonResult.output || '').trim()}, Whisper=${(whisperResult.output || '').trim()}, PyTorch=${(torchResult.output || '').trim()}, ${gpuInfo}`);

            return {
                success: true,
                message: '环境检测成功，所有依赖已就绪'
            };
        }, { method: 'testEnvironment', params });
    }

    /**
     * 安装Whisper依赖
     */
    async install(params: { pythonPath?: string }): Promise<{ success: boolean; error?: string }> {
        const pythonPath = params.pythonPath || storeGet('whisper.local.pythonPath') || 'python3';

        try {
            // 安装whisper
            dpLog.info(`[WhisperController] 开始安装Whisper和PyTorch...`);

            const whisperResult = await this.executeCommand(pythonPath, [
                '-m', 'pip', 'install', 'openai-whisper', 'torch', 'torchaudio'
            ], { timeout: 300000 }); // 5分钟超时

            if (!whisperResult.success) {
                return { success: false, error: '安装失败: ' + whisperResult.error };
            }

            dpLog.info(`[WhisperController] Whisper安装成功`);

            // 验证安装
            const testResult = await this.testEnvironment({ pythonPath });
            return testResult;

        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : '未知错误';
            dpLog.error(`[WhisperController] 安装失败: ${errorMsg}`);
            return { success: false, error: errorMsg };
        }
    }

    /**
     * 获取可用的Whisper模型列表
     */
    async getAvailableModels(): Promise<{ models: string[], current: string }> {
        return {
            models: ['tiny.en', 'base.en', 'small.en', 'medium.en', 'large-v3', 'large-v3-turbo'],
            current: storeGet('whisper.local.model') || 'medium.en'
        };
    }

    /**
     * 测试Whisper转录
     */
    async testTranscription(params: {
        audioFile: string;
        model?: string;
        pythonPath?: string;
    }): Promise<{ success: boolean; result?: any; error?: string }> {
        const pythonPath = params.pythonPath || storeGet('whisper.local.pythonPath') || 'python3';
        const model = params.model || storeGet('whisper.local.model') || 'medium.en';
        const scriptPath = path.join(__dirname, '..', 'scripts', 'whisper_runner.py');

        try {
            if (!fs.existsSync(scriptPath)) {
                return { success: false, error: 'Whisper脚本不存在' };
            }

            if (!fs.existsSync(params.audioFile)) {
                return { success: false, error: '音频文件不存在' };
            }

            const result = await this.executeCommand(pythonPath, [
                scriptPath,
                params.audioFile,
                '--model', model,
                '--output-format', 'json'
            ], { timeout: 120000 }); // 2分钟超时

            if (!result.success) {
                return { success: false, error: result.error };
            }

            // 尝试解析JSON结果
            try {
                const jsonResult = JSON.parse(result.output);
                return { success: true, result: jsonResult };
            } catch (parseError) {
                return { success: false, error: '解析结果失败: ' + result.output };
            }

        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : '未知错误';
            return { success: false, error: errorMsg };
        }
    }

    /**
     * 执行命令的辅助方法
     */
    private async executeCommand(
        command: string,
        args: string[],
        options: { timeout?: number } = {}
    ): Promise<{ success: boolean; output: string; error?: string }> {
        return new Promise((resolve) => {
            const child = spawn(command, args);
            let output = '';
            let errorOutput = '';

            // 使用资源管理器管理子进程
            this.resourceManager.addProcess(child);

            child.stdout?.on('data', (data) => {
                output += data.toString();
            });

            child.stderr?.on('data', (data) => {
                errorOutput += data.toString();
            });

            const timeout = options.timeout || 60000; // 默认1分钟超时
            const timer = setTimeout(() => {
                child.kill('SIGTERM');
                resolve({
                    success: false,
                    output: '',
                    error: `命令执行超时 (${timeout}ms)`
                });
            }, timeout);

            // 使用资源管理器管理定时器
            this.resourceManager.addTimer(timer);

            child.on('close', (code) => {
                clearTimeout(timer);

                if (code === 0) {
                    resolve({
                        success: true,
                        output: (output || '').trim(),
                        error: (errorOutput || '').trim() || undefined
                    });
                } else {
                    resolve({
                        success: false,
                        output: (output || '').trim(),
                        error: (errorOutput || '').trim() || `进程退出，代码: ${code}`
                    });
                }
            });

            child.on('error', (error) => {
                clearTimeout(timer);
                resolve({
                    success: false,
                    output: '',
                    error: error.message
                });
            });
        });
    }

    /**
     * 清理资源
     */
    dispose(): void {
        this.resourceManager.cleanup();
    }
}