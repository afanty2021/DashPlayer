#!/bin/bash

# DashPlayer 快速启动脚本

echo "DashPlayer 快速启动脚本"
echo "===================="

# 1. 设置 Node.js 18 环境
echo "1. 设置 Node.js 环境..."
export PATH="/opt/homebrew/opt/node@18/bin:$PATH"
echo "   Node.js 版本: $(node --version)"

# 2. 检查 Electron 是否安装
if [ ! -d "node_modules/electron" ]; then
    echo ""
    echo "2. Electron 未安装，正在安装..."
    echo "   这可能需要几分钟时间..."

    # 尝试使用 electron-forge 的内置 electron
    export ELECTRON_BUILDER_CACHE="${HOME}/.cache/electron"
    npm install --legacy-peer-deps || {
        echo "   npm install 失败，尝试使用 yarn..."
        yarn install --ignore-engines
    }
fi

# 3. 启动应用
echo ""
echo "3. 启动 DashPlayer..."
echo "   如果这是第一次运行，应用会自动下载必要的组件"
echo ""

# 尝试不同的启动方式
if command -v yarn &> /dev/null; then
    echo "   使用 yarn 启动..."
    yarn start
else
    echo "   使用 npm 启动..."
    npm start
fi