import { SFSchema, SFSchemaDefinition } from './schema/index';
import { SFUISchema, SFUISchemaItem } from './schema/ui';
import { isObject, mergeObjects } from './utils';
import { validateFormData } from './validate';
import { SFIdSchema } from './interface';

const WIDGETMAP = {
    boolean: {
      checkbox: 'checkbox',
      radio: 'radio',
      select: 'select',
      hidden: 'hidden',
    },
    string: {
      text: 'text',
      password: 'text',
      email: 'text',
      hostname: 'text',
      ipv4: 'text',
      ipv6: 'text',
      uri: 'text',
      'data-url': 'file',
      radio: 'radio',
      select: 'select',
      textarea: 'textarea',
      hidden: 'hidden',
      date: 'date',
      datetime: 'datetime',
      'date-time': 'datetime',
      color: 'text',
      file: 'file'
    },
    number: {
      text: 'number',
      select: 'select',
      range: 'slider',
      radio: 'radio',
      hidden: 'hidden'
    },
    integer: {
      text: 'number',
      select: 'select',
      range: 'slider',
      radio: 'radio',
      hidden: 'hidden'
    },
    array: {
      select: 'select',
      checkboxes: 'checkboxes',
      files: 'file'
    }
};

export function getSchemaType(schema: SFSchema) {
    let { type } = schema;
    if (!type && schema.enum) {
        type = 'string';
    }
    return type;
}

/** 获取小部件ID，但并不保证ID是否有效 */
export function getWidgetId(schema: SFSchema, uiSchema: SFUISchemaItem): string {
    if (uiSchema && uiSchema.widget) return uiSchema.widget;

    const type = getSchemaType(schema) || 'string';

    let id = type;
    if (schema.format && WIDGETMAP.hasOwnProperty(type) && WIDGETMAP[type].hasOwnProperty(schema.format)) {
        id = WIDGETMAP[type][schema.format];
    }

    return id;
}

/** 根据 `$ref` 查找 `definitions` */
function findSchemaDefinition($ref: string, definitions: SFSchemaDefinition = {}) {
    const match = /^#\/definitions\/(.*)$/.exec($ref);
    if (match && match[1]) {
        // parser JSON Pointer
        const parts = match[1].split('/');
        let current: any = definitions;
        for (let part of parts) {
            part = part.replace(/~1/g, '/').replace(/~0/g, '~');
            if (current.hasOwnProperty(part)) {
                current = current[part];
            } else {
                throw new Error(`Could not find a definition for ${$ref}.`);
            }
        }
        return current;
    }
    throw new Error(`Could not find a definition for ${$ref}.`);
}

function resolveDependencies(schema: SFSchema, definitions: SFSchemaDefinition = {}, formData = {}) {
    // remove dependencies property
    // tslint:disable-next-line:prefer-const
    let { dependencies = {}, ...resolvedSchema } = schema;
    for (const key in dependencies) {
        if (formData[key] === undefined) continue;
        const value = dependencies[key];
        if (Array.isArray(value)) {
            resolvedSchema = withDependentProperties(resolvedSchema, value);
        } else if (isObject(value)) {
            resolvedSchema = withDependentSchema(
                resolvedSchema,
                definitions,
                formData,
                key,
                value
            );
        }
    }
    return resolvedSchema;
}

function withDependentProperties(schema: SFSchema, additionallyRequired: string[]) {
    const required = Array.isArray(schema.required)
        ? Array.from(new Set([...schema.required, ...additionallyRequired]))
        : additionallyRequired;
    return { ...schema, required };
}

function withDependentSchema(
    schema: SFSchema,
    definitions: SFSchemaDefinition = {},
    formData = {},
    dependencyKey: string,
    dependencyValue: SFSchema
) {
    const { oneOf, ...dependentSchema } = retrieveSchema(dependencyValue, definitions, formData);
    schema = mergeSchemas(schema, dependentSchema);
    return oneOf === undefined
        ? schema
        : withExactlyOneSubschema(schema, definitions, formData, dependencyKey, oneOf);
}

function withExactlyOneSubschema(
    schema: SFSchema,
    definitions: SFSchemaDefinition = {},
    formData = {},
    dependencyKey: string,
    oneOf: SFSchema[]
) {
    if (!Array.isArray(oneOf)) {
        throw new Error(`invalid oneOf: it's some ${typeof oneOf} instead of an array`);
    }
    const validSubSchemas = oneOf.filter(item => {
        if (!item.properties) return false;
        const { [dependencyKey]: condition } = item.properties;
        if (!condition) return false;
        const conditionSchema: SFSchema = {
            type: 'object',
            properties: {
                [dependencyKey]: condition
            }
        };
        const { errors } = validateFormData(conditionSchema, formData);
        return errors.length === 0;
    });
    if (validSubSchemas.length !== 1) {
        console.warn(`ignoring oneOf in dependencies because there isn't exactly one subschema that is valid`);
        return schema;
    }
    const subSchema = validSubSchemas[0];
    const {
        [dependencyKey]: conditionPropertySchema,
        ...dependentSubschema
    } = subSchema.properties;
    const dependentSchema = { ...subSchema, properties: dependentSubschema };
    return mergeSchemas(
        schema,
        retrieveSchema(dependentSchema, definitions, formData)
    );
}

function mergeSchemas(schema1, schema2) {
    return mergeObjects(schema1, schema2, true);
}

/**
 * 计算默认值
 * - 递归最深默认值具有最高优先级
 */
function computeDefaults(schema: SFSchema, parentDefaults: any, definitions: SFSchemaDefinition = {}) {
    let defaults = parentDefaults;
    if (isObject(defaults) && isObject(schema.default)) {
        defaults = mergeObjects(defaults, schema.default);
    } else if ('default' in schema) {
        defaults = schema.default;
    } else if ('$ref' in schema) {
        const refSchema = findSchemaDefinition(schema.$ref, definitions);
        return computeDefaults(refSchema, defaults, definitions);
    } else if (isFixedItems(schema)) {
        defaults = (schema.items as SFSchema[]).map(item => computeDefaults(item, undefined, definitions));
    }
    // 修正无效默认值时直接采用 Schema 值
    if (typeof defaults === 'undefined') {
        defaults = schema.default;
    }

    switch (schema.type) {
        case 'object':
            return Object.keys(schema.properties || {}).reduce((acc, key) => {
                acc[key] = computeDefaults(
                    schema.properties[key],
                    (defaults || {})[key],
                    definitions
                );
                return acc;
            }, {});
        case 'array':
            if (schema.minItems) {
                if (!isMultiSelect(schema, definitions)) {
                    const defaultsLength = defaults ? defaults.length : 0;
                    if (schema.minItems > defaultsLength) {
                        const defaultEntries = defaults || [];
                        // populate the array with the defaults
                        const fillerEntries = new Array(
                            schema.minItems - defaultsLength
                        ).fill(
                            computeDefaults(schema.items as SFSchema, (schema.items as any).defaults, definitions)
                        );
                        // then fill up the rest with either the item default or empty, up to minItems
                        return defaultEntries.concat(fillerEntries);
                    }
                }
            } else {
                return [];
            }
    }
    return defaults;
}

/**
 * 取回Schema，并处理 `$ref`、`dependencies` 的关系
 */
export function retrieveSchema(schema: SFSchema, definitions: SFSchemaDefinition = {}, formData = {}): SFSchema {
    if (schema.hasOwnProperty('$ref')) {
        const $refSchema = findSchemaDefinition(schema.$ref, definitions);
        // remove $ref property
        const { $ref, ...localSchema } = schema;
        return retrieveSchema(
            { ...$refSchema, ...localSchema },
            definitions,
            formData
        );
    } else if (schema.hasOwnProperty('dependencies')) {
        const resolvedSchema = resolveDependencies(schema, definitions, formData);
        return retrieveSchema(resolvedSchema, definitions, formData);
    }

    return schema;
}

/** 获取表单默认值 */
export function getDefaultFormState(_schema: SFSchema, formData: {}, definitions: SFSchemaDefinition = {}) {
    if (!isObject(_schema)) throw new Error(`invalid schema: ${JSON.stringify(_schema)}`);
    const schema = retrieveSchema(_schema, definitions, formData);
    const defaults = computeDefaults(schema, _schema.default, definitions);
    if (typeof formData === 'undefined') return defaults;
    if (isObject(formData)) return mergeObjects(defaults, formData);
    return formData || defaults;
}

export function toId(schema: SFSchema, id: string, path: string[], definitions = {}, formData = {}, idPrefix = 'root') {
    const idSchema: SFIdSchema = {
        id: id || idPrefix,
        path: path || [],
        type: 'object'
    };
    if ('$ref' in schema) {
        const _schema = retrieveSchema(schema, definitions, formData);
        return toId(_schema, id, path, definitions, formData, idPrefix);
    }
    if ('items' in schema && !(schema.items as SFSchema).$ref) {
        return toId(schema.items as SFSchema, id, path, definitions, formData, idPrefix);
    }
    if (schema.type !== 'object') {
        return idSchema;
    }
    // tslint:disable-next-line:forin
    for (const name in schema.properties || {}) {
        const field = schema.properties[name];
        const fieldId = idSchema.id + '_' + name;
        const paths = idSchema.path.concat(name);
        idSchema[name] = toId(
            field,
            fieldId,
            paths,
            definitions,
            formData[name],
            idPrefix
        );
    }
    return idSchema;
}

export function isFixedItems(schema: SFSchema) {
    return Array.isArray(schema.items) && schema.items.length > 0 && schema.items.every(item => isObject(item));
}

export function allowAdditionalItems(schema: SFSchema) {
    return isObject(schema.additionalItems);
}

export function isSelect(_schema: SFSchema, definitions: SFSchemaDefinition = {}) {
    const schema = retrieveSchema(_schema, definitions);
    const altSchemas = schema.oneOf || schema.anyOf;
    if (Array.isArray(schema.enum)) {
        return true;
    } else if (Array.isArray(altSchemas)) {
        return altSchemas.every(item => isConstant(item));
    }
}

export function isMultiSelect(schema: SFSchema, definitions: SFSchemaDefinition = {}) {
    if (!schema.uniqueItems || !schema.items) return false;
    return isSelect(schema.items as SFSchema, definitions);
}

export function isConstant(schema) {
    return (
        (Array.isArray(schema.enum) && schema.enum.length === 1) ||
        schema.hasOwnProperty('const')
    );
}

export function orderProperties(properties: string[], order: string[]) {
    if (!Array.isArray(order)) return properties;
    const arrayToHash = arr => arr.reduce((prev, curr) => {
        prev[curr] = true;
        return prev;
    }, {});
    const errorPropList = arr =>
      arr.length > 1
        ? `properties '${arr.join('\', \'')}'`
        : `property '${arr[0]}'`;

    const propertyHash = arrayToHash(properties);
    const orderHash = arrayToHash(order);
    const extraneous = order.filter(prop => prop !== '*' && !propertyHash[prop]);
    if (extraneous.length) {
      throw new Error(
        `ui schema order list contains extraneous ${errorPropList(extraneous)}`
      );
    }
    const rest = properties.filter(prop => !orderHash[prop]);
    const restIndex = order.indexOf('*');
    if (restIndex === -1) {
      if (rest.length) {
        throw new Error(
          `ui schema order list does not contain ${errorPropList(rest)}`
        );
      }
      return order;
    }
    if (restIndex !== order.lastIndexOf('*')) {
      throw new Error('ui schema order list contains more than one wildcard item');
    }
    const complete = [...order];
    complete.splice(restIndex, 1, ...rest);
    return complete;
}

export function getUiOptions(uiSchema: SFUISchema) {
    if (!uiSchema) return {};
    return Object.keys(uiSchema)
                 .filter(key => !key.startsWith('key:'))
                 .reduce((options, key) => {
                    return { ...options, [ key ]: uiSchema[key] };
                 }, <SFUISchemaItem>{});
}
