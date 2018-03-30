import { Component, OnInit } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd';

@Component({
    selector: 'app-sf-validator',
    templateUrl: './validator.component.html'
})
export class SFValidatorComponent implements OnInit {
    schemaStr: any;
    modelStr: any;

    schema: any;
    data: any;
    result: any = {};
    layout = 'vertical';
    value: any;

    constructor(private msg: NzMessageService) {
        this.schemaStr = require('!!raw-loader!./schema.json');
        this.modelStr = require('!!raw-loader!./data.json');
    }

    ngOnInit(): void {
        this.run();
    }

    private parseJson(value: string) {
        try {
            return JSON.parse(value);
        } catch (ex) {
            this.msg.error(`parse json get error, ${ex}`);
            console.log(ex);
        }
        return null;
    }

    run() {
        const s = this.parseJson(this.schemaStr);
        const m = this.parseJson(this.modelStr);
        if (!s || !m) return ;
        this.schema = s;
        this.data = m;
    }

    onChange(res: any) {
        console.log(res);
        this.result = res;
    }

    onSubmit(res: any) {
        this.msg.success(JSON.stringify(res));
    }
}
