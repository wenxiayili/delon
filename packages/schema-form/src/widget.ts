import { Injectable, ComponentFactoryResolver, ViewContainerRef, ComponentRef, Inject, Optional, ChangeDetectorRef } from '@angular/core';
import { SFSchema } from './schema';
import { SFUISchema, SFUISchemaItem } from './schema/ui';
import { SFNotify, SFNotifyType, SFContext, SFIdSchema } from './interface';

export abstract class Widget {
    schema: SFSchema;
    ui: SFUISchemaItem;
    idSchema: SFIdSchema;
    model: any;
    ctx: SFContext;
    error: string;

    constructor(
        @Optional() @Inject(ChangeDetectorRef) protected cd: ChangeDetectorRef
    ) {}

    _init() {
    }

    _destroy() {
    }

    setValue(value: any): this {
        this.notify(SFNotifyType.SET_VALUE, value);
        return this;
    }

    setError(error: string): this {
        this.error = error;
        return this;
    }

    setRemove(): this {
        this.notify(SFNotifyType.DESTROY);
        return this;
    }

    private notify(type: SFNotifyType, value?: any) {
        const options = {
            type,
            value,
            id: this.idSchema.id,
            path: this.idSchema.path
        };
        this.ctx.store.next(options);
    }
}

export class WidgetRegistry {
    private widgets: { [type: string]: any } = {};

    private defaultWidget: any;

    setDefault(widget: any) {
        this.defaultWidget = widget;
    }

    register(type: string, widget: any) {
        this.widgets[type] = widget;
    }

    has(type: string) {
        return this.widgets.hasOwnProperty(type);
    }

    getType(type: string): any {
        if (this.has(type)) {
            return this.widgets[type];
        }
        return this.defaultWidget;
    }
}

@Injectable()
export class WidgetFactory {
    private resolver: ComponentFactoryResolver;
    private registry: WidgetRegistry;

    constructor(registry: WidgetRegistry, resolver: ComponentFactoryResolver) {
        this.registry = registry;
        this.resolver = resolver;
    }

    createWidget(container: ViewContainerRef, type: string): ComponentRef<Widget> {
        if (!this.registry.has(type)) {
            console.warn(`No widget for type "${type}"`);
        }

        const componentClass = this.registry.getType(type);
        const componentFactory = this.resolver.resolveComponentFactory<Widget>(componentClass);
        return container.createComponent(componentFactory);
    }
}
