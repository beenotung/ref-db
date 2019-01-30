var handler: ProxyHandler<any> = {
  ownKeys(target: any): PropertyKey[] {
    let keys = Reflect.ownKeys(target);
    if (keys.length === 0) {
      keys = ['b'];
    }
    // console.log('ownKeys', {target, keys});
    return keys;
  },
  getOwnPropertyDescriptor(
    target: any,
    p: PropertyKey,
  ): PropertyDescriptor | undefined {
    let res = Reflect.getOwnPropertyDescriptor(target, p);
    if (res === undefined && p === 'b') {
      res = {
        value: { id: 'b', name: 'Bob' },
        writable: true,
        enumerable: true,
        configurable: true,
      };
    }
    // console.log('getOwnPropertyDescriptor', {target, p, res});
    return res;
  },
  get(target: any, p: PropertyKey, receiver: any): any {
    let value = Reflect.get(target, p, receiver);
    if (value === undefined && p === 'b') {
      value = { id: 'b', name: 'Bob' };
    }
    // console.log('get', {target, p, value});
    return value;
  },
};

console.log('1'.repeat(32));
let aProxy = new Proxy({ a: { id: 'a', name: 'Alice' } }, handler);
console.log(Object.keys(aProxy));
console.log(Object.keys(aProxy).map(key => aProxy[key]));

console.log('2'.repeat(32));
let bProxy = new Proxy({}, handler);
console.log(Object.keys(bProxy));
console.log(Object.keys(bProxy).map(key => bProxy[key]));
