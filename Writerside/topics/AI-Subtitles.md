# 人工智能字幕

DashPlayer 的核心功能要求必须有视频的 `srt` 字幕文件，当您没有字幕文件时，可以使用人工智能来生成字幕。

DashPlayer 支持两种字幕转录方式：

- **Whisper 本地转录**：使用内置的 whisper.cpp 在本地运行，无需网络，完全免费。
- **OpenAI 云端转录**：调用 OpenAI 的 Whisper API 在云端转录，需要配置 API 密钥，按量计费。

## 方式一：Whisper 本地转录（推荐） {id="local-whisper"}

本地转录使用 [whisper.cpp](https://github.com/ggerganov/whisper.cpp) 引擎，直接在您的电脑上运行，无需网络连接和 API 密钥。

### 配置步骤

<procedure title="配置本地转录" id="local-transcription-setup">
<step>
进入<control>设置中心</control> → <control>服务凭据</control>页面，找到底部的<control>Whisper 本地模型</control>区域。
</step>
<step>
选择模型大小：
<list>
<li><code>base</code>：较小，下载快，转录速度快，适合大部分场景。</li>
<li><code>large</code>：更大（对应 large-v3），转录精度更高，但下载和运行更慢，适合对准确度有更高要求的场景。</li>
</list>
</step>
<step>
点击 Whisper 模型右侧的<control>下载</control>按钮，等待模型下载完成。模型文件来自 Hugging Face，下载完成后状态会显示为"已就绪"。
</step>
<step>
点击 VAD 静音检测模型（silero-v6.2.0）右侧的<control>下载</control>按钮，等待下载完成。VAD 模型用于在转录前检测静音片段，可以提升转录质量。
</step>
<step>
进入<control>设置中心</control> → <control>功能设置</control>页面，在<control>字幕转录</control>一栏将引擎选择为<control>Whisper 本地</control>。
</step>
</procedure>

> 如果在功能设置中选择了"Whisper 本地"但尚未下载模型，页面会出现黄色提示，点击"去配置"可以快速跳转到服务凭据页面。
> {style="note"}

### 开始转录

<procedure title="使用本地 Whisper 转录字幕" id="local-transcription">
<step>进入<control>Transcript</control>页面</step>
<step>在左侧文件浏览器中找到相应的文件后点击<control>添加到转录队列</control></step>
<step>点击<control>转录</control>按钮</step>
</procedure>

转录过程中会显示进度百分比。本地转录一次只处理一个文件，其余文件会自动排队等待。

## 方式二：OpenAI 云端转录 {id="openai-whisper"}

云端转录调用 OpenAI 的 Whisper API，需要网络连接和有效的 API 密钥。

<procedure title="使用 OpenAI 生成字幕" id="ai-subtitles">
<step><a href="Config-OpenAI-API.md">配置 OpenAI 密钥</a></step>
<step>进入<control>设置中心</control> → <control>功能设置</control>页面，在<control>字幕转录</control>一栏将引擎选择为<control>OpenAI</control></step>
<step>进入<control>Transcript</control>页面</step>
<step>在左侧文件浏览器中找到相应的文件后点击<control>添加到转录队列</control></step>
<step>点击<control>转录</control>按钮</step>
</procedure>

> 转录时调用接口响应的时间会比较长，实际测试发现代理服务可能会切断这种长时间的连接，如果转录失败，请尝试在代理中将您配置的
> OpenAI 域名排除。
> {style="note"}

## 通用说明

- 转录时您可以离开当前界面继续观看视频，转录会在后台进行。转录完成后会自动更新对应视频的字幕。
- 请不要在转录过程中关闭 DashPlayer。
- 转录完成后会在视频文件同目录下生成同名的 `.srt` 字幕文件。
