import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Widget } from '../../widget';

@Component({
    selector: 'sf-string',
    templateUrl: './string.template.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class StringWidget extends Widget {
    change(value: string) {
        this.setValue(value.length === 0 ? this.ui.emptyValue : value);
    }
}
