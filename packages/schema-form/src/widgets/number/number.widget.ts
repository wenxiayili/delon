import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Widget } from '../../widget';

@Component({
    selector: 'sf-number',
    templateUrl: './number.template.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class NumberWidget extends Widget implements OnInit {
    min: number;
    max: number;
    step: number;
    formatter = (value: any) => value;
    parser = (value: any) => value;
    ngOnInit(): void {
        if (typeof this.schema.minimum !== 'undefined') {
            this.min = this.schema.exclusiveMinimum ? this.schema.minimum + 1 : this.schema.minimum;
        }
        if (typeof this.schema.maximum !== 'undefined') {
            this.max = this.schema.exclusiveMaximum ? this.schema.maximum - 1 : this.schema.maximum;
        }
        this.step = this.schema.multipleOf || 1;
        if (this.ui.formatter) this.formatter = this.ui.formatter;
        if (this.ui.parser) this.parser = this.ui.parser;
    }
}
