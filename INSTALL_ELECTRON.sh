#!/bin/bash

# Electron 安装脚本

echo "Electron 安装脚本"
echo "==============="

# 1. 设置环境
export PATH="/opt/homebrew/opt/node@18/bin:$PATH"
export ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"
export ELECTRON_CUSTOM_DIR="{{ version }}"
export ELECTRON_CACHE="${HOME}/.cache/electron"
export ELECTRON_BUILDER_CACHE="${HOME}/.cache/electron-builder"

echo "1. 环境设置完成"
echo "   Node.js: $(node --version)"
echo "   npm: $(npm --version)"
echo "   Electron 镜像: ${ELECTRON_MIRROR}"

# 2. 清理旧的 electron
echo ""
echo "2. 清理旧的 Electron 安装..."
rm -rf node_modules/electron
rm -rf ~/.cache/electron
rm -rf ~/.cache/electron-builder

# 3. 设置 npm 配置
echo ""
echo "3. 配置 npm 镜像..."
npm config set registry https://registry.npmmirror.com/
npm config set electron_mirror https://npmmirror.com/mirrors/electron/
npm config set electron_custom_dir "{{ version }}"

# 4. 使用淘宝镜像安装 electron
echo ""
echo "4. 安装 Electron..."
echo "   这可能需要几分钟，请耐心等待..."

# 使用 cnpm 安装 electron
npx cnpm install electron@28.3.3 --save-dev --no-package-lock

# 如果 cnpm 不可用，尝试使用 yarn
if [ $? -ne 0 ]; then
    echo "   cnpm 安装失败，尝试使用 yarn..."
    yarn config set registry https://registry.npmmirror.com/
    yarn config set electron_mirror https://npmmirror.com/mirrors/electron/
    yarn add electron@28.3.3 --dev --no-lockfile
fi

# 如果还是失败，尝试直接下载
if [ $? -ne 0 ]; then
    echo "   yarn 安装失败，尝试直接下载..."

    ELECTRON_VERSION="28.3.3"
    ELECTRON_DIST_URL="https://npmmirror.com/mirrors/electron/${ELECTRON_VERSION}/electron-v${ELECTRON_VERSION}-darwin-arm64.zip"

    mkdir -p node_modules/electron/dist
    cd node_modules/electron/dist

    echo "   下载 Electron from: ${ELECTRON_DIST_URL}"
    curl -L -o electron.zip "${ELECTRON_DIST_URL}"

    if [ -f electron.zip ]; then
        echo "   解压 Electron..."
        unzip -q electron.zip
        rm electron.zip
        chmod +x Electron
        echo "   Electron 安装成功！"
    else
        echo "   下载失败！"
    fi

    cd ../../..
fi

# 5. 恢复 npm 配置（可选）
echo ""
echo "5. 恢复 npm 配置..."
npm config delete registry
npm config delete electron_mirror
npm config delete electron_custom_dir

# 6. 验证安装
echo ""
echo "6. 验证安装..."
if [ -f "node_modules/electron/dist/Electron" ]; then
    echo "   ✓ Electron 安装成功！"
    echo "   版本: $(node_modules/electron/dist/Electron --version)"
else
    echo "   ✗ Electron 安装失败"
    echo ""
    echo "   请尝试手动安装："
    echo "   npm config set registry https://registry.npmmirror.com/"
    echo "   npm config set electron_mirror https://npmmirror.com/mirrors/electron/"
    echo "   npm install electron --save-dev"
fi