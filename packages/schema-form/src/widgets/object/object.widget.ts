import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Widget } from '../../widget';
import { SFSchema } from '../../schema/index';
import { SFGrid, SFUISchema } from '../../schema/ui';
import { orderProperties } from '../../renderer';

@Component({
    selector: 'sf-object',
    templateUrl: './object.template.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ObjectWidget extends Widget implements OnInit {
    grid: SFGrid;
    list: { schema: SFSchema, ui: SFUISchema, model: {} }[] = [];

    ngOnInit(): void {
        let orderedProperties: string[];
        const ui = this.ui || {};
        try {
            orderedProperties = orderProperties(Object.keys(this.schema.properties), ui.order);
        } catch (e) {
            console.error(`Invalid ${this.schema.title || 'root'} object field configuration:`, e);
        }

        this.list = orderedProperties.map(key => {
            const schema = this.schema.properties[key];
            return {
                schema,
                ui: ui[key],
                model: this.model[key],
                idSchema: this.idSchema[key],
                visible: true,
                key
            };
        });

        this.grid = this.ui.grid;
    }
}
