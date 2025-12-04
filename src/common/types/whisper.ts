/**
 * Whisper服务相关类型定义
 */

export interface WhisperConfig {
  provider: 'openai' | 'local' | 'aliyun';
  local: {
    model: 'tiny.en' | 'base.en' | 'small.en' | 'medium.en' | 'large-v3' | 'large-v3-turbo';
    pythonPath: string;
    device: 'auto' | 'cpu' | 'mps' | 'cuda';
    enableCache: boolean;
    maxConcurrency: number;
  };
}

export interface LocalWhisperProgress {
  stage: 'loading_model' | 'transcribing' | 'processing' | 'completed';
  progress?: number;
  message?: string;
  realTimeRatio?: number; // 实时率：音频时长/处理时间
}

export interface WhisperModelInfo {
  name: string;
  size: string; // 模型大小
  ramRequired: string; // 所需内存
  speed: 'fast' | 'medium' | 'slow';
  accuracy: 'basic' | 'good' | 'excellent';
  description: string;
  recommendedFor: string;
}

export const WHISPER_MODELS: Record<string, WhisperModelInfo> = {
  'tiny.en': {
    name: 'Tiny (English)',
    size: '39 MB',
    ramRequired: '~1 GB',
    speed: 'fast',
    accuracy: 'basic',
    description: '最快的模型，适合快速预览',
    recommendedFor: '快速测试、实时转录'
  },
  'base.en': {
    name: 'Base (English)',
    size: '74 MB',
    ramRequired: '~1 GB',
    speed: 'fast',
    accuracy: 'good',
    description: '平衡速度和准确率',
    recommendedFor: '日常使用、轻度转录'
  },
  'small.en': {
    name: 'Small (English)',
    size: '244 MB',
    ramRequired: '~2 GB',
    speed: 'medium',
    accuracy: 'good',
    description: '较好的准确率，速度适中',
    recommendedFor: '学习场景、一般转录'
  },
  'medium.en': {
    name: 'Medium (English)',
    size: '769 MB',
    ramRequired: '~5 GB',
    speed: 'medium',
    accuracy: 'excellent',
    description: '推荐模型，准确率和速度平衡',
    recommendedFor: '生产环境、高质量转录'
  },
  'large-v3': {
    name: 'Large V3',
    size: '1550 MB',
    ramRequired: '~10 GB',
    speed: 'slow',
    accuracy: 'excellent',
    description: '最高准确率，支持多语言',
    recommendedFor: '专业转录、多语言内容'
  },
  'large-v3-turbo': {
    name: 'Large V3 Turbo',
    size: '1550 MB',
    ramRequired: '~10 GB',
    speed: 'medium',
    accuracy: 'excellent',
    description: 'Large V3的优化版本，速度更快',
    recommendedFor: '需要高准确率且注重效率的场景'
  }
};

export type WhisperModel = keyof typeof WHISPER_MODELS;