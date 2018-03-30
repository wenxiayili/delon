import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SharedModule } from '../../shared/shared.module';
import { DelonSchemaFormModule } from '@delon/schema-form';

import { SFValidatorComponent } from './validator/validator.component';

// region: components
const COMPONENTS = [
    SFValidatorComponent
];

const routes: Routes = [
    { path: 'validator', component: SFValidatorComponent, data: { title: '校验器' } }
];
// endregion

@NgModule({
    imports: [
        SharedModule,
        DelonSchemaFormModule.forRoot(),
        RouterModule.forChild(routes)
    ],
    declarations: COMPONENTS
})
export class SFModule {

}
