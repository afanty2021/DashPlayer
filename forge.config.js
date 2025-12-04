const { MakerSquirrel } = require('@electron-forge/maker-squirrel');
const { MakerDeb } = require('@electron-forge/maker-deb');
const { MakerRpm } = require('@electron-forge/maker-rpm');
const { MakerWix } = require('@electron-forge/maker-wix');
const { VitePlugin } = require('@electron-forge/plugin-vite');
// const { FusesPlugin } = require('@electron-forge/plugin-fuses');
// const { FuseV1Options, FuseVersion } = require('@electron/fuses');
const { MakerDMG } = require('@electron-forge/maker-dmg');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const fs = require('node:fs/promises');

const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'));

const config = {
    packagerConfig: {
        asar: true,
        icon: './assets/icons/icon',
        extraResource: ['./drizzle', './lib', './scripts'],
        executableName: 'dash-player',
        name: 'DashPlayer',
        osxSign: {
              identity: '-',  // Ad-hoc 签名
              'hardened-runtime': false,
          }
    },
    rebuildConfig: {
        onlyModules: [],
        force: false,
    },
    makers: [
        new MakerSquirrel({
            name: 'DashPlayer',
            loadingGif: './assets/icons/install.png',
            setupIcon: './assets/icons/icon.ico',
            iconUrl: 'https://raw.githubusercontent.com/solidSpoon/DashPlayer/master/assets/icons/icon.ico',
        }),
        new MakerDMG({
            icon: './assets/icons/icon.icns',
            format: 'ULFO',
        }),
        new MakerRpm({
            options: {
                name: 'dash-player',
                productName: 'DashPlayer',
                icon: './assets/icons/icon.png',
            },
        }),
        new MakerDeb({
            options: {
                name: 'dash-player',
                productName: 'DashPlayer',
                icon: './assets/icons/icon.png',
            },
        }),
        new MakerWix({
            name: 'DashPlayer',
            description: 'A video player for English learning',
            manufacturer: 'solidSpoon',
            version: packageJson.version,
            icon: './assets/icons/icon.ico',
            exe: 'dash-player.exe',
            ui: {
                chooseDirectory: true,
            },
        }),
    ],
    plugins: [
        new VitePlugin({
            build: [
                { entry: 'src/main.ts', config: 'vite.main.config.ts' },
                { entry: 'src/preload.ts', config: 'vite.preload.config.ts' },
            ],
            renderer: [{ name: 'main_window', config: 'vite.renderer.config.ts' }],
        }),
        // 注释掉 FusesPlugin，因为它需要应用签名才能正常工作
        // new FusesPlugin({
        //     version: FuseVersion.V1,
        //     [FuseV1Options.RunAsNode]: false,
        //     [FuseV1Options.EnableCookieEncryption]: true,
        //     [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
        //     [FuseV1Options.EnableNodeCliInspectArguments]: false,
        //     [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
        //     [FuseV1Options.OnlyLoadAppFromAsar]: true,
        // }),
    ],
    publishers: [
        {
            name: '@electron-forge/publisher-github',
            config: {
                repository: { owner: 'solidSpoon', name: 'DashPlayer' },
                prerelease: true,
            },
        },
    ],
    hooks: {
        postMake: async (_forgeConfig, makeResults) => {
            const version = packageJson.version;
            for (const result of makeResults) {
                if (result.platform !== 'win32') continue;
                for (let i = 0; i < result.artifacts.length; i++) {
                    const oldPath = result.artifacts[i];
                    if (!oldPath.toLowerCase().endsWith('.msi')) continue;
                    const dir = path.dirname(oldPath);
                    const arch = result.arch; // 'x64' | 'ia32' | 'arm64'
                    const newPath = path.join(dir, `DashPlayer-${version}-${arch}.msi`);
                    if (oldPath !== newPath) {
                        await fs.rename(oldPath, newPath);
                        // 更新 artifacts，确保 Publisher 上传重命名后的文件
                        result.artifacts[i] = newPath;
                        console.log(`Renamed MSI: ${oldPath} -> ${newPath}`);
                    }
                }
            }
            return makeResults;
        },
    },
};

module.exports = config;
