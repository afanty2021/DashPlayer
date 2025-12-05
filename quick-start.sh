#!/bin/bash

echo "🚀 DashPlayer 快速构建和启动脚本"
echo "=================================="

# 检查node_modules是否存在
if [ ! -d "node_modules" ]; then
    echo "📦 安装基础依赖..."
    npm install --production --legacy-peer-deps --timeout=300000
    echo "🔧 安装开发依赖..."
    npm install --dev --legacy-peer-deps --timeout=300000
fi

echo "🔨 重新编译native模块..."
npm rebuild

echo "🏗️  打包应用（跳过DMG）..."
yarn package

echo "📱 启动应用..."
open "out/DashPlayer-darwin-arm64/DashPlayer.app"

echo "✅ 完成！应用已启动"