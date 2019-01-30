let apple = 'apple'.split('');
let appleKeys = [];
appleKeys.push(...apple.map((x, i) => i.toString()), 'length');

var handler: ProxyHandler<any> = {
  ownKeys(target: any): PropertyKey[] {
    // console.log('ownKeys', {target});
    let keys = Array.isArray(target) ? Reflect.ownKeys(target) : appleKeys;
    if (!Array.isArray(target)) {
      Reflect.defineProperty(target, 'length', {
        value: apple.length,
        writable: true,
        enumerable: false,
        configurable: true,
      });
    }
    // console.log({keys});
    return keys;
  },
  getOwnPropertyDescriptor(
    target: any,
    p: PropertyKey,
  ): PropertyDescriptor | undefined {
    let res = Array.isArray(target)
      ? Reflect.getOwnPropertyDescriptor(target, p)
      : Reflect.getOwnPropertyDescriptor(apple, p);
    if (!Array.isArray(target) && p === 'length') {
      res.configurable = true;
    }
    console.log('getOwnPropertyDescriptor', { target, p, res });
    // console.log({res});
    return res;
  },
  get(target: any, p: PropertyKey, receiver: any): any {
    console.log('get', { target, p });
    return Reflect.get(target, p);
  },
};

console.log('1'.repeat(32));
console.log(Object.keys(new Proxy(['a', 'b', 'c'], handler)));

console.log('2'.repeat(32));
console.log(Object.keys(new Proxy({}, handler)));
