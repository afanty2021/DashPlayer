#!/usr/bin/env node

/**
 * 测试 DashPlayer 文件协议的脚本
 * 用于验证 dp-file:// 协议是否正常工作
 */

const path = require('path');
const { app, BrowserWindow } = require('electron');

const testFile = path.resolve(__dirname, '30155081536.mp4');
console.log('测试文件路径:', testFile);

// 检查文件是否存在
const fs = require('fs');
if (fs.existsSync(testFile)) {
    console.log('✅ 文件存在');
    const stats = fs.statSync(testFile);
    console.log('文件大小:', (stats.size / 1024 / 1024).toFixed(2), 'MB');
} else {
    console.log('❌ 文件不存在');
    process.exit(1);
}

// 模拟注册 dp-file 协议
const { protocol } = require('electron');

function registerFileProtocol() {
    const DP_FILE = 'dp-file';
    protocol.registerFileProtocol(DP_FILE, (request, callback) => {
        const url = request.url.replace(`${DP_FILE}://`, '');
        try {
            console.log('文件协议请求:', request.url);
            console.log('解析后的路径:', decodeURIComponent(url));
            return callback(decodeURIComponent(url));
        } catch (error) {
            console.error('文件协议解析错误:', error);
            return callback('');
        }
    });
    console.log('✅ dp-file 协议已注册');
}

// 创建测试窗口
function createTestWindow() {
    let win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    // 创建测试HTML
    const testHtml = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>DashPlayer 协议测试</title>
    </head>
    <body>
        <h1>DashPlayer 文件协议测试</h1>
        <p>测试文件: ${testFile}</p>
        <video controls style="width: 100%; max-width: 600px;">
            <source src="dp-file://${encodeURIComponent(testFile)}" type="video/mp4">
            您的浏览器不支持视频标签。
        </video>
        <script>
            const video = document.querySelector('video');
            video.addEventListener('loadstart', () => console.log('开始加载'));
            video.addEventListener('canplay', () => console.log('可以播放'));
            video.addEventListener('error', (e) => {
                console.error('视频加载错误:', e);
                console.error('错误详情:', video.error);
            });
        </script>
    </body>
    </html>
    `;

    win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(testHtml));
    win.webContents.openDevTools();

    return win;
}

app.whenReady().then(() => {
    registerFileProtocol();
    createTestWindow();
});

app.on('window-all-closed', () => {
    app.quit();
});