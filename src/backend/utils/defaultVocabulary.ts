import fs from 'node:fs/promises';

import { getRuntimeResourcePath } from '@/backend/utils/runtimeEnv';

/**
 * 默认词表中的单词定义。
 */
export interface DefaultVocabularyWord {
    /**
     * 单词原文。
     */
    word: string;
    /**
     * 单词释义。
     */
    translate?: string;
}

const DEFAULT_VOCABULARY_JSONL_FILE_NAME = 'default-vocabulary.jsonl';
const DEFAULT_VOCABULARY_JSONL_PATH = getRuntimeResourcePath('resources', DEFAULT_VOCABULARY_JSONL_FILE_NAME);

/**
 * 从运行时资源中读取默认词表。
 *
 * 行为说明：
 * - 词表文件采用 JSONL 格式，每行一个对象。
 * - 仅保留结构合法且包含 `word` 字段的记录。
 *
 * @returns 默认词表数组，保持文件中的原始顺序。
 */
export const loadDefaultVocabulary = async (): Promise<DefaultVocabularyWord[]> => {
    const content = await fs.readFile(DEFAULT_VOCABULARY_JSONL_PATH, 'utf-8');
    const lines = content
        .split(/\r?\n/u)
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

    const results: DefaultVocabularyWord[] = [];
    for (const line of lines) {
        const raw = JSON.parse(line) as unknown;
        if (!raw || typeof raw !== 'object') continue;

        const item = raw as Partial<DefaultVocabularyWord>;
        if (!item.word) continue;

        results.push({
            word: item.word,
            translate: item.translate,
        });
    }

    return results;
};
