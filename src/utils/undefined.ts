function skipSymbol(p: PropertyKey) {
  if (typeof p !== 'symbol') {
    return false
  }
  switch (p) {
    case Symbol.iterator:
      return false;
    case Symbol.for('nodejs.util.inspect.custom'):
    case Symbol.toStringTag:
      return true;
    default:
      console.log('Symbol:', p);
      return true;
  }
}

/**
 * cannot proxy with Date?
 * */
export function proxyUndefined(target: object) {
  // console.log('wrap:',target);
  if (target === null || target === undefined || typeof target === 'undefined') {
    return undefined;
  }
  if (typeof target !== 'object' && typeof target !== 'function') {
    console.warn('Cannot create proxy with non-object: ' + typeof target);
    return target
  }
  // let realTarget = target;
  return new Proxy(target, {
    get(target: object, p: PropertyKey, receiver: any): any {
      // console.log('get',{realTarget,target,p});
      return skipSymbol(p) || Reflect.has(target, p) || (p === 'inspect')
        ? Reflect.get(target, p, receiver)
        : undefined
    },
    set: (target, p, value, receiver) => {
      return receiver === undefined
        ? value
        : Reflect.set(target, p, value, receiver)
    },
    apply(target: object, thisArg: any, argArray?: any): any {
      return typeof target === "function"
        ? Reflect.apply(target as any, thisArg, argArray)
        : undefined
    },
    // getPrototypeOf(target: Object): object | null {
    //   console.log('getPrototypeOf', {realTarget,target});
    //   return Reflect.getPrototypeOf(target);
    // },
    // getOwnPropertyDescriptor(target: Object, p: PropertyKey): PropertyDescriptor | undefined {
    //   console.log('getOwnPropertyDescriptor',{realTarget,target,p});
    //   return Reflect.getOwnPropertyDescriptor(target, p)
    // }
  })
}

export let undefined = proxyUndefined(function undefined() {
  return Undefined;
});
export let Undefined = undefined;

