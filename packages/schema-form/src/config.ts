import { Injectable } from '@angular/core';

@Injectable()
export class DelonSchemaFormConfig {
    /**
     * 是否忽略数据类型校验，默认：`true`
     *
     * - `false` 限定 Schema 中 `type` 类型，若产生的数据非 `type` 类型会视为错误
     * - `true` 不限定 Schema 中 `type` 类型，若产生的数据非 `type` 类型会视为成功
     */
    ingoreTypeValidator?: boolean;
    /**
     * 是否只展示错误视觉不显示错误文本，默认：`false`
     */
    onlyVisual?: boolean;
    /**
     * 是否展示 `description`，默认：`false`
     */
    showDescription?: boolean;
    /**
     * 自定义通用错误信息
     */
    errors?: { [ key: string ]: string };
}
