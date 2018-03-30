import { Component, OnInit, OnChanges, OnDestroy, SimpleChanges, Input, ChangeDetectorRef, ChangeDetectionStrategy, SimpleChange, Output, EventEmitter } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { Subject } from 'rxjs/Subject';
import { filter, tap } from 'rxjs/operators';

import { DelonSchemaFormConfig } from './config';
import { SFSchema } from './schema/index';
import { SFUISchema, SFUISchemaItem } from './schema/ui';
import { getDefaultFormState, retrieveSchema, getWidgetId, toId } from './renderer';
import { SFNotify, SFNotifyType, SFErrorTree, SFErrorObject, SFContext, SFIdSchema } from './interface';
import { validateFormData } from './validate';
import { isObject } from './utils';

@Component({
    selector: 'sf, [sf]',
    template: `
    <form nz-form [nzLayout]="layout" (submit)="onSubmit($event)" [autocomplete]="autocomplete">
        <sf-item
            key="root"
            [schema]="schema"
            [ui]="ui"
            [idSchema]="idSchema"
            [model]="_model"
            [ctx]="ctx">
        </sf-item>
        <ng-content></ng-content>
    </form>`,
    styleUrls: [ './patch.less' ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SFComponent implements OnInit, OnChanges, OnDestroy {

    private store$: Subscription;
    private store = new Subject<SFNotify>();
    _model: {};
    ctx: SFContext;
    idSchema: SFIdSchema;
    layout = 'horizontal';
    private isValid = true;

    // region: fields

    @Input() schema: SFSchema;

    /** 表单 UI Schema，用于决定如何渲染 */
    @Input() ui: SFUISchema;

    /** 表单默认值 */
    @Input() formData: {};

    /** 是否实时校验，默认：`true` */
    @Input() liveValidate = true;

    /** 指定表单 `autocomplete` 值 */
    @Input() autocomplete: string = null;

    @Input() errors: (errors: SFErrorObject[]) => SFErrorObject[];

    @Input() validate: (data: any, errorTree: SFErrorTree) => SFErrorObject[];

    /** 数据变更时回调 */
    @Output() dataChange = new EventEmitter();

    /** 提交表单时回调 */
    @Output() submit = new EventEmitter();

    // endregion

    onSubmit(e: Event) {
        e.preventDefault();
        e.stopPropagation();
        this.validateData();
        if (!this.isValid) return;
        this.submit.emit(this._model);
    }

    private coerceContext(): this {
        this.ctx = {
            definitions: this.schema.definitions || {},
            store: this.store,
            commonUI: Object.assign(<SFUISchemaItem>{
                layout: 'horizontal'
            }, (this.ui || {})['*'])
        };
        return this;
    }

    private coerce() {
        const { definitions } = this.schema;
        this._model = getDefaultFormState(this.schema, this.formData, definitions);
        const retrievedSchema = retrieveSchema(this.schema, definitions, this._model);

        if (this.liveValidate && typeof this.formData !== 'undefined') {
            this.validateData();
        }

        // generate id schema
        this.idSchema = toId(
            retrievedSchema,
            '',
            [],
            definitions,
            this._model
        );
        // console.log('schema', this.schema);
        // console.log('model', this._model);
        // console.log('idSchema', this.idSchema);
    }

    private updateModel(value: any, path: string[]): this {
        let obj = this._model;
        for (let i = 0, c = path.length - 1; i < c; i++) {
            const key = path[i];
            if (!obj.hasOwnProperty(key)) obj[key] = {};
            obj = obj[key];
        }
        obj[path[path.length - 1]] = value;

        if (this.liveValidate) this.validateData();

        this.dataChange.emit(this._model);
        return this;
    }

    private validateData() {
        const { errors, errorSchema } = validateFormData(this.schema, this._model, this.validate, this.errors);
        this.isValid = errors.length === 0;
    }

    private destoryWidgets(): this {
        this.store.next({ type: SFNotifyType.DESTROY });
        return this;
    }

    constructor(
        _config: DelonSchemaFormConfig,
        private cd: ChangeDetectorRef
    ) {
        Object.assign(this, _config);
    }

    ngOnInit(): void {
        if (!this.schema || !isObject(this.schema))
            throw new Error(`Missing schema object`);

        this.store$ = this.store.pipe(
            filter(f => f.type === SFNotifyType.SET_VALUE || f.type === SFNotifyType.VALID)
        ).subscribe(res => {
            if (res.type === SFNotifyType.VALID) {
                return ;
            }
            this.updateModel(res.value, res.path);
        });
    }

    ngOnChanges(changes: { [P in keyof this]?: SimpleChange } & SimpleChanges): void {
        this.destoryWidgets()
            .coerceContext()
            .coerce();
    }

    ngOnDestroy(): void {
        this.destoryWidgets();
        this.store$.unsubscribe();
    }
}
