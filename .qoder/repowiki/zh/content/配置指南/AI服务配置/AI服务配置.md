# AI服务配置

<cite>
**本文档中引用的文件**  
- [SettingType.ts](file://src/common/types/SettingType.ts)
- [OpenAiSetting.tsx](file://src/fronted/pages/setting/OpenAiSetting.tsx)
- [YouDaoSetting.tsx](file://src/fronted/pages/setting/YouDaoSetting.tsx)
- [AiProviderServiceImpl.ts](file://src/backend/services/impl/clients/AiProviderServiceImpl.ts)
- [TencentProvider.ts](file://src/backend/services/impl/clients/TencentProvider.ts)
- [YouDaoProvider.ts](file://src/backend/services/impl/clients/YouDaoProvider.ts)
- [OpenAiWhisperRequest.ts](file://src/backend/objs/OpenAiWhisperRequest.ts)
- [OpenAiTtsRequest.ts](file://src/backend/objs/OpenAiTtsRequest.ts)
- [WhisperServiceImpl.ts](file://src/backend/services/impl/WhisperServiceImpl.ts)
- [TranslateServiceImpl.ts](file://src/backend/services/impl/TranslateServiceImpl.ts)
- [OpenAIServiceImpl.ts](file://src/backend/services/impl/OpenAIServiceImpl.ts)
- [store_schema.ts](file://src/common/types/store_schema.ts)
- [Config-OpenAI-API.md](file://Writerside/topics/Config-OpenAI-API.md)
- [Config-YouDao-API.md](file://Writerside/topics/Config-YouDao-API.md)
- [Config-Tencent-API.md](file://Writerside/topics/Config-Tencent-API.md)
- [LOCAL_WHISPER_README.md](file://LOCAL_WHISPER_README.md)
- [WHISPER_IMPLEMENTATION_SUMMARY.md](file://WHISPER_IMPLEMENTATION_SUMMARY.md)
- [WhisperSetting.tsx](file://src/fronted/pages/setting/WhisperSetting.tsx)
- [LocalWhisperRequest.ts](file://src/backend/objs/LocalWhisperRequest.ts)
- [whisper_runner.py](file://src/backend/scripts/whisper_runner.py)
</cite>

## 更新摘要
**变更内容**  
- 在“AI提供商配置概览”中新增本地Whisper服务的配置说明
- 新增“本地Whisper配置”章节，详细说明本地服务的切换、模型选择、资源管理及错误处理
- 更新“配置测试与故障排查”章节，增加本地Whisper的测试方法和常见错误
- 更新“性能优化建议”章节，增加本地模型的性能优化建议
- 更新“前端配置界面交互逻辑”章节，增加WhisperSetting.tsx的交互说明

## 目录
1. [简介](#简介)
2. [AI提供商配置概览](#ai提供商配置概览)
3. [OpenAI 配置](#openai-配置)
4. [腾讯云 配置](#腾讯云-配置)
5. [有道 配置](#有道-配置)
6. [本地Whisper配置](#本地whisper配置)
7. [功能应用场景](#功能应用场景)
8. [配置测试与故障排查](#配置测试与故障排查)
9. [性能优化建议](#性能优化建议)
10. [前端配置界面交互逻辑](#前端配置界面交互逻辑)

## 简介
DashPlayer 是一款专为英语学习设计的视频播放器，集成了多种AI服务以增强学习体验。本配置文档旨在详细说明如何集成和配置 OpenAI、腾讯云和有道三大AI提供商的服务，涵盖API密钥设置、模型选择、区域配置、应用场景及故障排查等内容，帮助用户充分发挥AI功能。

## AI提供商配置概览
DashPlayer 支持四种主要AI服务提供商：OpenAI、腾讯云、有道和本地Whisper。每种服务通过独立的配置项进行管理，配置信息存储在全局设置中，并通过类型定义 `SettingType` 进行约束。

```mermaid
graph TD
A[AI服务配置] --> B[OpenAI]
A --> C[腾讯云]
A --> D[有道]
A --> E[本地Whisper]
B --> B1[API密钥]
B --> B2[API端点]
B --> B3[模型选择]
B --> B4[流式响应]
C --> C1[SecretId]
C --> C2[SecretKey]
D --> D1[SecretId]
D --> D2[SecretKey]
E --> E1[Python路径]
E --> E2[模型选择]
E --> E3[设备类型]
E --> E4[并发数]
```

**Diagram sources**
- [SettingType.ts](file://src/common/types/SettingType.ts)
- [store_schema.ts](file://src/common/types/store_schema.ts)

**Section sources**
- [SettingType.ts](file://src/common/types/SettingType.ts)
- [store_schema.ts](file://src/common/types/store_schema.ts)

## OpenAI 配置
OpenAI 提供强大的语言模型和语音识别功能，用于字幕生成、AI整句学习和TTS（文本转语音）。

### 配置项说明
| 配置项 | 字段名 | 数据类型 | 验证规则 | 默认值 |
|--------|--------|----------|----------|--------|
| API密钥 | `apiKeys.openAi.key` | string | 非空，以 `sk-` 开头 | 无 |
| API端点 | `apiKeys.openAi.endpoint` | string | 有效URL格式 | `https://api.openai.com` |
| 模型选择 | `model.gpt.default` | string | 必须为支持的模型名 | `gpt-4o-mini` |
| 流式响应 | `apiKeys.openAi.stream` | string | 取值为 'on' 或 'off' | `on` |

### 获取API密钥步骤
1. 访问 [OpenAI 官网](https://www.openai.com/) 或使用第三方中转服务（如 one.gptnb.me）。
2. 注册账户并完成支付。
3. 在账户设置中生成API密钥。
4. 将密钥和端点填入 DashPlayer 设置界面。

### 应用场景
- **字幕生成**：调用 `Whisper` 模型将音频转录为SRT字幕。
- **AI整句学习**：使用 `gpt-3.5-turbo` 或 `gpt-4o` 分析句子语法、生成例句。
- **TTS**：通过 `tts-1` 模型生成单词或句子的语音。

```mermaid
sequenceDiagram
participant 用户
participant OpenAiSetting as OpenAiSetting.tsx
participant Store as 设置存储
participant OpenAiService as OpenAIServiceImpl
participant Whisper as WhisperServiceImpl
participant TTS as OpenAiTtsRequest
用户->>OpenAiSetting : 输入密钥并保存
OpenAiSetting->>Store : 存储配置
用户->>Whisper : 请求生成字幕
Whisper->>OpenAiService : 获取OpenAI客户端
OpenAiService->>Store : 读取密钥和端点
OpenAiService-->>Whisper : 返回客户端
Whisper->>Whisper : 调用Whisper API
Whisper-->>用户 : 返回SRT字幕
用户->>TTS : 请求单词发音
TTS->>Store : 读取密钥和端点
TTS->>OpenAI API : 发送TTS请求
OpenAI API-->>TTS : 返回MP3音频
TTS-->>用户 : 播放发音
```

**Diagram sources**
- [OpenAiSetting.tsx](file://src/fronted/pages/setting/OpenAiSetting.tsx)
- [OpenAIServiceImpl.ts](file://src/backend/services/impl/OpenAIServiceImpl.ts)
- [WhisperServiceImpl.ts](file://src/backend/services/impl/WhisperServiceImpl.ts)
- [OpenAiWhisperRequest.ts](file://src/backend/objs/OpenAiWhisperRequest.ts)
- [OpenAiTtsRequest.ts](file://src/backend/objs/OpenAiTtsRequest.ts)

**Section sources**
- [OpenAiSetting.tsx](file://src/fronted/pages/setting/OpenAiSetting.tsx)
- [OpenAIServiceImpl.ts](file://src/backend/services/impl/OpenAIServiceImpl.ts)
- [WhisperServiceImpl.ts](file://src/backend/services/impl/WhisperServiceImpl.ts)
- [OpenAiWhisperRequest.ts](file://src/backend/objs/OpenAiWhisperRequest.ts)
- [OpenAiTtsRequest.ts](file://src/backend/objs/OpenAiTtsRequest.ts)
- [Config-OpenAI-API.md](file://Writerside/topics/Config-OpenAI-API.md)

## 腾讯云 配置
腾讯云提供机器翻译服务，用于字幕的中英互译。

### 配置项说明
| 配置项 | 字段名 | 数据类型 | 验证规则 | 默认值 |
|--------|--------|----------|----------|--------|
| SecretId | `apiKeys.tencent.secretId` | string | 非空 | 无 |
| SecretKey | `apiKeys.tencent.secretKey` | string | 非空 | 无 |

### 获取API密钥步骤
1. 登录 [腾讯云官网](https://cloud.tencent.com/)。
2. 完成个人实名认证。
3. 进入 [访问管理](https://console.cloud.tencent.com/cam/capi) 创建子账号。
4. 为子账号授予“机器翻译”权限。
5. 获取 `SecretId` 和 `SecretKey` 并填入设置。

### 应用场景
- **字幕翻译**：将英文SRT字幕翻译为中文，或反之。

```mermaid
sequenceDiagram
participant 用户
participant TencentSetting as TencentProvider
participant Store as 设置存储
participant TranslateService as TranslateServiceImpl
用户->>TencentSetting : 输入密钥
TencentSetting->>Store : 存储密钥
用户->>TranslateService : 请求翻译句子
TranslateService->>TencentSetting : 获取腾讯客户端
TencentSetting->>Store : 读取密钥
TencentSetting-->>TranslateService : 返回客户端
TranslateService->>腾讯API : 发送翻译请求
腾讯API-->>TranslateService : 返回翻译结果
TranslateService-->>用户 : 显示翻译
```

**Diagram sources**
- [TencentProvider.ts](file://src/backend/services/impl/clients/TencentProvider.ts)
- [TranslateServiceImpl.ts](file://src/backend/services/impl/TranslateServiceImpl.ts)

**Section sources**
- [TencentProvider.ts](file://src/backend/services/impl/clients/TencentProvider.ts)
- [TranslateServiceImpl.ts](file://src/backend/services/impl/TranslateServiceImpl.ts)
- [Config-Tencent-API.md](file://Writerside/topics/Config-Tencent-API.md)

## 有道 配置
有道提供文本翻译和语音合成功能，用于单词查询和发音。

### 配置项说明
| 配置项 | 字段名 | 数据类型 | 验证规则 | 默认值 |
|--------|--------|----------|----------|--------|
| AppKey (SecretId) | `apiKeys.youdao.secretId` | string | 非空 | 无 |
| SecretKey | `apiKeys.youdao.secretKey` | string | 非空 | 无 |

### 获取API密钥步骤
1. 访问 [有道智云 AI 开放平台](http://ai.youdao.com)。
2. 注册并登录。
3. 创建应用，选择“文本翻译”和“语音合成”服务。
4. 在应用总览中获取 `应用ID` 和 `密钥`。
5. 将 `应用ID` 填入 `SecretId`，`密钥` 填入 `SecretKey`。

### 应用场景
- **查单词**：鼠标悬停在字幕单词上，调用有道API查询释义。
- **单词发音**：调用TTS服务播放单词发音。

```mermaid
sequenceDiagram
participant 用户
participant YouDaoSetting as YouDaoSetting.tsx
participant Store as 设置存储
participant YouDaoService as YouDaoProvider
participant TranslateService as TranslateServiceImpl
用户->>YouDaoSetting : 输入密钥
YouDaoSetting->>Store : 存储密钥
用户->>TranslateService : 查询单词
TranslateService->>YouDaoService : 获取有道客户端
YouDaoService->>Store : 读取密钥
YouDaoService-->>TranslateService : 返回客户端
TranslateService->>有道API : 发送翻译请求
有道API-->>TranslateService : 返回JSON结果
TranslateService-->>用户 : 显示释义
```

**Diagram sources**
- [YouDaoSetting.tsx](file://src/fronted/pages/setting/YouDaoSetting.tsx)
- [YouDaoProvider.ts](file://src/backend/services/impl/clients/YouDaoProvider.ts)
- [TranslateServiceImpl.ts](file://src/backend/services/impl/TranslateServiceImpl.ts)

**Section sources**
- [YouDaoSetting.tsx](file://src/fronted/pages/setting/YouDaoSetting.tsx)
- [YouDaoProvider.ts](file://src/backend/services/impl/clients/YouDaoProvider.ts)
- [TranslateServiceImpl.ts](file://src/backend/services/impl/TranslateServiceImpl.ts)
- [Config-YouDao-API.md](file://Writerside/topics/Config-YouDao-API.md)

## 本地Whisper配置
DashPlayer 现已支持本地 Whisper 语音识别，允许用户完全离线进行语音转录，无需依赖外部 API。

### 本地与云端服务切换
用户可以在设置中选择使用 OpenAI 云端服务或本地 Whisper 模型。通过 `whisper.provider` 配置项进行切换，取值为 `'openai'` 或 `'local'`。

```mermaid
graph TD
A[语音识别服务选择] --> B[OpenAI云端服务]
A --> C[本地Whisper模型]
B --> B1[需要网络连接]
B --> B2[按使用量计费]
B --> B3[稳定可靠]
C --> C1[完全离线运行]
C --> C2[免费使用]
C --> C3[保护数据隐私]
```

**Diagram sources**
- [WhisperSetting.tsx](file://src/fronted/pages/setting/WhisperSetting.tsx)
- [WhisperServiceImpl.ts](file://src/backend/services/impl/WhisperServiceImpl.ts)

**Section sources**
- [WhisperSetting.tsx](file://src/fronted/pages/setting/WhisperSetting.tsx)
- [WhisperServiceImpl.ts](file://src/backend/services/impl/WhisperServiceImpl.ts)
- [LOCAL_WHISPER_README.md](file://LOCAL_WHISPER_README.md)

### 模型配置
本地Whisper支持多种模型，用户可根据硬件配置和需求选择合适的模型。

| 模型 | 大小 | 内存需求 | 速度 | 准确率 | 推荐场景 |
|------|------|----------|------|--------|----------|
| **tiny.en** | 39MB | ~1GB | ⚡ 快速 | ⭐⭐ 基础 | 快速预览 |
| **base.en** | 74MB | ~1GB | ⚡ 快速 | ⭐⭐⭐ 良好 | 日常使用 |
| **small.en** | 244MB | ~2GB | 🔶 中等 | ⭐⭐⭐ 良好 | 学习场景 |
| **medium.en** | 769MB | ~5GB | 🔶 中等 | ⭐⭐⭐⭐⭐ 优秀 | **推荐** |
| **large-v3** | 1.5GB | ~10GB | 🐢 慢速 | ⭐⭐⭐⭐⭐ 优秀 | 专业转录 |
| **large-v3-turbo** | 1.5GB | ~10GB | 🔶 中等 | ⭐⭐⭐⭐⭐ 优秀 | 高质量 + 效率 |

**推荐配置**
- **M4 Pro (48GB)**: `large-v3-turbo` - 充分利用内存和 GPU 加速
- **M2/M3 (16GB+)**: `medium.en` 或 `large-v3` - 平衡性能和准确率
- **M1 (8GB+)**: `small.en` 或 `medium.en` - 注重内存效率
- **Intel Mac**: `small.en` - 优先考虑 CPU 性能

### 资源管理
本地Whisper服务通过以下配置项进行资源管理：

| 配置项 | 字段名 | 数据类型 | 验证规则 | 默认值 |
|--------|--------|----------|----------|--------|
| Python路径 | `whisper.local.pythonPath` | string | 有效路径 | `python3` |
| 模型选择 | `whisper.local.model` | string | 支持的模型名 | `medium.en` |
| 设备类型 | `whisper.local.device` | string | `mps` 或 `cpu` | `mps` |
| 启用缓存 | `whisper.local.enableCache` | string | `true` 或 `false` | `true` |
| 最大并发数 | `whisper.local.maxConcurrency` | string | 1-4的整数 | `2` |

### 错误处理机制
本地Whisper服务实现了完善的错误处理机制，包括：

1. **环境检测**：在调用前检查Python环境和Whisper依赖是否安装
2. **进程管理**：通过 `ChildProcess` 管理Python进程，支持任务取消
3. **结果验证**：验证Whisper返回的JSON格式是否正确
4. **错误重试**：最多尝试3次调用，提高成功率

```mermaid
sequenceDiagram
participant 用户
participant WhisperSetting as WhisperSetting.tsx
participant Store as 设置存储
participant LocalWhisper as LocalWhisperRequest
participant Python as whisper_runner.py
用户->>WhisperSetting : 选择本地Whisper
WhisperSetting->>Store : 存储配置
用户->>LocalWhisper : 请求转录
LocalWhisper->>Store : 读取Python路径和模型
LocalWhisper->>Python : 启动Python进程
Python->>Python : 加载Whisper模型
Python->>Python : 执行转录
Python-->>LocalWhisper : 返回JSON结果
LocalWhisper->>LocalWhisper : 验证结果格式
LocalWhisper-->>用户 : 返回转录结果
```

**Diagram sources**
- [LocalWhisperRequest.ts](file://src/backend/objs/LocalWhisperRequest.ts)
- [whisper_runner.py](file://src/backend/scripts/whisper_runner.py)

**Section sources**
- [LocalWhisperRequest.ts](file://src/backend/objs/LocalWhisperRequest.ts)
- [whisper_runner.py](file://src/backend/scripts/whisper_runner.py)
- [WHISPER_IMPLEMENTATION_SUMMARY.md](file://WHISPER_IMPLEMENTATION_SUMMARY.md)

## 功能应用场景
| 功能 | 使用的AI服务 | 触发方式 | 说明 |
|------|---------------|----------|------|
| AI字幕生成 | OpenAI (Whisper) / 本地Whisper | Transcript 页面点击“转录” | 将视频音频转录为SRT字幕 |
| AI整句学习 | OpenAI (gpt-3.5-turbo/gpt-4o) | 播放时按 `?` 键 | 分析当前句子的语法、生词、词组 |
| 查单词 | 有道 | 鼠标悬停字幕单词 | 显示单词释义和发音 |
| 字幕翻译 | 腾讯云 | 自动加载 | 将英文SRT翻译为中文 |
| TTS发音 | OpenAI (tts-1) | 查单词时点击喇叭图标 | 播放单词或句子的语音 |

## 配置测试与故障排查
### 配置测试方法
1. **OpenAI**：进入 Transcript 页面，选择视频并点击“转录”，观察是否生成SRT文件。
2. **腾讯云**：播放有英文字幕的视频，检查是否自动显示中文翻译。
3. **有道**：播放视频，将鼠标悬停在字幕单词上，检查是否弹出释义。
4. **本地Whisper**：在设置中选择“本地Whisper模型”，点击“测试环境”，确认Python环境和Whisper依赖已安装。

### 常见错误与排查
| 错误 | 可能原因 | 解决方案 |
|------|----------|----------|
| 401 认证失败 | API密钥错误或过期 | 重新生成密钥并更新配置 |
| 模型不可用 | 模型名称拼写错误或服务不支持 | 检查 `model.gpt.default` 是否为 `gpt-3.5-turbo`、`gpt-4o` 或 `gpt-4o-mini` |
| 转录失败 | 网络超时或代理问题 | 关闭流式响应，或检查代理设置 |
| 翻译无响应 | 密钥权限不足 | 检查腾讯云子账号是否仅授予“机器翻译”权限 |
| Python不可用 | Python未安装或路径错误 | 安装Python或修正路径 |
| Whisper未安装 | Whisper包未安装 | `pip install openai-whisper` |
| 内存不足 | 模型太大，内存不够 | 使用更小的模型 |
| 音频格式不支持 | 音频格式或编码问题 | 使用FFmpeg转换格式 |

**Section sources**
- [LOCAL_WHISPER_README.md](file://LOCAL_WHISPER_README.md)
- [WhisperSetting.tsx](file://src/fronted/pages/setting/WhisperSetting.tsx)

## 性能优化建议
- **请求超时设置**：在 `RateLimiter` 中合理设置 `whisper` 和 `tts` 的请求间隔，避免触发API限流。
- **并发限制**：`WhisperServiceImpl` 采用分片处理音频，建议保持默认的60秒分段，平衡速度与内存占用。
- **缓存策略**：`TranslateServiceImpl` 已实现本地缓存，减少重复API调用，提高响应速度。
- **流式响应**：若使用中转服务遇到连接中断，建议在OpenAI设置中关闭“流式响应”。
- **本地模型优化**：对于本地Whisper，建议启用模型缓存，避免重复下载；根据硬件配置选择合适的模型和并发数。

**Section sources**
- [WhisperServiceImpl.ts](file://src/backend/services/impl/WhisperServiceImpl.ts)
- [LOCAL_WHISPER_README.md](file://LOCAL_WHISPER_README.md)

## 前端配置界面交互逻辑
前端配置界面基于 `useSettingForm` Hook 实现，支持实时预览和提交。

### 组件结构
- **OpenAiSetting.tsx**：管理OpenAI相关配置，包含密钥、端点、模型选择和流式开关。
- **YouDaoSetting.tsx**：管理有道密钥输入。
- **WhisperSetting.tsx**：管理本地Whisper配置，包含服务提供商选择、Python路径、模型选择、设备类型和并发数。
- **SettingLayout.tsx**：定义所有配置类型，包括 `'open-ai'`、`'you-dao'` 等。

### 交互流程
1. 用户在输入框修改配置。
2. `useSettingForm` 监听变化，更新本地状态。
3. 点击“Apply”时，比较本地状态与服务器状态，仅提交变更项。
4. 提交后，设置立即生效，无需重启应用。

```mermaid
flowchart TD
A[用户打开设置] --> B[WhisperSetting渲染]
B --> C[读取store中的配置]
C --> D[显示当前值]
D --> E[用户修改输入框]
E --> F[useSettingForm更新本地状态]
F --> G[比较本地与服务器状态]
G --> H{有变更?}
H --> |是| I[显示Apply按钮]
H --> |否| J[Apply按钮禁用]
I --> K[用户点击Apply]
K --> L[调用setSetting提交变更]
L --> M[配置生效]
```

**Diagram sources**
- [WhisperSetting.tsx](file://src/fronted/pages/setting/WhisperSetting.tsx)
- [useSettingForm.ts](file://src/fronted/hooks/useSettingForm.ts)

**Section sources**
- [WhisperSetting.tsx](file://src/fronted/pages/setting/WhisperSetting.tsx)
- [useSettingForm.ts](file://src/fronted/hooks/useSettingForm.ts)