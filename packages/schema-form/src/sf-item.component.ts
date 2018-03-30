import { Component, Input, ViewChild, ViewContainerRef, OnInit, ComponentRef, ChangeDetectorRef, OnDestroy, ElementRef, Renderer2, ChangeDetectionStrategy } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { Subject } from 'rxjs/Subject';

import { SFSchema } from './schema';
import { SFUISchema } from './schema/ui';
import { WidgetFactory, Widget } from './widget';
import { getWidgetId, retrieveSchema, getUiOptions } from './renderer';
import { SFNotify, SFContext, SFNotifyType, SFIdSchema } from './interface';
import { filter } from 'rxjs/operators';

@Component({
    selector: 'sf-item',
    template: `<ng-template #target></ng-template>`,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SFItemComponent implements OnInit, OnDestroy {

    // region: fields
    @ViewChild('target', { read: ViewContainerRef })
    private container: ViewContainerRef;
    private el: HTMLDivElement;
    private ref: ComponentRef<Widget>;
    private instance: Widget;
    private notify$: Subscription;

    // region: fields

    @Input() key: string;

    @Input() schema: SFSchema;

    @Input() ui: SFUISchema;

    @Input() idSchema: SFIdSchema;

    @Input() model: {} = {};

    @Input() ctx: SFContext;

    // endregion

    get widget() {
        return this.ref;
    }

    // region: fixed label

    @Input('fixed-label') num: number;

    private fixedLabel() {
        if (this.el.children.length === 0 || this.num == null || this.num <= 0) return;
        const widgetEl = this.el.children[0];
        this.render.addClass(widgetEl, 'nz-sf-fixed');
        const labelEl = widgetEl.querySelector('nz-form-label');
        const unit = this.num + 'px';
        if (labelEl) {
            this.render.setStyle(labelEl, 'width', unit);
            this.render.setStyle(labelEl, 'flex', `0 0 ${unit}`);
        } else {
            const controlEl = widgetEl.querySelector('.ant-form-item-control');
            if (controlEl) this.render.setStyle(controlEl, 'margin-left', unit);
        }
    }

    // endregion

    private coerceUISchema(schema: SFSchema) {
        // merge all ui options from config, '*' and schema ui
        const ui = Object.assign({}, this.ctx.commonUI, schema.ui, getUiOptions(this.ui));
        // layout
        if (this.ctx.commonUI.layout === 'horizontal') {
            if (ui.span_label_fixed) {
                if (!ui.span_label_fixed) ui.span_label_fixed = 100;
            } else {
                if (!ui.span_label) ui.span_label = 5;
                if (!ui.span_control) ui.span_control = 19;
                if (!ui.offset_control) ui.offset_control = null;
            }
        } else {
            ui.span_label = null;
            ui.span_control = null;
            ui.offset_control = null;
        }

        ui.widget = getWidgetId(schema, ui);
        ui.readonly = Boolean(schema.readOnly);
        ui.required = Array.isArray(schema.required) && schema.required.indexOf(name) !== -1;
        ui.disabled = typeof ui.disabled === 'undefined' ? null : ui.disabled;
        ui.autofocus = Boolean(ui.autofocus);
        ui.description = ui.description || this.schema.description;
        ui.label = ui.title || this.schema.title || this.key;

        this.schema.ui = ui;
    }

    private overrideInstance(instance: Widget) {
        instance.schema = this.schema;
        instance.ui = this.schema.ui;
        instance.idSchema = this.idSchema;
        instance.ctx = this.ctx;
        instance.model = this.model;
        instance._init();
        this.instance = this.ref.instance;
        this.cd.detectChanges();
    }

    private destory() {
        this.ref.instance._destroy();
        this.ref.destroy();
    }

    constructor(
        private widgetFactory: WidgetFactory = null,
        private cd: ChangeDetectorRef,
        er: ElementRef,
        private render: Renderer2
    ) {
        this.el = er.nativeElement as HTMLDivElement;
    }

    ngOnInit(): void {
        console.log('sf-item oninit, ', new Date, this.idSchema.id);
        this.schema = retrieveSchema(this.schema, this.ctx.definitions, this.model);
        this.coerceUISchema(this.schema);

        this.ref = this.widgetFactory.createWidget(this.container, this.schema.ui.widget || this.schema.type);
        this.overrideInstance(this.ref.instance);

        this.notify$ = this.ctx.store.pipe(
            filter(w => w.id === this.idSchema.id && (w.type & (SFNotifyType.DESTROY | SFNotifyType.SET_ERROR)) > 0)
        ).subscribe(res => {
            switch (res.type) {
                case SFNotifyType.DESTROY:
                    this.destory();
                    break;
                case SFNotifyType.SET_ERROR:
                    this.instance.setError(res.value);
                    // this.cd.detectChanges();
                    break;
            }
        });
        this.fixedLabel();
    }

    ngOnDestroy(): void {
        console.log('sf-item destroy, ', new Date, this.idSchema.id);
        this.destory();
        this.notify$.unsubscribe();
    }
}
