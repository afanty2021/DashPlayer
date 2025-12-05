#!/bin/bash

echo "🔧 彻底修复DashPlayer native模块问题..."

# 1. 清理所有构建产物
echo "🧹 清理构建产物..."
rm -rf out/
rm -rf node_modules/
rm -f package-lock.json
rm -f yarn.lock

# 2. 清理npm缓存
echo "🧹 清理npm缓存..."
npm cache clean --force

# 3. 重新安装依赖（分阶段）
echo "📦 安装核心依赖..."
npm install --legacy-peer-deps --timeout=600000

# 4. 重新编译所有native模块
echo "🔨 重新编译native模块..."
npm rebuild --runtime=electron --target=18.2.0 --disturl=https://electronjs.org/headers --force

# 5. 专门重新编译有问题的模块
echo "🔧 修复macos-alias模块..."
cd node_modules/macos-alias
npm rebuild
cd ../..

echo "✅ 修复完成！现在可以运行 'npm run make' 构建应用"