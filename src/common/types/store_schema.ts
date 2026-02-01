export const SettingKeyObj = {
    'shortcut.previousSentence': 'left,a',
    'shortcut.nextSentence': 'right,d',
    'shortcut.repeatSentence': 'down,s',
    'shortcut.playPause': 'space,up,w',
    'shortcut.repeatSingleSentence': 'r',
    'shortcut.autoPause': 'u',
    'shortcut.toggleEnglishDisplay': 'e',
    'shortcut.toggleChineseDisplay': 'c',
    'shortcut.toggleWordLevelDisplay': 'l',
    'shortcut.toggleBilingualDisplay': 'b',
    'shortcut.nextTheme': 't',
    'shortcut.adjustBeginMinus': 'z',
    'shortcut.adjustBeginPlus': 'x',
    'shortcut.adjustEndMinus': 'n',
    'shortcut.adjustEndPlus': 'm',
    'shortcut.clearAdjust': 'v',
    'shortcut.nextPlaybackRate': 'p',
    'shortcut.aiChat': 'slash',
    'shortcut.toggleCopyMode': 'shift+y',
    'shortcut.addClip': 'shift+l',
    'shortcut.openControlPanel': 'shift+p',
    'userSelect.playbackRateStack':'',
    'apiKeys.youdao.secretId': '',
    'apiKeys.youdao.secretKey': '',
    'apiKeys.tencent.secretId': '',
    'apiKeys.tencent.secretKey': '',
    'apiKeys.openAi.key': '',
    'apiKeys.openAi.endpoint': '',
    'apiKeys.openAi.stream': 'on',
    'translation.engine': 'tencent',
    'subtitleTranslation.engine': 'openai',
    'dictionary.engine': 'openai',
    'transcription.engine': 'openai',
    'model.gpt.default': 'gpt-4o-mini',
    // Whisper 配置
    'whisper.provider': 'openai', // 'openai' | 'local' | 'aliyun'
    'whisper.local.model': 'medium.en', // 'tiny.en' | 'base.en' | 'small.en' | 'medium.en' | 'large-v3' | 'large-v3-turbo'
    'whisper.local.pythonPath': '/opt/homebrew/Caskroom/miniconda/base/envs/Whisper-env/bin/python3.11', // Python解释器路径
    'whisper.local.device': 'auto', // 'auto' | 'cpu' | 'mps' | 'cuda'
    'whisper.local.enableCache': true, // 是否启用模型缓存
    'whisper.local.maxConcurrency': 2, // 最大并发转录数
    'appearance.theme': 'light',
    'appearance.fontSize': 'fontSizeLarge',
    'player.autoPlayNext': 'false',
    'storage.path': '',
    'storage.collection': 'default',
}
export type SettingKey = keyof typeof SettingKeyObj;
