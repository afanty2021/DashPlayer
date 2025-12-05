# DashPlayer 本地 Whisper 语音识别功能

## 概述

DashPlayer 现已支持本地 Whisper 语音识别，允许您完全离线进行语音转录，无需依赖外部 API。

## 🌟 特性

- **完全离线**: 无需网络连接，保护数据隐私
- **免费使用**: 无需支付 API 费用
- **高性能**: 针对 Apple Silicon (M1/M2/M3/M4) 优化
- **多种模型**: 支持 6 种不同精度和速度的模型
- **灵活配置**: 可选择不同模型和参数

## 📋 系统要求

### 必需软件
- Python 3.8+
- PyTorch
- OpenAI Whisper

### 硬件要求
- **内存**: 最少 4GB，推荐 8GB+
- **存储**: 2-5GB 空间（用于模型文件）
- **处理器**: 支持 Apple Silicon GPU 加速（推荐）

## 🚀 快速开始

### 1. 安装依赖

```bash
# 安装 Whsiper 和 PyTorch
pip install openai-whisper torch torchaudio

# 或者使用 DashPlayer 设置页面自动安装
```

### 2. 配置 DashPlayer

1. 打开 DashPlayer
2. 进入 **设置** → **语音识别**
3. 选择 **本地 Whisper 模型**
4. 选择适合您的模型（推荐 `medium.en`）
5. 点击 **测试环境** 验证安装

### 3. 开始使用

- 在转录页面选择视频文件
- DashPlayer 将自动使用本地 Whisper 进行转录
- 支持 60 分钟长视频的自动分段处理

## 🎛️ 模型选择

| 模型 | 大小 | 内存需求 | 速度 | 准确率 | 推荐场景 |
|------|------|----------|------|--------|----------|
| **tiny.en** | 39MB | ~1GB | ⚡ 快速 | ⭐⭐ 基础 | 快速预览 |
| **base.en** | 74MB | ~1GB | ⚡ 快速 | ⭐⭐⭐ 良好 | 日常使用 |
| **small.en** | 244MB | ~2GB | 🔶 中等 | ⭐⭐⭐ 良好 | 学习场景 |
| **medium.en** | 769MB | ~5GB | 🔶 中等 | ⭐⭐⭐⭐⭐ 优秀 | **推荐** |
| **large-v3** | 1.5GB | ~10GB | 🐢 慢速 | ⭐⭐⭐⭐⭐ 优秀 | 专业转录 |
| **large-v3-turbo** | 1.5GB | ~10GB | 🔶 中等 | ⭐⭐⭐⭐⭐ 优秀 | 高质量 + 效率 |

### 推荐配置

**M4 Pro (48GB)**: `large-v3-turbo` - 充分利用内存和 GPU 加速
**M2/M3 (16GB+)**: `medium.en` 或 `large-v3` - 平衡性能和准确率
**M1 (8GB+)**: `small.en` 或 `medium.en` - 注重内存效率
**Intel Mac**: `small.en` - 优先考虑 CPU 性能

## ⚙️ 高级配置

### Python 环境配置

如果使用多个 Python 环境，可以指定路径：

```bash
# 检查 Python 版本
python3 --version

# 安装到特定 Python 环境
/usr/bin/python3 -m pip install openai-whisper torch
```

### 性能优化

#### Apple Silicon 优化
- 自动检测并使用 MPS (Metal Performance Shaders)
- 推荐 GPU 加速模型获得最佳性能

#### 并发处理
```typescript
// 在设置中调整并发数
'whisper.local.maxConcurrency': 2  // 默认值，适合大多数场景
```

#### 模型缓存
- 启用模型缓存避免重复下载
- 模型文件缓存到 `~/.cache/whisper/`

## 🧪 测试环境

### 自动测试
在设置页面使用 **测试环境** 功能自动验证配置。

### 手动测试
使用提供的测试脚本：

```bash
# 创建测试音频并测试
python3 test_whisper_local.py --create-test-audio

# 测试特定音频文件
python3 test_whisper_local.py --audio-file /path/to/video.mp4 --model medium.en
```

### 命令行测试
```bash
# 直接使用 Whisper
whisper "video.mp4" --model medium.en --language en

# 输出 SRT 字幕
whisper "video.mp4" --model medium.en --language en --output-format srt
```

## 🔧 故障排除

### 常见问题

#### 1. Python 环境问题
```bash
# 检查 Python 安装
which python3
python3 --version

# 检查包安装
python3 -c "import whisper; print('Whisper OK')"
python3 -c "import torch; print('PyTorch OK')"
```

#### 2. 内存不足
- 选择较小的模型（`tiny.en` 或 `base.en`）
- 关闭其他应用程序释放内存
- 考虑使用 CPU 模式以节省显存

#### 3. 转录速度慢
- 确保使用 GPU 加速（Apple Silicon）
- 选择更快的模型（`tiny.en` 或 `base.en`）
- 调整并发数设置

#### 4. 准确率问题
- 使用更大型模型（`medium.en` 或 `large-v3`）
- 确保音频质量良好
- 检查语言设置是否正确

### 错误代码

| 错误 | 原因 | 解决方案 |
|------|------|----------|
| **Python不可用** | Python 未安装或路径错误 | 安装 Python 或修正路径 |
| **Whisper未安装** | Whisper 包未安装 | `pip install openai-whisper` |
| **内存不足** | 模型太大，内存不够 | 使用更小的模型 |
| **音频格式不支持** | 音频格式或编码问题 | 使用 FFmpeg 转换格式 |

## 📊 性能基准

### M4 Pro (48GB) 测试结果

| 模型 | 1小时音频转录时间 | 实时率 | 内存使用 |
|------|------------------|--------|----------|
| **tiny.en** | ~3分钟 | 20x | ~2GB |
| **base.en** | ~5分钟 | 12x | ~2GB |
| **small.en** | ~8分钟 | 7.5x | ~3GB |
| **medium.en** | ~12分钟 | 5x | ~6GB |
| **large-v3-turbo** | ~15分钟 | 4x | ~12GB |

### 优化建议

1. **模型选择**: `medium.en` 提供最佳性价比
2. **并发数**: 1-2 个并发任务最适合
3. **分段处理**: 自动按 60 秒分段，避免内存溢出
4. **缓存策略**: 启用模型缓存提升启动速度

## 🔄 与 OpenAI Whisper 对比

| 特性 | 本地 Whisper | OpenAI API |
|------|-------------|------------|
| **成本** | 免费 | $0.006/分钟 |
| **隐私** | 完全本地 | 需要上传数据 |
| **延迟** | 本地处理 | 网络延迟 |
| **可用性** | 100% 离线 | 依赖网络 |
| **中文优化** | 良好 | 一般 |
| **自定义** | 完全可控 | 有限 |

## 📚 相关资源

- [OpenAI Whisper GitHub](https://github.com/openai/whisper)
- [PyTorch Apple Silicon 支持](https://pytorch.org/get-started/locally/)
- [FFmpeg 音频转换](https://ffmpeg.org/)

## 🤝 反馈与支持

如果遇到问题或有改进建议，请：

1. 查看本文档的故障排除部分
2. 运行测试脚本诊断问题
3. 在项目仓库提交 Issue
4. 查看社区讨论和解决方案

---

**提示**: 首次使用时建议先用小视频文件测试，确认环境配置正确后再处理大型文件。