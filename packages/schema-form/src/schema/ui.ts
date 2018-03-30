export interface SFGridSize {
    span?: number;
    order?: number;
    offset?: number;
    push?: number;
    pull?: number;
}

export interface SFGrid {
    /**
     * 栅格间隔
     */
    gutter?: number;
    /**
     * 栅格占位格数，为 `0` 时相当于 `display: none`
     */
    span?: number;
    /**
     * 栅格左侧的间隔格数，间隔内不可以有栅格
     */
    offset?: number;
    xs?: number | SFGridSize;
    sm?: number | SFGridSize;
    md?: number | SFGridSize;
    lg?: number | SFGridSize;
    xl?: number | SFGridSize;
    xxl?: number | SFGridSize;
}

/** 指定如何渲染 `Schema` 包括表单布局方式 */
export interface SFUISchemaItem {

    [key: string]: any;

    /**
     * 指定表单布局方式，默认：`horizontal`
     */
    layout?: 'horizontal' | 'vertical' | 'inline';

    /**
     * 指定采用什么小部件渲染，所有小部件名可[查阅文档](https://travis-ci.org/cipchk/nz-schema-form)
     */
    widget?: string;
    /**
     * 文字框中显示提示信息
     */
    placeholder?: string;
    /**
     * 用于显示表单帮助信息
     */
    help?: string;
    ////////// 渲染类 //////////
    /** 指定 `input` 的 `type` 值，默认为：`text` */
    type?: string;
    /**
     * 自定义类，等同 `[ngClass]` 值
     */
    class?: string | string[];
    /**
     * 自定义样式，等同 `[ngStyle]` 值
     */
    style?: { [key: string]: string };
    /**
     * 元素组件大小
     */
    size?: 'default' | 'large' | 'small';
    /**
     * 响应式属性
     */
    grid?: SFGrid;
    /**
     * `label` 栅格占位格数，默认：`5`
     * - `0` 时相当于 `display: none`
     * - 限 `horizontal` 水平布局有效
     */
    span_label?: number;
    /**
     * `control` 栅格占位格数，默认：`19`
     * - `0` 时相当于 `display: none`
     * - 限 `horizontal` 水平布局有效
     */
    span_control?: number;
    /**
     * `control` 栅格左侧的间隔格数，间隔内不可以有栅格
     * - 限 `horizontal` 水平布局有效
     */
    offset_control?: number;
    /**
     * `label` 固定宽度，默认：`100`
     * - 限 `horizontal` 水平布局有效
     */
    span_label_fixed?: number;
    ////////// 其它类 //////////

    /** 属性顺序 */
    order?: string[];

    /** 是否禁用 */
    disabled?: boolean;

    /** 加载时是否获得焦点，限 `string` 有效 */
    autofocus?: boolean;

    /** 当 `string` 为空时传递该值 */
    emptyValue?: string;

    ////////// 数组类 //////////
    /** 当 `array` 时指定子元素的UI Schema */
    items?: SFUISchema;

    /** 当 `array` 时指定是否显示排序按钮 */
    orderable?: boolean;

    /** 当 `array` 时指定是否显示移除按钮 */
    removable?: boolean;
}

/**
 * UI Schema，KEY名**务必**是 `key:${schema key name}` 组合，以便能区分KEY值还是UI选项
 * - 结构层级应同 `SFSchema` 一致
 * - 当KEY为 `*` 时表示对所有子表单元素都有效
 */
export interface SFUISchema {
    [ key: string ]: SFUISchemaItem;
}
