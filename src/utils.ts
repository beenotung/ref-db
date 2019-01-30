export type fieldMapper<T extends object> = (value: T[keyof T], field: keyof T) => T[keyof T];

export function objectInplaceMap<T extends object>(object: T, f: fieldMapper<T>) {
  for (let key of Object.keys(object)) {
    object[key] = f(object[key], key as any)
  }
  return object;
}

export function objectProxyMap<T extends object>(object: T, f: fieldMapper<T>) {
  return new Proxy(object, {
    get(target: T, p: PropertyKey, receiver: any): any {
      let value = Reflect.get(target, p, receiver);
      return f(value, p as any)
    }
  })
}

