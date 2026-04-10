export type VideoLearningClipStatus = 'pending' | 'in_progress' | 'completed' | 'analyzing';

/**
 * 当前视频对应的裁切按钮状态快照。
 */
export interface VideoLearningClipStatusVO {
    /** 当前视频的状态枚举。 */
    status: VideoLearningClipStatus;
    /** 当前视频还未入队的候选片段数量。 */
    pendingCount?: number;
    /** 当前视频已经入队、等待或正在裁切的片段数量。 */
    inProgressCount?: number;
    /** 当前视频已经完成裁切的片段数量。 */
    completedCount?: number;
    /** 当前视频分析进度，范围 0-100。 */
    analyzingProgress?: number;
    /** 状态序号，保证同一字幕键下单调递增。 */
    seq?: number;
}

/**
 * 全局裁切队列状态快照。
 */
export interface GlobalVideoLearningClipQueueStatusVO {
    /** 当前仍在队列中的自动裁切任务数量。 */
    queuedCount: number;
    /** 是否存在尚未完成的自动裁切任务。 */
    hasQueuedTasks: boolean;
}
