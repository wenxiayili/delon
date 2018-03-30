import { Subject } from 'rxjs/Subject';
import { ErrorParameters } from 'ajv';
import { SFSchemaDefinition } from './schema';
import { SFUISchemaItem } from './schema/ui';

export interface SFErrorObject {
    name: string;
    property: string;
    // Excluded if messages set to false.
    message?: string;
    params: ErrorParameters;
    stack: string;
}

export interface SFErrorTree {
    [key: string]: any;
    __errors?: string[];
    addError?: (message: string) => void;
}

export enum SFNotifyType {
    INIT,
    VALID,
    SET_VALUE,
    SET_ERROR,
    DESTROY
}

export interface SFNotify {
    /** current value, maybe is error information when type equar SET_ERROR */
    value?: any;
    /** value to paths */
    path?: string[];
    /** element id */
    id?: string;
    /** action type */
    type: SFNotifyType;
}

export interface SFContext {
    definitions: SFSchemaDefinition;
    store: Subject<SFNotify>;
    commonUI: SFUISchemaItem;
}

export interface SFIdSchema {
    id: string;
    path: string[];
    type: 'array' | 'object';
}
