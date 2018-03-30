import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { NgZorroAntdModule } from 'ng-zorro-antd';

import { DelonSchemaFormConfig } from './config';
import { WidgetFactory, WidgetRegistry } from './widget';
import { SFComponent } from './sf.component';
import { SFItemComponent } from './sf-item.component';
import { NzWidgetRegistry } from './widgets/nz-widget.registry';

const COMPONENTS = [
    SFComponent,
    SFItemComponent,
];

// region: widgets

import { ObjectWidget } from './widgets/object/object.widget';
import { ArrayWidget } from './widgets/array/array.widget';
import { StringWidget } from './widgets/string/string.widget';
import { NumberWidget } from './widgets/number/number.widget';

const WIDGETS = [
    ObjectWidget,
    ArrayWidget,
    StringWidget,
    NumberWidget
];

// endregion

@NgModule({
    imports:            [ CommonModule, FormsModule, NgZorroAntdModule ],
    declarations:       [ ...COMPONENTS, ...WIDGETS ],
    entryComponents:    WIDGETS,
    exports:            [ ...COMPONENTS ]
})
export class DelonSchemaFormModule {
    static forRoot(): ModuleWithProviders {
        return {
            ngModule: DelonSchemaFormModule,
            providers: [
                DelonSchemaFormConfig,
                WidgetFactory,
                { provide: WidgetRegistry, useClass: NzWidgetRegistry }
            ]
        };
    }
}
