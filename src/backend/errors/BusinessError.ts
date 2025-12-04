/**
 * 业务错误类
 * 提供统一的错误处理和用户友好的错误消息
 */

export class BusinessError extends Error {
    public readonly code: string;
    public readonly userMessage: string;
    public readonly context?: Record<string, any>;
    public readonly originalError?: Error;

    constructor(
        userMessage: string,
        code: string,
        context?: Record<string, any>,
        originalError?: Error
    ) {
        super(userMessage);
        this.name = 'BusinessError';
        this.userMessage = userMessage;
        this.code = code;
        this.context = context;
        this.originalError = originalError;
    }

    toJSON() {
        return {
            name: this.name,
            message: this.message,
            userMessage: this.userMessage,
            code: this.code,
            context: this.context,
            stack: this.stack
        };
    }
}

/**
 * 特定错误类型
 */
export class ValidationError extends BusinessError {
    constructor(field: string, message: string, context?: Record<string, any>) {
        super(`字段 "${field}" 验证失败: ${message}`, 'VALIDATION_ERROR', context);
        this.name = 'ValidationError';
    }
}

export class FileNotFoundError extends BusinessError {
    constructor(filePath: string, context?: Record<string, any>) {
        super(`文件未找到: ${filePath}`, 'FILE_NOT_FOUND', context);
        this.name = 'FileNotFoundError';
    }
}

export class PermissionError extends BusinessError {
    constructor(operation: string, context?: Record<string, any>) {
        super(`权限不足，无法执行操作: ${operation}`, 'PERMISSION_DENIED', context);
        this.name = 'PermissionError';
    }
}

export class NetworkError extends BusinessError {
    constructor(message: string = '网络连接失败', context?: Record<string, any>) {
        super(message, 'NETWORK_ERROR', context);
        this.name = 'NetworkError';
    }
}

export class TaskTimeoutError extends BusinessError {
    constructor(taskId: string, timeout: number, context?: Record<string, any>) {
        super(`任务 ${taskId} 执行超时（${timeout}ms）`, 'TASK_TIMEOUT', context);
        this.name = 'TaskTimeoutError';
    }
}

/**
 * 错误处理工具
 */
export class ErrorHandler {
    /**
     * 处理并转换错误为业务错误
     */
    static handle(error: unknown, context?: Record<string, any>): BusinessError {
        // 如果已经是业务错误，直接返回
        if (error instanceof BusinessError) {
            return error;
        }

        // 处理 Node.js 系统错误
        if (error instanceof Error) {
            if (error.name === 'TypeError') {
                return new BusinessError(
                    '数据格式错误，请检查输入内容',
                    'TYPE_ERROR',
                    { ...context, originalError: error.message }
                );
            }

            if (error.name === 'RangeError') {
                return new BusinessError(
                    '数值超出有效范围',
                    'RANGE_ERROR',
                    { ...context, originalError: error.message }
                );
            }

            // 处理文件系统错误
            if ('code' in error) {
                const nodeError = error as any;
                switch (nodeError.code) {
                    case 'ENOENT':
                        return new FileNotFoundError(
                            nodeError.path || '未知文件',
                            context
                        );
                    case 'EACCES':
                        return new PermissionError(
                            nodeError.path || '未知操作',
                            context
                        );
                    case 'ETIMEDOUT':
                        return new NetworkError(
                            '操作超时',
                            context
                        );
                    default:
                        return new BusinessError(
                            `系统错误: ${nodeError.message}`,
                            'SYSTEM_ERROR',
                            { ...context, errorCode: nodeError.code }
                        );
                }
            }

            // 通用错误处理
            return new BusinessError(
                error.message || '发生未知错误',
                'UNKNOWN_ERROR',
                context
            );
        }

        // 处理非 Error 对象
        return new BusinessError(
            String(error || '发生未知错误'),
            'UNKNOWN_ERROR',
            context
        );
    }

    /**
     * 异步处理错误
     */
    static async handleAsync<T>(
        operation: () => Promise<T>,
        context?: Record<string, any>
    ): Promise<T> {
        try {
            return await operation();
        } catch (error) {
            throw ErrorHandler.handle(error, context);
        }
    }
}