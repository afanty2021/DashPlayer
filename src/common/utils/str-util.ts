/**
 * DashPlayer 字符串处理工具类
 *
 * 职责：
 * - 提供字符串的空值检查和验证
 * - 支持多种字符串状态的判断
 * - 提供类型守卫函数，增强类型安全
 * - 支持批量字符串操作
 *
 * 特性：
 * - TypeScript 类型守卫支持
 * - 处理 null、undefined、空字符串和空白字符串
 * - 批量操作和条件检查
 * - 链式操作友好的方法设计
 */

export default class StrUtil {
    /**
     * 检查字符串是否为空值
     *
     * 判断条件：
     * - null
     * - undefined
     * - 空字符串 ""
     * - 只包含空白字符的字符串（空格、制表符、换行等）
     *
     * 类型守卫：
     * 返回 true 时，TypeScript 会将类型收窄为 undefined | null | ''
     *
     * @param str - 要检查的字符串
     * @returns 如果字符串为空或仅包含空白字符则返回 true
     *
     * @example
     * ```typescript
     * StrUtil.isBlank(null)      // true
     * StrUtil.isBlank(undefined) // true
     * StrUtil.isBlank("")        // true
     * StrUtil.isBlank("   ")     // true
     * StrUtil.isBlank("\n\t")    // true
     * StrUtil.isBlank("hello")   // false
     * ```
     */
    public static isBlank(str: string | undefined | null): str is undefined | null | '' {
        return str === undefined || str === null || str.trim() === '';
    }

    /**
     * 检查字符串是否为非空值
     *
     * 判断条件：
     * - 不是 null
     * - 不是 undefined
     * - 不是空字符串 ""
     * - 不只包含空白字符
     *
     * 类型守卫：
     * 返回 true 时，TypeScript 会将类型收窄为 string
     *
     * @param str - 要检查的字符串
     * @returns 如果字符串为非空且包含非空白字符则返回 true
     *
     * @example
     * ```typescript
     * StrUtil.isNotBlank("hello") // true
     * StrUtil.isNotBlank("  hi ") // true
     * StrUtil.isNotBlank("")      // false
     * StrUtil.isBlank("   ")      // false
     * ```
     */
    public static isNotBlank(str: string | undefined | null): str is string {
        return !StrUtil.isBlank(str);
    }

    /**
     * 检查所有字符串是否都为空值
     *
     * 功能：
     * - 批量检查多个字符串
     * - 只有当所有字符串都为空时才返回 true
     * - 至少有一个非空字符串则返回 false
     *
     * 使用场景：
     * - 表单验证：检查多个必填字段
     * - 配置验证：确保所有必要参数都已提供
     * - 数据完整性检查
     *
     * @param strs - 要检查的字符串数组
     * @returns 如果所有字符串都为空值则返回 true
     *
     * @example
     * ```typescript
     * StrUtil.allBlank("", "   ", null)  // true
     * StrUtil.allBlank("", "hello")     // false
     * StrUtil.allBlank("a", "b", "c")   // false
     * ```
     */
    public static allBlank(...strs: (string | undefined | null)[]): boolean {
        return strs.every(this.isBlank);
    }

    /**
     * 字符串空值替换
     *
     * 功能：
     * - 当输入字符串为空值时返回默认值
     * - 当输入字符串非空时返回原字符串
     * - 保证返回值始终为非空字符串
     *
     * 使用场景：
     * - 设置默认值
     * - 参数处理和回退机制
     * - 数据清理和标准化
     *
     * @param str - 要检查的字符串
     * @param defaultStr - 默认字符串（当 str 为空时使用）
     * @returns 非空字符串（原字符串或默认值）
     *
     * @example
     * ```typescript
     * StrUtil.ifBlank(null, "default")     // "default"
     * StrUtil.ifBlank("", "default")       // "default"
     * StrUtil.ifBlank("hello", "default")  // "hello"
     * StrUtil.ifBlank("  ", "default")     // "default"
     * ```
     */
    public static ifBlank(str: string | undefined | null, defaultStr: string): string {
        return StrUtil.isBlank(str) ? defaultStr : str!;
    }

    /**
     * 检查是否有至少一个非空字符串
     *
     * 功能：
     * - 批量检查多个字符串
     * - 只要有一个字符串非空就返回 true
     * - 所有字符串都为空时返回 false
     *
     * 使用场景：
     * - 可选参数验证
     * - 搜索条件检查
     * - 任意有效值判断
     *
     * @param strs - 要检查的字符串数组
     * @returns 如果至少有一个字符串非空则返回 true
     *
     * @example
     * ```typescript
     * StrUtil.hasNonBlank("", "hello")    // true
     * StrUtil.hasNonBlank("a", "b", "c")  // true
     * StrUtil.hasNonBlank("", "", null)   // false
     * ```
     */
    public static hasNonBlank(...strs: (string | undefined | null)[]): boolean {
        return strs.some(StrUtil.isNotBlank);
    }

    /**
     * 检查是否有至少一个空字符串
     *
     * 功能：
     * - 批量检查多个字符串
     * - 只要有一个字符串为空就返回 true
     * - 所有字符串都非空时返回 false
     *
     * 使用场景：
     * - 数据完整性检查
     * - 必填字段验证
     * - 错误检测和提示
     *
     * @param strs - 要检查的字符串数组
     * @returns 如果至少有一个字符串为空则返回 true
     *
     * @example
     * ```typescript
     * StrUtil.hasBlank("", "hello")       // true
     * StrUtil.hasBlank("a", "", "c")      // true
     * StrUtil.hasBlank("a", "b", "c")     // false
     * StrUtil.hasBlank("a", "b", null)    // true
     * ```
     */
    public static hasBlank(...strs: (string | undefined | null)[]): boolean {
        return strs.some(StrUtil.isBlank);
    }
}
