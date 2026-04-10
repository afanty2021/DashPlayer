/**
 * 媒体库目录健康状态代码。
 */
export type StorageStatusCode =
    | 'ok'
    | 'missing'
    | 'not_directory'
    | 'not_readable'
    | 'not_writable';

/**
 * 媒体库目录健康状态。
 */
export interface StorageStatusVO {
    /** 当前设置中保存的原始路径；为空时表示使用默认媒体库目录。 */
    configuredPath: string;
    /** 经过默认值与环境后缀解析后的最终媒体库路径。 */
    resolvedPath: string;
    /** 当前路径是否已存在。 */
    exists: boolean;
    /** 当前路径是否为目录。 */
    isDirectory: boolean;
    /** 当前路径是否具备读取权限。 */
    readable: boolean;
    /** 当前路径是否具备写入权限。 */
    writable: boolean;
    /** 当前媒体库是否可供应用正常访问。 */
    available: boolean;
    /** 健康检查结果代码。 */
    code: StorageStatusCode;
    /** 面向用户展示的状态说明。 */
    message: string;
}
