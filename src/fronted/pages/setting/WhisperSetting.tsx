import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/fronted/components/ui/card";
import { Button } from "@/fronted/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/fronted/components/ui/select";
import { Switch } from "@/fronted/components/ui/switch";
import { Input } from "@/fronted/components/ui/input";
import { Label } from "@/fronted/components/ui/label";
import { Badge } from "@/fronted/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/fronted/components/ui/alert";
import { Settings, Info, CheckCircle, XCircle, Cpu } from 'lucide-react';
import { WHISPER_MODELS, WhisperModel } from '@/common/types/whisper';
import useSettingForm from '@/fronted/hooks/useSettingForm';

// API接口声明
declare global {
    interface Window {
        electron: {
            invoke: <K extends keyof import('@/common/api/api-def').ApiDefinitions>(
                channel: K,
                ...args: Parameters<import('@/common/api/api-def').ApiMap[K]>
            ) => ReturnType<import('@/common/api/api-def').ApiMap[K]>;
        };
    }
}

const WhisperSetting: React.FC = () => {
    const { setting, setSettingFunc, submit } = useSettingForm([
        'whisper.provider',
        'whisper.local.model',
        'whisper.local.pythonPath',
        'whisper.local.enableCache',
        'whisper.local.maxConcurrency',
        'whisper.local.device'
    ]);

    // 直接使用 useSettingForm 的 setting，不创建本地状态
    const provider = setting('whisper.provider') || 'openai';
    const localModel = setting('whisper.local.model') || 'medium.en';
    const pythonPath = setting('whisper.local.pythonPath') || '';
    const enableCache = setting('whisper.local.enableCache') === 'true';
    const maxConcurrency = setting('whisper.local.maxConcurrency') || '2';

    const [testingEnvironment, setTestingEnvironment] = useState(false);
    const [environmentStatus, setEnvironmentStatus] = useState<'unknown' | 'success' | 'error'>('unknown');
    const [environmentMessage, setEnvironmentMessage] = useState('');

    // 测试Python环境
    const testPythonEnvironment = async () => {
        setTestingEnvironment(true);
        setEnvironmentStatus('unknown');
        setEnvironmentMessage('');

        try {
            // 这里应该调用后端API来测试Python环境
            const result = await window.electron.invoke('whisper:test-environment', {
                pythonPath: pythonPath || 'python3'
            });

            if (result.success) {
                setEnvironmentStatus('success');
                setEnvironmentMessage('Python环境检测成功，Whisper依赖已安装');
            } else {
                setEnvironmentStatus('error');
                setEnvironmentMessage(result.error || '环境检测失败');
            }
        } catch (error) {
            setEnvironmentStatus('error');
            setEnvironmentMessage(`测试失败: ${error instanceof Error ? error.message : '未知错误'}`);
        } finally {
            setTestingEnvironment(false);
        }
    };

    // 安装Whisper依赖
    const installWhisper = async () => {
        try {
            const result = await window.electron.invoke('whisper:install', {
                pythonPath: pythonPath || 'python3'
            });

            if (result.success) {
                setEnvironmentStatus('success');
                setEnvironmentMessage('Whisper安装成功！');
                await testPythonEnvironment();
            } else {
                setEnvironmentStatus('error');
                setEnvironmentMessage(result.error || '安装失败');
            }
        } catch (error) {
            setEnvironmentStatus('error');
            setEnvironmentMessage(`安装失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    };

    // 初始化时测试环境
    useEffect(() => {
        if (provider === 'local') {
            testPythonEnvironment();
        }
    }, []);

    return (
        <div className="space-y-6 pb-6 pr-4">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">语音识别设置</h2>
                <p className="text-muted-foreground">
                    配置Whisper语音识别服务，支持OpenAI API和本地模型
                </p>
            </div>

            {/* 服务提供商选择 */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        服务提供商
                    </CardTitle>
                    <CardDescription>
                        选择语音识别服务的提供商
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="provider">识别服务</Label>
                        <Select value={provider} onValueChange={(value: 'openai' | 'local') => {
                            setSettingFunc('whisper.provider')(value);
                            submit(); // 立即保存设置
                        }}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="openai">
                                    OpenAI Whisper API
                                    <Badge variant="outline" className="ml-2">云端</Badge>
                                </SelectItem>
                                <SelectItem value="local">
                                    本地 Whisper 模型
                                    <Badge variant="outline" className="ml-2">离线</Badge>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="text-sm text-muted-foreground">
                        {provider === 'openai' ? (
                            <div className="space-y-2">
                                <p>• 需要在OpenAI设置中配置API密钥</p>
                                <p>• 按使用量计费，成本较高</p>
                                <p>• 稳定可靠，无需本地资源</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <p>• 完全免费，本地运行</p>
                                <p>• 需要安装Python和Whisper依赖</p>
                                <p>• 支持多种模型，保护数据隐私</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* 本地Whisper配置 */}
            {provider === 'local' && (
                <>
                    {/* 环境检测 */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Cpu className="h-5 w-5" />
                                环境检测
                            </CardTitle>
                            <CardDescription>
                                检查Python环境和Whisper依赖
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <Label>Python路径</Label>
                                    <Input
                                        value={pythonPath}
                                        onChange={(e) => {
                                            setSettingFunc('whisper.local.pythonPath')(e.target.value);
                                            submit(); // 立即保存设置
                                        }}
                                        placeholder="python3"
                                        className="w-64"
                                    />
                                </div>
                                <Button
                                    onClick={testPythonEnvironment}
                                    disabled={testingEnvironment}
                                    variant="outline"
                                >
                                    {testingEnvironment ? '检测中...' : '测试环境'}
                                </Button>
                            </div>

                            {environmentStatus !== 'unknown' && (
                                <Alert className={environmentStatus === 'success' ? 'border-green-500' : 'border-red-500'}>
                                    {environmentStatus === 'success' ? (
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                    ) : (
                                        <XCircle className="h-4 w-4 text-red-500" />
                                    )}
                                    <AlertTitle>
                                        {environmentStatus === 'success' ? '环境正常' : '环境异常'}
                                    </AlertTitle>
                                    <AlertDescription>{environmentMessage}</AlertDescription>
                                </Alert>
                            )}

                            {environmentStatus === 'error' && (
                                <Alert>
                                    <Info className="h-4 w-4" />
                                    <AlertTitle>安装提示</AlertTitle>
                                    <AlertDescription>
                                        <p>如果Whisper未安装，请在终端运行：</p>
                                        <code className="bg-muted p-2 rounded block mt-2">
                                            pip install openai-whisper torch
                                        </code>
                                        <Button onClick={installWhisper} className="mt-2" variant="outline" size="sm">
                                            自动安装
                                        </Button>
                                    </AlertDescription>
                                </Alert>
                            )}
                        </CardContent>
                    </Card>

                    {/* 模型配置 */}
                    <Card>
                        <CardHeader>
                            <CardTitle>模型配置</CardTitle>
                            <CardDescription>
                                选择适合您需求的Whisper模型
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="model">Whisper模型</Label>
                                <Select value={localModel} onValueChange={(value: WhisperModel) => {
                                    setSettingFunc('whisper.local.model')(value);
                                    submit(); // 立即保存设置
                                }}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(WHISPER_MODELS).map(([key, model]) => (
                                            <SelectItem key={key} value={key}>
                                                <div className="flex flex-col items-start">
                                                    <div className="flex items-center gap-2">
                                                        {model.name}
                                                        <Badge variant={
                                                            model.speed === 'fast' ? 'default' :
                                                            model.speed === 'medium' ? 'secondary' : 'outline'
                                                        }>
                                                            {model.speed}
                                                        </Badge>
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {model.size} • {model.ramRequired}
                                                    </div>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {localModel && WHISPER_MODELS[localModel] && (
                                <Alert>
                                    <Info className="h-4 w-4" />
                                    <AlertTitle>模型信息</AlertTitle>
                                    <AlertDescription>
                                        <div className="space-y-2">
                                            <p><strong>描述:</strong> {WHISPER_MODELS[localModel].description}</p>
                                            <p><strong>适用场景:</strong> {WHISPER_MODELS[localModel].recommendedFor}</p>
                                            <p><strong>模型大小:</strong> {WHISPER_MODELS[localModel].size}</p>
                                            <p><strong>内存需求:</strong> {WHISPER_MODELS[localModel].ramRequired}</p>
                                            <p><strong>准确率:</strong> {
                                                WHISPER_MODELS[localModel].accuracy === 'excellent' ? '优秀' :
                                                WHISPER_MODELS[localModel].accuracy === 'good' ? '良好' : '基础'
                                            }</p>
                                        </div>
                                    </AlertDescription>
                                </Alert>
                            )}
                        </CardContent>
                    </Card>

                    {/* 高级设置 */}
                    <Card>
                        <CardHeader>
                            <CardTitle>高级设置</CardTitle>
                            <CardDescription>
                                本地Whisper的高级配置选项
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>启用模型缓存</Label>
                                    <p className="text-sm text-muted-foreground">
                                        缓存下载的模型以避免重复下载
                                    </p>
                                </div>
                                <Switch
                                    checked={enableCache}
                                    onCheckedChange={(checked) => {
                                        setSettingFunc('whisper.local.enableCache')(checked.toString());
                                        submit(); // 立即保存设置
                                    }}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="concurrency">最大并发数</Label>
                                <Input
                                    id="concurrency"
                                    type="number"
                                    min="1"
                                    max="4"
                                    value={maxConcurrency}
                                    onChange={(e) => {
                                        setSettingFunc('whisper.local.maxConcurrency')(e.target.value);
                                        submit(); // 立即保存设置
                                    }}
                                    className="w-32"
                                />
                                <p className="text-sm text-muted-foreground">
                                    同时执行的转录任务数量（建议1-2，根据CPU核心数调整）
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
};

export default WhisperSetting;