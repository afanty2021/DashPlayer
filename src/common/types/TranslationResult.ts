export type TranslationProvider = 'tencent' | 'openai';

export type TranslationMode = 'zh' | 'simple_en' | 'custom';

/**
 * 渲染层使用的字幕翻译失败事件。
 * 说明：用于把执行失败的句子状态恢复为可重试，避免前端一直停留在 `translating`。
 */
export type RendererTranslationFailure = {
    /** 失败条目所属的字幕文件哈希。 */
    fileHash: string;
    /** 失败条目的稳定句子键列表，格式为 `fileHash:index`。 */
    keys: string[];
    /** 当前失败结果来源 provider。 */
    provider: TranslationProvider;
    /** OpenAI 场景下的模式；腾讯固定视为 `zh`。 */
    mode?: TranslationMode;
};

/**
 * 渲染层使用的字幕翻译条目。
 * 说明：`key` 固定为稳定句子键（`fileHash:index`），用于前后端按句对齐结果。
 */
export type RendererTranslationItem = {
    /** 稳定句子键，格式为 `fileHash:index`。 */
    key: string;
    /** 当前字幕文件哈希，用于过滤跨文件的过期结果。 */
    fileHash: string;
    /** 翻译文本。 */
    translation: string;
    /** 结果来源 provider。 */
    provider: TranslationProvider;
    /** OpenAI 场景下的模式；腾讯固定视为 `zh`。 */
    mode?: TranslationMode;
    /** 是否为最终结果；流式/中间结果时为 `false`。 */
    isComplete?: boolean;
};
