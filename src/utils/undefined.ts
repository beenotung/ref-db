/**
 * cannot proxy with Date?
 * */
import {skipSymbol} from "./proxy";

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

export function isUndefined(o) {
  return typeof o === 'undefined' || o === undefined
}
