import { WidgetRegistry } from '../widget';

import { ObjectWidget } from './object/object.widget';
import { ArrayWidget } from './array/array.widget';
import { StringWidget } from './string/string.widget';
import { NumberWidget } from './number/number.widget';

export class NzWidgetRegistry extends WidgetRegistry {
    constructor() {
        super();

        this.register('object', ObjectWidget);
        this.register('array', ArrayWidget);

        this.register('string', StringWidget);
        this.register('number', NumberWidget);
        this.register('integer', NumberWidget);

        this.setDefault(StringWidget);
    }
}
