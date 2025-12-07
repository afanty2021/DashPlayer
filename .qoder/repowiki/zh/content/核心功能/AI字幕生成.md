# AI字幕生成

<cite>
**本文档中引用的文件**  
- [SubtitleController.ts](file://src/backend/controllers/SubtitleController.ts)
- [WhisperServiceImpl.ts](file://src/backend/services/impl/WhisperServiceImpl.ts)
- [TencentProvider.ts](file://src/backend/services/impl/clients/TencentProvider.ts)
- [YouDaoProvider.ts](file://src/backend/services/impl/clients/YouDaoProvider.ts)
- [OpenAiWhisperRequest.ts](file://src/backend/objs/OpenAiWhisperRequest.ts)
- [LocalWhisperRequest.ts](file://src/backend/objs/LocalWhisperRequest.ts)
- [WhisperController.ts](file://src/backend/controllers/WhisperController.ts)
- [SentenceStruct.ts](file://src/common/types/SentenceStruct.ts)
- [PlayerSubtitle.tsx](file://src/fronted/components/playerSubtitle/PlayerSubtitle.tsx)
- [PlayerSubtitlePanel.tsx](file://src/fronted/components/playerSubtitle/PlayerSubtitlePanel.tsx)
- [SubtitleServiceImpl.ts](file://src/backend/services/impl/SubtitleServiceImpl.ts)
- [SrtTimeAdjustServiceImpl.ts](file://src/backend/services/impl/SrtTimeAdjustServiceImpl.ts)
</cite>

## 更新摘要
**变更内容**  
- 新增本地Whisper服务支持说明
- 增加本地模型处理流程、缓存策略和防重复处理机制
- 更新系统架构图以包含本地Whisper选项
- 扩展配置指南以包含本地部署配置

## 目录
1. [简介](#简介)
2. [系统架构与核心流程](#系统架构与核心流程)
3. [字幕生成服务实现](#字幕生成服务实现)
4. [语音识别请求构建](#语音识别请求构建)
5. [双语字幕与时间戳调整](#双语字幕与时间戳调整)
6. [前端字幕渲染机制](#前端字幕渲染机制)
7. [第三方语音识别服务集成](#第三方语音识别服务集成)
8. [配置指南](#配置指南)
9. [服务性能对比](#服务性能对比)
10. [结论](#结论)

## 简介
DashPlayer 提供了基于人工智能的字幕生成功能，支持通过 OpenAI Whisper、腾讯云语音识别、有道语音识别以及本地Whisper模型等多种服务将视频音频转换为文本字幕。该功能不仅实现了高精度的语音转录，还支持双语字幕显示、时间戳手动校正以及与视频播放的精确同步。用户可通过配置不同服务商的 API 密钥或本地Python环境来启用相应的语音识别服务，系统会根据配置自动选择最优方案进行处理。

## 系统架构与核心流程
AI 字幕生成功能的核心流程包括音频提取、语音识别、字幕文件生成和前端渲染四个主要阶段。整个流程由 `SubtitleController` 发起，调用 `WhisperServiceImpl` 或第三方提供商（如 `TencentProvider`、`YouDaoProvider`）完成语音识别任务，并最终在前端 `PlayerSubtitle` 组件中实现字幕的实时渲染。

```mermaid
flowchart TD
A[用户请求生成字幕] --> B[SubtitleController]
B --> C{选择语音识别服务}
C --> |OpenAI| D[WhisperServiceImpl]
C --> |腾讯云| E[TencentProvider]
C --> |有道| F[YouDaoProvider]
C --> |本地Whisper| G[LocalWhisperRequest]
D --> H[OpenAiWhisperRequest]
E --> I[TencentClient]
F --> J[YouDaoClient]
G --> K[whisper_runner.py]
H --> L[生成SRT文件]
I --> L
J --> L
K --> L
L --> M[SubtitleServiceImpl]
M --> N[前端PlayerSubtitle组件]
N --> O[视频播放同步显示]
```

**Diagram sources**  
- [SubtitleController.ts](file://src/backend/controllers/SubtitleController.ts#L8-L21)
- [WhisperServiceImpl.ts](file://src/backend/services/impl/WhisperServiceImpl.ts#L46-L155)
- [TencentProvider.ts](file://src/backend/services/impl/clients/TencentProvider.ts#L7-L42)
- [YouDaoProvider.ts](file://src/backend/services/impl/clients/YouDaoProvider.ts#L7-L31)
- [LocalWhisperRequest.ts](file://src/backend/objs/LocalWhisperRequest.ts#L21-L147)

**Section sources**  
- [SubtitleController.ts](file://src/backend/controllers/SubtitleController.ts#L8-L21)
- [WhisperServiceImpl.ts](file://src/backend/services/impl/WhisperServiceImpl.ts#L46-L155)

## 字幕生成服务实现
`WhisperServiceImpl` 是语音识别服务的核心实现类，负责将视频文件中的音频部分提取并分段处理，然后调用相应的语音识别服务进行转录。系统支持多种语音识别服务，包括 OpenAI Whisper、腾讯云、有道以及本地Whisper模型。

该服务首先使用 FFmpeg 将视频文件转换为音频格式，并将其分割成不超过 60 秒的片段，以避免单次请求超时。每个音频片段会被独立提交给选定的语音识别服务进行转录。为了提高成功率，系统实现了三次重试机制（`whisperThreeTimes`），在每次失败后尝试重新发送请求。

当使用本地Whisper模型时，系统通过 `LocalWhisperRequest` 类调用 Python 脚本 `whisper_runner.py` 执行转录任务。该脚本会自动检测最佳设备（MPS、CUDA 或 CPU），并加载指定的Whisper模型进行处理。

```mermaid
sequenceDiagram
participant 用户
participant SubtitleController
participant WhisperServiceImpl
participant LocalWhisperRequest
participant whisper_runner.py
用户->>SubtitleController : 请求生成字幕
SubtitleController->>WhisperServiceImpl : 调用transcript方法
WhisperServiceImpl->>WhisperServiceImpl : convertAndSplit(分割音频)
WhisperServiceImpl->>WhisperServiceImpl : whisperThreeTimes(三次重试)
WhisperServiceImpl->>LocalWhisperRequest : 构建请求
LocalWhisperRequest->>whisper_runner.py : 执行Python脚本
whisper_runner.py->>whisper_runner.py : 加载模型并转录
whisper_runner.py-->>LocalWhisperRequest : 返回JSON结果
LocalWhisperRequest-->>WhisperServiceImpl : 返回WhisperResponse
WhisperServiceImpl->>WhisperServiceImpl : 合并所有片段结果
WhisperServiceImpl->>文件系统 : 写入.srt字幕文件
WhisperServiceImpl-->>SubtitleController : 完成通知
SubtitleController-->>用户 : 字幕生成完成
```

**Diagram sources**  
- [WhisperServiceImpl.ts](file://src/backend/services/impl/WhisperServiceImpl.ts#L46-L155)
- [LocalWhisperRequest.ts](file://src/backend/objs/LocalWhisperRequest.ts#L65-L134)
- [whisper_runner.py](file://src/backend/scripts/whisper_runner.py#L140-L205)

**Section sources**  
- [WhisperServiceImpl.ts](file://src/backend/services/impl/WhisperServiceImpl.ts#L46-L155)

## 语音识别请求构建
`LocalWhisperRequest` 类负责构建和执行本地Whisper语音识别请求。该类通过静态方法 `build` 创建实例，检查必要的配置项（如Python环境和音频文件）是否可用。若配置缺失，则返回 null 并记录错误。

请求参数包括：
- **file**: 音频文件路径
- **model**: 指定使用的Whisper模型（如 medium.en）
- **language**: 指定音频语言
- **task**: 任务类型（转录或翻译）
- **output-format**: 输出格式（JSON）

系统通过 `spawn` 方法调用 Python 脚本 `whisper_runner.py` 执行转录任务，并通过标准输出获取JSON格式的转录结果。同时实现了速率限制器（`@WaitRateLimit('local-whisper')`）来控制请求频率。

```mermaid
classDiagram
class LocalWhisperRequest {
-file : string
-model : string
-pythonProcess : ChildProcess
+static build(file : string, model : string) : LocalWhisperRequest | null
+invoke() : Promise~WhisperResponse~
+cancel() : void
}
class WhisperResponse {
+language : string
+duration : number
+text : string
+offset : number
+segments : Segment[]
}
class Segment {
+seek : number
+start : number
+end : number
+text : string
}
LocalWhisperRequest --> WhisperResponse : 返回
```

**Diagram sources**  
- [LocalWhisperRequest.ts](file://src/backend/objs/LocalWhisperRequest.ts#L21-L147)

**Section sources**  
- [LocalWhisperRequest.ts](file://src/backend/objs/LocalWhisperRequest.ts#L21-L147)

## 双语字幕与时间戳调整
系统支持双语字幕显示，原始英文文本、微软翻译结果和中文翻译均可同时呈现。`SentenceStruct` 接口定义了句子结构，包含原始文本和按空格划分的块信息，便于后续处理和高亮显示。

用户可手动校正字幕时间戳，调整信息存储在数据库中并通过 `SrtTimeAdjustService` 管理。当加载字幕时，系统会自动应用已保存的时间偏移量，确保播放同步。

```mermaid
erDiagram
SUBTITLE_TIMESTAMPS_ADJUSTMENT {
string key PK
string subtitle_path
string subtitle_hash
float start_at
float end_at
datetime created_at
datetime updated_at
}
SUBTITLE_TIMESTAMPS_ADJUSTMENT ||--o{ SRT_FILE : "belongs to"
```

**Diagram sources**  
- [SentenceStruct.ts](file://src/common/types/SentenceStruct.ts#L10-L13)
- [SrtTimeAdjustServiceImpl.ts](file://src/backend/services/impl/SrtTimeAdjustServiceImpl.ts#L11-L71)

**Section sources**  
- [SentenceStruct.ts](file://src/common/types/SentenceStruct.ts#L10-L13)
- [SrtTimeAdjustServiceImpl.ts](file://src/backend/services/impl/SrtTimeAdjustServiceImpl.ts#L11-L71)

## 前端字幕渲染机制
前端通过 `PlayerSubtitle` 组件实现字幕的动态渲染。该组件订阅播放器状态，获取当前正在播放的句子对象（`currentSentence`），并根据其内容动态生成字幕行。

支持三种显示模式：
1. **主字幕行**：使用 `FullscreenTranslatableLine` 显示原始文本，支持点击翻译
2. **第二行**：显示机器翻译结果（`msTranslate`）
3. **第三行**：显示中文翻译（`textZH`）

组件通过 `usePlayerController` Hook 监听播放状态变化，并在字幕切换时自动更新 UI。

```mermaid
flowchart TD
A[PlayerSubtitle组件] --> B{是否有当前句子?}
B --> |否| C[返回空div]
B --> |是| D[提取text, msTranslate, textZH]
D --> E[过滤空值]
E --> F[遍历生成React元素]
F --> G[第一项: FullscreenTranslatableLine]
F --> H[第二项: PlayerNormalLine]
F --> I[第三项: PlayerNormalLine]
G --> J[渲染字幕]
H --> J
I --> J
```

**Diagram sources**  
- [PlayerSubtitle.tsx](file://src/fronted/components/playerSubtitle/PlayerSubtitle.tsx#L6-L67)
- [PlayerSubtitlePanel.tsx](file://src/fronted/components/playerSubtitle/PlayerSubtitlePanel.tsx#L7-L39)

**Section sources**  
- [PlayerSubtitle.tsx](file://src/fronted/components/playerSubtitle/PlayerSubtitle.tsx#L6-L67)

## 第三方语音识别服务集成
系统支持集成多个第三方语音识别服务，包括腾讯云和有道。这些服务通过 `ClientProviderService` 接口统一管理，实现松耦合设计。

### 腾讯云语音识别（TencentProvider）
`TencentProvider` 类负责管理腾讯云客户端实例。它从全局存储中读取 `apiKeys.tencent.secretId` 和 `apiKeys.tencent.secretKey`，初始化 `TencentClient` 并返回可用客户端。若密钥未配置或为空，则返回 null。

### 有道语音识别（YouDaoProvider）
`YouDaoProvider` 类封装了有道语音识别服务的调用逻辑。通过 `storeGet('apiKeys.youdao.secretId')` 和 `storeGet('apiKeys.youdao.secretKey')` 获取认证信息，并动态更新 `YouDaoClient` 配置。

两种服务均采用懒加载模式，仅在首次调用 `getClient()` 时初始化客户端，提升系统性能。

**Section sources**  
- [TencentProvider.ts](file://src/backend/services/impl/clients/TencentProvider.ts#L7-L42)
- [YouDaoProvider.ts](file://src/backend/services/impl/clients/YouDaoProvider.ts#L7-L31)

## 配置指南
要启用 AI 字幕生成功能，用户需完成以下配置步骤：

### OpenAI 配置
1. 访问 [OpenAI 官网](https://platform.openai.com/) 获取 API 密钥
2. 在 DashPlayer 设置页面进入“OpenAI 设置”
3. 填写 API Key 和 Endpoint（默认为 `https://api.openai.com`）
4. 保存配置

### 腾讯云配置
1. 登录 [腾讯云控制台](https://console.cloud.tencent.com/)
2. 开通“语音识别”服务
3. 获取 SecretId 和 SecretKey
4. 在 DashPlayer 设置中填写对应字段

### 有道智云配置
1. 注册 [有道智云](https://ai.youdao.com/) 账号
2. 创建语音识别应用
3. 获取 App Key 和 Secret Key
4. 在 DashPlayer 设置中完成配置

### 本地Whisper配置
1. 安装 Python 3.8+ 环境
2. 运行 `pip install openai-whisper torch torchaudio`
3. 在 DashPlayer 设置中进入“语音识别”页面
4. 选择“本地 Whisper 模型”作为提供商
5. 配置 Python 路径（可选，默认为 python3）
6. 选择合适的模型（推荐 medium.en）
7. 点击“测试环境”验证配置

**Section sources**  
- [Writerside/topics/Config-OpenAI-API.md](file://Writerside/topics/Config-OpenAI-API.md)
- [Writerside/topics/Config-Tencent-API.md](file://Writerside/topics/Config-Tencent-API.md)
- [Writerside/topics/Config-YouDao-API.md](file://Writerside/topics/Config-YouDao-API.md)
- [LOCAL_WHISPER_README.md](file://LOCAL_WHISPER_README.md)
- [WHISPER_IMPLEMENTATION_SUMMARY.md](file://WHISPER_IMPLEMENTATION_SUMMARY.md)

## 服务性能对比
| 服务提供商 | 准确率 | 延迟 | 成本 | 支持语言 | 隐私性 |
|----------|-------|------|------|---------|--------|
| OpenAI Whisper | 高 | 中等 | 按使用量计费 | 多语言支持 | 需上传数据 |
| 腾讯云 | 中等 | 低 | 按调用次数计费 | 中文优化 | 需上传数据 |
| 有道智云 | 中等 | 低 | 免费额度+按量计费 | 中英双语 | 需上传数据 |
| 本地Whisper | 高 | 本地处理 | 免费（一次性硬件成本） | 多语言支持 | 完全本地 |

OpenAI Whisper 在多语言识别和准确性方面表现最佳，适合高质量字幕生成；腾讯云和有道在中文语音识别上具有本地化优势，响应速度快，适合实时场景；本地Whisper提供完全离线的解决方案，保护数据隐私，长期使用成本更低。

## 结论
DashPlayer 的 AI 字幕生成功能通过模块化设计实现了对多种语音识别服务的支持，具备高可靠性、灵活性和可扩展性。系统通过音频分片、重试机制和速率控制保障了转录成功率，同时提供完善的前端交互体验，支持双语显示和时间轴校正。新增的本地Whisper支持使得用户可以在完全离线的环境下进行高质量的语音转录，通过3小时自动清理的缓存策略和视频元数据比对防重复处理机制，进一步优化了系统性能和用户体验。未来可进一步优化缓存策略、增加更多语音识别接口，并支持自定义模型训练，提升个性化服务能力。