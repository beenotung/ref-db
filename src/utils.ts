import {skipSymbol} from "./utils/proxy";

export type fieldMapper<T extends object> = (value: T[keyof T], field: keyof T) => T[keyof T];

export function objectInplaceMap<T extends object>(object: T, f: fieldMapper<T>): T {
  for (let key of Object.keys(object)) {
    object[key] = f(object[key], key as any)
  }
  return object;
}

export function objectCreateMap<T extends object>(object: T, f: fieldMapper<T>): T {
  let res = {} as T;
  Object.keys(object).forEach(key => {
    res[key] = f(object[key], key as any)
  });
  return res;
}

export function objectProxyMap<T extends object>(object: T, f: fieldMapper<T>): T {
  return new Proxy(object, {
    get(target: T, p: PropertyKey, receiver: any): any {
      if (typeof p === "symbol" || skipSymbol(p)) {
        return Reflect.get(target, p, receiver)
      }
      // console.log('objectProxyMap.get', {target, p});
      let value = Reflect.get(target, p, receiver);
      return f(value, p as any)
    }
  })
}

