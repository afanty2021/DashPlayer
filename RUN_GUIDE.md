# DashPlayer 运行指南

## 运行方式

### 方式一：开发模式运行（推荐）

1. **确保使用正确的 Node.js 版本**
   ```bash
   export PATH="/opt/homebrew/opt/node@18/bin:$PATH"
   node --version  # 应该显示 v18.20.8
   ```

2. **启动开发服务器**
   ```bash
   export PATH="/opt/homebrew/opt/node@18/bin:$PATH" && npm start
   ```

   或者使用 yarn：
   ```bash
   export PATH="/opt/homebrew/opt/node@18/bin:$PATH" && yarn start
   ```

3. **应用将自动启动**
   - Vite 开发服务器会在 http://localhost:5173/ 启动
   - Electron 应用窗口会自动打开

### 方式二：构建后运行

1. **构建应用**
   ```bash
   export PATH="/opt/homebrew/opt/node@18/bin:$PATH" && npm run make
   ```

   构建完成后，可执行文件将位于：
   - macOS: `out/DashPlayer-darwin-arm64/DashPlayer.app`
   - Windows: `out/DashPlayer-win32-x64/DashPlayer.exe`
   - Linux: `out/DashPlayer-linux-x64/DashPlayer`

2. **运行构建好的应用**
   - macOS: 双击 `DashPlayer.app`
   - Windows: 双击 `DashPlayer.exe`
   - Linux: 运行 `./DashPlayer`

## 本地 Whisper 功能使用

### 1. 安装 Python 依赖

```bash
# 安装 Whisper 和 PyTorch
pip3 install openai-whisper torch torchaudio

# 或者使用国内镜像加速
pip3 install -i https://pypi.tuna.tsinghua.edu.cn/simple openai-whisper torch torchaudio
```

### 2. 配置本地 Whisper

1. 打开 DashPlayer 应用
2. 点击左侧导航的"设置"
3. 选择"语音识别"设置页
4. 在"服务提供商"中选择"本地 Whisper 模型"
5. 配置参数：
   - **Python路径**: 默认 `python3`，如果有多个 Python 版本可以指定路径
   - **Whisper模型**: 推荐选择 `medium.en`（平衡速度和准确率）
6. 点击"测试环境"验证安装

### 3. 模型选择建议

| 设备配置 | 推荐模型 | 说明 |
|---------|---------|------|
| M4 Pro (48GB) | `large-v3-turbo` | 充分利用内存和 GPU |
| M2/M3 (16GB+) | `medium.en` | 性能和准确率的最佳平衡 |
| M1 (8GB+) | `small.en` | 内存友好，性能良好 |
| Intel Mac | `small.en` | CPU 优化 |

## 常见问题

### 1. Node.js 版本问题

如果遇到版本错误，请确保使用 Node.js 18：
```bash
# 使用 Homebrew 安装 Node.js 18
brew install node@18

# 设置 PATH
export PATH="/opt/homebrew/opt/node@18/bin:$PATH"

# 验证版本
node --version
```

### 2. Electron 启动失败

如果提示 "Electron failed to install correctly"：
```bash
# 删除并重新安装 electron
rm -rf node_modules/electron
npm install electron --save-dev --legacy-peer-deps
```

### 3. Python 环境问题

如果 Whisper 测试失败：
```bash
# 检查 Python 版本
python3 --version

# 检查 Whisper 安装
python3 -c "import whisper; print('Whisper OK')"

# 如果未安装，运行：
pip3 install openai-whisper torch
```

### 4. FFmpeg 相关问题

FFmpeg 已经包含在项目中，位于 `lib/` 目录。如果需要更新：
```bash
# 重新下载
npm run download
```

## 开发调试

### 查看开发者工具

在应用中按 `Cmd+Option+I` (macOS) 或 `Ctrl+Shift+I` (Windows/Linux) 打开开发者工具。

### 日志位置

- **主进程日志**: 在终端中查看
- **渲染进程日志**: 在开发者工具的 Console 中查看

### 热重载

开发模式下，修改代码后会自动重新加载，无需重启应用。

## 项目结构

```
DashPlayer/
├── out/                     # 构建输出目录
│   └── DashPlayer-darwin-arm64/
│       └── DashPlayer.app   # macOS 应用
├── src/                     # 源代码
│   ├── backend/            # 后端代码
│   ├── fronted/            # 前端代码
│   └── common/             # 共享代码
├── lib/                    # 必要的二进制文件
│   ├── ffmpeg              # 视频处理工具
│   └── ffprobe             # 视频信息工具
└── node_modules/           # 依赖包
```

## 性能优化建议

1. **使用本地 Whisper**: 避免网络延迟，保护隐私
2. **选择合适的模型**: 根据硬件配置选择最优模型
3. **启用 GPU 加速**: Apple Silicon 设备自动使用 MPS
4. **调整并发数**: 在设置中调整并发任务数量（建议 1-2）

## 获取帮助

如果遇到问题：

1. 查看 [LOCAL_WHISPER_README.md](./LOCAL_WHISPER_README.md) 获取详细文档
2. 查看 [WHISPER_IMPLEMENTATION_SUMMARY.md](./WHISPER_IMPLEMENTATION_SUMMARY.md) 了解技术细节
3. 在项目仓库提交 Issue