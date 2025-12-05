#!/bin/bash

echo "🚀 DashPlayer 简单启动"
echo "=================="

# 检查是否有node_modules
if [ ! -d "node_modules" ]; then
    echo "📦 安装基础依赖..."
    npm install --legacy-peer-deps --timeout=300000
fi

echo "🚀 启动开发模式..."
# 直接使用electron启动，跳过下载脚本
npx electron .