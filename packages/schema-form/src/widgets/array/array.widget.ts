import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Widget } from '../../widget';
import { isFixedItems, allowAdditionalItems, getDefaultFormState, retrieveSchema, getUiOptions, toId } from '../../renderer';
import { SFSchema } from '../../schema';
import { SFUISchema } from '../../schema/ui';
import { SFIdSchema, SFNotifyType } from '../../interface';
import { isThisSecond } from 'date-fns';

@Component({
    selector: 'sf-array',
    templateUrl: './array.template.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ArrayWidget extends Widget implements OnInit {
    list: any[] = [];
    hasAdd: boolean;
    addTitle: string;
    removeTitle: string;

    private canAdd(items: any[]) {
        const { addable } = getUiOptions(this.ui);
        if (addable === false) return addable;
        return this.schema.maxItems != null ? items.length < this.schema.maxItems : true;
    }

    private renderItem(options: {
        index?: number,
        canMoveUp?: boolean,
        canMoveDown?: boolean,
        canRemove?: boolean,
        itemSchema?: SFSchema,
        itemIdSchema?: SFIdSchema,
        itemUiSchema?: SFUISchema,
        item?: {}
    }) {
        const { orderable, removable } = {
            orderable: true,
            removable: true,
            ...options.itemUiSchema
        } as any;
        const has: any = {
            moveUp: orderable && options.canMoveUp,
            moveDown: orderable && options.canMoveDown,
            remove: removable && options.canRemove
        };
        has.toolbar = Object.keys(has).some(key => has[key]);
        return {
            hasToolbar: has.toolbar,
            hasMoveUp: has.moveUp,
            hasMoveDown: has.moveDown,
            hasRemove: has.remove,
            index: options.index,
            key: `${this.idSchema.id}-${options.index}`,
            schema: options.itemSchema,
            model: options.item,
            idSchema: options.itemIdSchema
        };
    }

    private renderFixedArray() {
        let items = this.model as any[];
        if (items.length === 0) {
            this.list = [];
            return ;
        }
        const { definitions } = this.ctx;
        const schema = this.schema;
        const ui = this.ui;
        const itemSchemas = (schema.items as SFSchema[]).map((item, index) => retrieveSchema(item, definitions, items[index]));
        const additionalSchema = allowAdditionalItems(schema) ? retrieveSchema(schema.additionalItems, definitions, items) : null;
        if (!items || items.length < itemSchemas.length) {
            items = items || [];
            items = items.concat(new Array(itemSchemas.length - items.length));
        }
        this.hasAdd = this.canAdd(items);
        this.list = items.map((item, index) => {
            const additional = index >= itemSchemas.length;
            const itemSchema = additional
                ? retrieveSchema(schema.additionalItems, definitions, item)
                : itemSchemas[index];
            const itemIdPrefix = this.idSchema.id + '_' + index;
            const itemIdSchema = toId(
                itemSchema,
                itemIdPrefix,
                this.idSchema.path.concat(index.toString()),
                definitions,
                item
            );
            const itemUiSchema = additional
                ? ui.additionalItems || {}
                : Array.isArray(ui.items)
                    ? ui.items[index]
                    : ui.items || {};

            return this.renderItem({
                index,
                canMoveUp: index > 0,
                canMoveDown: index < items.length - 1,
                canRemove: true,
                itemSchema,
                itemIdSchema,
                itemUiSchema,
                item
            });
        });
    }

    private renderNormalArray() {
        const items = this.model as any[];
        if (items.length === 0) {
            this.list = [];
            return ;
        }
        const { definitions } = this.ctx;
        const schemaItems = this.schema.items as SFSchema;
        const ui = this.ui;
        this.hasAdd = this.canAdd(items);
        this.list = items.map((item, index) => {
            const itemSchema = retrieveSchema(schemaItems, definitions, item);
            const itemIdSchema = toId(
                itemSchema,
                this.idSchema.id + '_' + index,
                this.idSchema.path.concat(index.toString()),
                definitions,
                item
            );
            return this.renderItem({
                index,
                canMoveUp: index > 0,
                canMoveDown: index < items.length - 1,
                canRemove: true,
                itemSchema: itemSchema,
                itemIdSchema,
                itemUiSchema: this.ui.items,
                item
            });
        });
    }

    add(e: Event) {
        e.preventDefault();
        e.stopPropagation();
        let itemSchema = this.schema.items;
        if (isFixedItems(this.schema) && allowAdditionalItems(this.schema)) {
            itemSchema = this.schema.additionalItems;
        }
        const { definitions } = this.ctx;
        (this.model as any[]).push(
            getDefaultFormState(itemSchema as SFSchema, undefined, definitions)
        );
        this.render();
        this.setValue(this.model);
    }

    remove(idx: number, e: Event) {
        e.preventDefault();
        e.stopPropagation();
        (this.model as any[]).splice(idx, 1);
        this.render();
        this.setValue(this.model);
    }

    render() {
        if (isFixedItems(this.schema)) {
            return this.renderFixedArray();
        }
        return this.renderNormalArray();
    }

    ngOnInit(): void {
        if (!this.schema.hasOwnProperty('items')) {
            console.warn(`Missing items definition`, this.schema);
            return;
        }

        this.addTitle = this.ui.addTitle || '添加';
        this.removeTitle = this.ui.removeTitle || '移除';

        this.render();
    }
}
