import { SFSchema } from './schema';

export function isObject(thing: any): boolean {
    return typeof thing === 'object' && thing !== null && !Array.isArray(thing);
}

export function mergeObjects(obj1: Object, obj2: Object, concatArrays = false) {
    return Object.keys(obj2).reduce((acc, key) => {
        const left = obj1[key],
              right = obj2[key];
        if (obj1.hasOwnProperty(key) && isObject(right)) {
            acc[key] = mergeObjects(left, right, concatArrays);
        } else if (concatArrays && Array.isArray(left) && Array.isArray(right)) {
            acc[key] = left.concat(right);
        } else {
            acc[key] = right;
        }
        return acc;
    }, Object.assign({}, obj1));
}
