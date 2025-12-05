#!/bin/bash

echo "🔧 DashPlayer 开发模式启动"
echo "============================"

# 检查是否有基础依赖
if [ ! -d "node_modules" ] || [ ! -f "node_modules/.bin/electron" ]; then
    echo "📦 安装最小依赖..."
    npm install electron --save-dev --legacy-peer-deps
fi

echo "🚀 启动开发模式..."
npm start