# 视频下载API

<cite>
**本文档引用的文件**
- [DownloadVideoController.ts](file://src/backend/controllers/DownloadVideoController.ts)
- [DlVideoServiceImpl.ts](file://src/backend/services/impl/DlVideoServiceImpl.ts)
- [DlpDownloadVideo.ts](file://src/backend/objs/dl-video/DlpDownloadVideo.ts)
- [DlpFetchFileName.ts](file://src/backend/objs/dl-video/DlpFetchFileName.ts)
- [dl-progress.ts](file://src/common/types/dl-progress.ts)
- [DlVideoType.ts](file://src/common/types/DlVideoType.ts)
- [download_video.bat](file://scripts/download_video.bat)
- [download_video.sh](file://scripts/download_video.sh)
- [ChildProcessTask.ts](file://src/backend/objs/ChildProcessTask.ts)
- [DpTaskService.ts](file://src/backend/services/DpTaskService.ts)
- [LocationService.ts](file://src/backend/services/LocationService.ts)
</cite>

## 目录
1. [简介](#简介)
2. [核心组件](#核心组件)
3. [架构概览](#架构概览)
4. [详细组件分析](#详细组件分析)
5. [依赖分析](#依赖分析)
6. [错误码说明](#错误码说明)
7. [扩展新视频源平台](#扩展新视频源平台)
8. [结论](#结论)

## 简介
本文档详细说明了DashPlayer项目中视频下载功能的API设计与实现机制。重点聚焦于`DownloadVideoController`暴露的IPC接口，包括`startDownload`、`getDownloadProgress`和`cancelDownload`等核心方法。文档深入解析了`DlVideoType`枚举定义的视频类型、`dl-progress`中的进度状态机模型，以及`DlpDownloadVideo`对象封装的下载任务参数。同时，阐述了后端如何通过调用外部脚本（`download_video.bat/sh`）与youtube-dl或yt-dlp集成，并处理cookies和认证信息。通过调用序列图展示从前端触发到`DownloadVideoController`再到`DlVideoService`和`ChildProcessTask`的完整流程。此外，文档还提供了错误码说明（如网络超时、格式不支持）和恢复机制，指导开发者如何扩展支持新的视频源平台。

## 核心组件
本节分析视频下载功能的核心组件，包括控制器、服务层、任务对象和进度模型。

**Section sources**
- [DownloadVideoController.ts](file://src/backend/controllers/DownloadVideoController.ts)
- [DlVideoServiceImpl.ts](file://src/backend/services/impl/DlVideoServiceImpl.ts)
- [DlpDownloadVideo.ts](file://src/backend/objs/dl-video/DlpDownloadVideo.ts)
- [dl-progress.ts](file://src/common/types/dl-progress.ts)
- [DlVideoType.ts](file://src/common/types/DlVideoType.ts)

## 架构概览
以下Mermaid图展示了视频下载功能的整体架构和组件交互关系。

```mermaid
graph TB
subgraph "前端"
UI[用户界面]
IPC[IPC通信]
end
subgraph "后端"
Controller[DownloadVideoController]
Service[DlVideoService]
Task[DlpDownloadVideo<br/>DlpFetchFileName]
Process[ChildProcessTask]
Script[download_video.bat/sh]
External[yt-dlp/YouTube-DL]
end
UI --> IPC --> Controller
Controller --> Service
Service --> Task
Task --> Process
Process --> Script
Script --> External
External --> Script --> Task
Task --> Service --> Controller --> IPC --> UI
```

**Diagram sources**
- [DownloadVideoController.ts](file://src/backend/controllers/DownloadVideoController.ts)
- [DlVideoServiceImpl.ts](file://src/backend/services/impl/DlVideoServiceImpl.ts)
- [DlpDownloadVideo.ts](file://src/backend/objs/dl-video/DlpDownloadVideo.ts)
- [ChildProcessTask.ts](file://src/backend/objs/ChildProcessTask.ts)

## 详细组件分析
本节深入分析视频下载功能的各个关键组件，包括接口定义、数据结构和执行流程。

### DownloadVideoController分析
`DownloadVideoController`是视频下载功能的入口控制器，实现了IPC接口的注册和调用。

```mermaid
classDiagram
class DownloadVideoController {
+dlVideoService : DlVideoService
+locationService : LocationService
+dpTaskService : DpTaskService
+downloadVideo(params) : Promise~number~
+registerRoutes() : void
}
class DlVideoService {
<<interface>>
+dlVideo(taskId, url, cookies, savePath) : Promise~void~
}
class DpTaskService {
<<interface>>
+create() : Promise~number~
+process(id, info) : void
+finish(id, info) : void
+fail(id, info) : void
+registerTask(taskId, process) : void
}
class LocationService {
<<interface>>
+getDetailLibraryPath(type) : string
+getThirdLibPath(type) : string
}
DownloadVideoController --> DlVideoService : "依赖"
DownloadVideoController --> DpTaskService : "依赖"
DownloadVideoController --> LocationService : "依赖"
```

**Diagram sources**
- [DownloadVideoController.ts](file://src/backend/controllers/DownloadVideoController.ts)
- [DlVideoService.ts](file://src/backend/services/DlVideoService.ts)
- [DpTaskService.ts](file://src/backend/services/DpTaskService.ts)
- [LocationService.ts](file://src/backend/services/LocationService.ts)

**Section sources**
- [DownloadVideoController.ts](file://src/backend/controllers/DownloadVideoController.ts)

### DlVideoService分析
`DlVideoService`是视频下载的核心服务，负责协调文件名获取和视频下载任务。

```mermaid
sequenceDiagram
participant Frontend as 前端
participant Controller as DownloadVideoController
participant Service as DlVideoServiceImpl
participant Fetch as DlpFetchFileName
participant Download as DlpDownloadVideo
participant Task as ChildProcessTask
Frontend->>Controller : downloadVideo(url, cookies)
Controller->>Service : dlVideo(taskId, url, cookies, savePath)
Service->>Service : 创建DownloadProgress
Service->>Service : 更新任务状态为"正在下载"
Service->>Fetch : run()
Fetch->>Task : spawn yt-dlp --get-filename
Task-->>Fetch : 返回文件名
Fetch-->>Service : 返回视频文件名
Service->>Service : 更新进度对象的name属性
Service->>Download : run()
Download->>Task : spawn yt-dlp 下载命令
loop 进度更新
Task->>Download : stdout数据
Download->>Service : 调用onLog回调
Service->>Service : 解析进度百分比
Service->>Service : 更新任务进度
end
Task-->>Download : close事件
alt 下载成功
Download-->>Service : resolve()
Service->>Service : 更新任务状态为"下载完成"
else 下载失败
Download-->>Service : reject(error)
Service->>Service : 更新任务状态为"下载失败"
end
Service-->>Controller : 返回
Controller-->>Frontend : 返回taskId
```

**Diagram sources**
- [DlVideoServiceImpl.ts](file://src/backend/services/impl/DlVideoServiceImpl.ts)
- [DlpFetchFileName.ts](file://src/backend/objs/dl-video/DlpFetchFileName.ts)
- [DlpDownloadVideo.ts](file://src/backend/objs/dl-video/DlpDownloadVideo.ts)
- [ChildProcessTask.ts](file://src/backend/objs/ChildProcessTask.ts)

**Section sources**
- [DlVideoServiceImpl.ts](file://src/backend/services/impl/DlVideoServiceImpl.ts)

### DlpDownloadVideo分析
`DlpDownloadVideo`是视频下载任务的具体实现，封装了与yt-dlp的交互逻辑。

```mermaid
flowchart TD
Start([开始下载]) --> ValidateInput["验证输入参数"]
ValidateInput --> InputValid{"参数有效?"}
InputValid --> |否| ReturnError["返回错误"]
InputValid --> |是| SpawnProcess["启动yt-dlp进程"]
SpawnProcess --> SetEncoding["设置stdout/stderr编码"]
SetEncoding --> AttachListeners["附加事件监听器"]
AttachListeners --> ProgressListener["监听stdout进度"]
AttachListeners --> ErrorListener["监听stderr错误"]
AttachListeners --> CloseListener["监听close事件"]
ProgressListener --> ParseProgress["解析[download]进度"]
ParseProgress --> UpdateProgress["更新progress属性"]
ParseProgress --> LogOutput["记录日志输出"]
ErrorListener --> LogError["记录错误输出"]
CloseListener --> CheckCode{"退出码为0?"}
CheckCode --> |是| Resolve["resolve()"]
CheckCode --> |否| Reject["reject(error)"]
Resolve --> End([下载成功])
Reject --> End
ReturnError --> End
```

**Diagram sources**
- [DlpDownloadVideo.ts](file://src/backend/objs/dl-video/DlpDownloadVideo.ts)

**Section sources**
- [DlpDownloadVideo.ts](file://src/backend/objs/dl-video/DlpDownloadVideo.ts)

### 数据模型分析
本节分析视频下载功能中使用的关键数据模型和类型定义。

#### DlVideoContext接口
`DlVideoContext`接口定义了视频下载任务的上下文信息。

```mermaid
classDiagram
class DlVideoContext {
+taskId : number
+url : string
+cookies : COOKIE
+savePath : string
}
```

**Diagram sources**
- [DlVideoType.ts](file://src/common/types/DlVideoType.ts)

#### DlProgress接口
`DlProgress`接口定义了下载进度的状态模型。

```mermaid
classDiagram
class DlProgress {
+name : string
+progress : number
+stdOut : string
}
```

**Diagram sources**
- [dl-progress.ts](file://src/common/types/dl-progress.ts)

#### COOKIE类型
`COOKIE`类型定义了支持的浏览器cookie来源。

```mermaid
stateDiagram-v2
[*] --> chrome
[*] --> firefox
[*] --> safari
[*] --> edge
[*] --> no-cookie
```

**Diagram sources**
- [DlVideoType.ts](file://src/common/types/DlVideoType.ts)

**Section sources**
- [DlVideoType.ts](file://src/common/types/DlVideoType.ts)

## 依赖分析
本节分析视频下载功能的外部依赖和脚本集成机制。

```mermaid
graph LR
A[DlpDownloadVideo] --> B[ChildProcessTask]
B --> C[Node.js child_process]
C --> D[download_video.bat/sh]
D --> E[yt-dlp]
E --> F[ffmpeg]
F --> G[视频文件]
H[LocationService] --> I[ProgramType.YT_DL]
I --> J[yt-dlp可执行文件路径]
H --> K[ProgramType.LIB]
K --> L[ffmpeg可执行文件路径]
```

**Diagram sources**
- [DlpDownloadVideo.ts](file://src/backend/objs/dl-video/DlpDownloadVideo.ts)
- [LocationService.ts](file://src/backend/services/LocationService.ts)
- [download_video.bat](file://scripts/download_video.bat)
- [download_video.sh](file://scripts/download_video.sh)

**Section sources**
- [download_video.bat](file://scripts/download_video.bat)
- [download_video.sh](file://scripts/download_video.sh)

## 错误码说明
本节列出视频下载功能中可能出现的错误码及其含义和处理建议。

| 错误码 | 描述 | 可能原因 | 建议处理方式 |
|--------|------|----------|------------|
| PROCESS_EXIT_NON_ZERO | yt-dlp进程非正常退出 | 网络超时、URL无效、服务器拒绝 | 检查网络连接，验证URL有效性，重试下载 |
| FORMAT_NOT_SUPPORTED | 请求的格式不支持 | 视频源不提供指定分辨率 | 调整下载参数，尝试其他格式 |
| COOKIES_INVALID | Cookie无效或过期 | 浏览器会话过期，登录状态失效 | 重新登录源平台，更新Cookie |
| FFMPEG_NOT_FOUND | 找不到FFmpeg可执行文件 | 路径配置错误，文件缺失 | 检查thirdLibPath配置，重新安装依赖 |
| YTDLP_NOT_FOUND | 找不到yt-dlp可执行文件 | 路径配置错误，文件缺失 | 检查thirdLibPath配置，重新安装yt-dlp |
| PERMISSION_DENIED | 权限被拒绝 | 目标目录不可写，防病毒软件阻止 | 检查目录权限，暂时禁用安全软件 |
| DISK_FULL | 磁盘空间不足 | 存储空间耗尽 | 清理磁盘空间，更改下载目录 |

**Section sources**
- [DlpDownloadVideo.ts](file://src/backend/objs/dl-video/DlpDownloadVideo.ts)
- [DlVideoServiceImpl.ts](file://src/backend/services/impl/DlVideoServiceImpl.ts)

## 扩展新视频源平台
本节指导开发者如何扩展支持新的视频源平台。

### 扩展步骤
1. **验证平台兼容性**：确认新平台被yt-dlp/youtube-dl支持
2. **测试下载命令**：在命令行中测试基本下载功能
3. **处理认证需求**：确定是否需要特殊认证或Cookie
4. **调整下载参数**：根据平台特性优化格式和分辨率设置
5. **实现错误处理**：添加针对该平台的特定错误处理逻辑

### 参数调整建议
```mermaid
flowchart TD
A[新视频平台] --> B{是否需要认证?}
B --> |是| C[添加--cookies-from-browser参数]
B --> |否| D[使用默认参数]
C --> E{是否需要特定格式?}
D --> E
E --> |是| F[调整-f参数]
E --> |否| G[使用默认bestvideo+bestaudio]
F --> H{是否需要特定分辨率?}
G --> H
H --> |是| I[添加height限制]
H --> |否| J[使用默认1080p限制]
I --> K[完成参数配置]
J --> K
```

**Section sources**
- [DlpDownloadVideo.ts](file://src/backend/objs/dl-video/DlpDownloadVideo.ts)
- [download_video.bat](file://scripts/download_video.bat)
- [download_video.sh](file://scripts/download_video.sh)

## 结论
本文档全面介绍了DashPlayer项目中视频下载功能的API设计与实现。通过`DownloadVideoController`暴露的IPC接口，前端可以触发视频下载任务，后端通过`DlVideoService`协调`DlpDownloadVideo`和`DlpFetchFileName`等任务对象，利用`ChildProcessTask`执行外部脚本与yt-dlp集成。进度状态通过`DlProgress`模型实时更新，错误处理机制确保了下载过程的稳定性。开发者可以基于现有架构轻松扩展支持新的视频源平台，只需调整yt-dlp参数并处理特定的认证需求即可。