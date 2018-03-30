import * as Ajv from 'ajv';
import { SFErrorObject, SFErrorTree } from './interface';
import { isObject } from './utils';

const ajv = new Ajv({ errorDataPath: 'property', allErrors: true });

// custom formats
ajv.addFormat(
    'data-url',
    /^data:([a-z]+\/[a-z0-9-+.]+)?;name=(.*);base64,(.*)$/
);
ajv.addFormat(
    'color',
    /^(#?([0-9A-Fa-f]{3}){1,2}\b|aqua|black|blue|fuchsia|gray|green|lime|maroon|navy|olive|orange|purple|red|silver|teal|white|yellow|(rgb\(\s*\b([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\b\s*,\s*\b([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\b\s*,\s*\b([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\b\s*\))|(rgb\(\s*(\d?\d%|100%)+\s*,\s*(\d?\d%|100%)+\s*,\s*(\d?\d%|100%)+\s*\)))$/
);

/**
 * 将 ajv 错误信息转换成树结构错误对象，例如：
 * @example
 * ```
 * [
 *  {property: ".level1.level2[2].level3", message: "err a"},
 *  {property: ".level1.level2[2].level3", message: "err b"},,
 *  {property: ".level1.level2[4].level3", message: "err b"},
 * ]
 * ```
 *
 * ```
 * {
 *  level1: {
 *      level2: {
 *          2: { level3: { errors: [ 'err a', 'err b' ]}},
 *          4: { level3: { errors: [ 'err b' ]}}
 *      }
 *  }
 * }
 * ```
 */
function toErrorSchema(errors: SFErrorObject[]): SFErrorTree {
    if (!errors.length) return {};
    return errors.reduce((errorSchema: SFErrorTree, error) => {
        const { property, message } = error;
        // TODO: use lodash.topath?
        const path = property.split('.');
        let parent = errorSchema;
        // remove the root
        if (path.length > 0 && path[0] === '') {
            path.splice(0, 1);
        }
        for (const segment of path.slice(0)) {
            if (!(segment in parent)) {
                parent[segment] = {};
            }
            parent = parent[segment];
        }
        if (Array.isArray(parent.__errors)) {
            parent.__errors = parent.__errors.concat(message);
        } else {
            parent.__errors = [ message ];
        }
        return errorSchema;
    }, {});
}

function createErrorHandler(data: any): SFErrorTree {
    const handler: SFErrorTree = {
        __errors: [],
        addError(message: string) {
            this.__errors.push(message);
        }
    };
    if (isObject(data)) {
        return Object.keys(data).reduce((acc, key) => {
            return { ...acc, [key]: createErrorHandler(data[key]) };
        }, handler);
    }
    if (Array.isArray(data)) {
        return data.reduce((acc, value, key) => {
            return { ...acc, [key]: createErrorHandler(value) };
        }, handler);
    }
    return handler;
}

function transformAjvErrors(errors: Ajv.ErrorObject[]): SFErrorObject[] {
    if (errors == null) return [];
    return errors.map(e => {
        const { dataPath, keyword, message, params } = e;
        const property = `${dataPath}`;
        return {
          name: keyword,
          property,
          message,
          params,
          stack: `${property} ${message}`.trim(),
        };
    });
}

export function validateFormData(
    schema: object,
    data: any,
    customValidate?: (data: any, errorTree: SFErrorTree) => SFErrorObject[],
    transformErrors?: (errors: SFErrorObject[]) => SFErrorObject[]
) {
    try {
        ajv.validate(schema, data);
    } catch {
    }

    let errors = transformAjvErrors(ajv.errors);

    if (typeof transformErrors === 'function') {
        errors = transformErrors(errors);
    }

    const errorSchema = toErrorSchema(errors);

    if (typeof customValidate !== 'function')
        return { errors, errorSchema };

    // const errorHandler = customValidate(data, createErrorHandler(data));
    return { errors, errorSchema };
}
