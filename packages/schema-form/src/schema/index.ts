import { SFUISchemaItem } from './ui';

export interface SFSchemaDefinition {
    [key: string]: SFSchema;
}

/**
 * JSON Schema Form 结构体
 *
 * **注意：** 所有结构都以标准为基准，除了 `ui`、`debug` 两个属性为非标准单纯只是为了更好的开发
 */
export interface SFSchema {
    //////////// Any /////////////
    /**
     * 数据类型，支持 JavaScript 基础类型；注意项：
     *
     * - JSON 中 `date` 等同 `string` 类型
     * - 指定 `format` 标准参数可以自动适配渲染小部件
     * - 指定 `widget` 参数强制渲染小部件
     */
    type?: 'number' | 'integer' | 'string' | 'boolean' | 'object' | 'array';
    /**
     * 枚举
     */
    enum?: any[];
    //////////// 数值类型 /////////////
    /**
     * 最小值
     *
     * 一般用于类型 `number` `slider`
     */
    minimum?: number;
    /**
     * 约束是否包括 `minimum` 值
     *
     * 一般用于类型 `number` `slider`
     */
    exclusiveMinimum?: boolean;
    /**
     * 最大值
     *
     * 一般用于类型 `number` `slider`
     */
    maximum?: number;
    /**
     * 约束是否包括 `maximum` 值
     *
     * 一般用于类型 `number` `slider`
     */
    exclusiveMaximum?: boolean;
    /**
     * 倍数
     *
     * 一般用于类型 `number` `slider`
     */
    multipleOf?: number;
    //////////// 字符串类型/////////////
    /**
     * 定义字符串的最大长度
     *
     * 一般用于类型 `string` `text`
     */
    maxLength?: number;
    /**
     * 定义字符串的最小长度
     *
     * 一般用于类型 `string` `text`
     */
    minLength?: number;
    /**
     * 验证输入字段正则表达式字符串
     */
    pattern?: string;
    //////////// 数组类型/////////////
    /**
     * 元素的类型描述
     */
    items?: SFSchema | SFSchema[];
    /**
     * 约束数组最小的元素个数
     *
     * 限 `type=array` 时有效
     */
    minItems?: number;
    /**
     * 约束数组最大的元素个数
     *
     * 限 `type=array` 时有效
     */
    maxItems?: number;
    /**
     * 约束数组每个元素都不相同
     *
     * 限 `type=array` 时有效
     */
    uniqueItems?: boolean;
    /**
     * 数组额外元素的校验规则
     */
    additionalItems?: SFSchema;
    //////////// 对象类型/////////////
    /**
     * 最大属性个数，必须是非负整数
     */
    maxProperties?: number;
    /**
     * 最小属性个数，必须是非负整数
     */
    minProperties?: number;
    /**
     * 必需属性
     */
    required?: string[];
    /**
     * 定义属性
     */
    properties?: { [key: string]: SFSchema };
    /**
     * 属性或Schema依赖
     */
    dependencies?: { [key: string]: string[] | SFSchema };
    //////////// 条件类/////////////

    //////////// 逻辑类/////////////
    /** **不建议** 使用，可用 `required` 替代 */
    allOf?: SFSchema[];
    /** **不建议** 使用，可用 `required` 和 `minProperties` 替代 */
    anyOf?: SFSchema[];
    /** 值必须是其中之一 */
    oneOf?: SFSchema[];
    //////////// 注释/////////////
    /**
     * 标题，相当于 `label` 值
     */
    title?: string;
    /**
     * 提示信息，在 `label` 后以问号和tooltip呈现
     */
    description?: string;
    /**
     * 默认值
     */
    default?: any;
    /**
     * 是否只读状态
     */
    readOnly?: boolean;
    //////////// 其他/////////////
    /**
     * 数据格式
     * @see http://json-schema.org/latest/json-schema-validation.html#rfc.section.7.3
     */
    format?: string;
    //////////// Definitions /////////////
    /** 指定 Schema JSON 模式，默认为：`http://json-schema.org/draft-07/schema` */
    $schema?: string;
    /** 内部类型定义体 */
    definitions?: SFSchemaDefinition;
    /** 引用定义体 */
    $ref?: string;
    // $schema?: string;
    // $comment?: string;
    //////////// 非标准/////////////
    /** **非标准：** 指定UI配置信息，优先级高于 `uiSchema` 属性值 */
    ui?: SFUISchemaItem;
    /** **非标准：** 是否开启调试模式 */
    debug?: boolean;
}
