export function deepMerge<T extends Record<string, any> = any>(...objs: T[]): T {
  const result = Object.assign({}, ...objs);

  for (const obj of objs) {
    for (const [key, val] of Object.entries(obj)) {
      if (isObject(val)) {
        result[key] = deepMerge(result[key], val);
      }
      else {
        result[key] = val;
      }
    }
  }

  return result;
}

function isObject(item: any) {
  return item && typeof item === 'object' && !Array.isArray(item);
}
