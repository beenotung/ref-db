import { skipSymbol } from '../src/utils/proxy';

let xs = new Proxy([], {
  get(target: any[], p: PropertyKey, receiver: any): any {
    if (skipSymbol(p)) {
      return Reflect.get(target, p, receiver);
    }
    switch (p) {
      case Symbol.iterator:
      case 'length':
        return Reflect.get(target, p, receiver);
    }
    console.log('get', { target, p, 'typeof p': typeof p });
    return Reflect.get(target, p, receiver);
  },
  set(target: any[], p: PropertyKey, value: any, receiver: any): boolean {
    console.log('set', { target, p, value });
    return Reflect.set(target, p, value, receiver);
  },
  apply(target: any[], thisArg: any, argArray?: any): any {
    console.log('apply', { target, thisArg, argArray });
    return Reflect.apply(target as any, thisArg, argArray);
  },
});
global['xs'] = xs;

function test(s) {
  process.stdout.write(s);
  process.stdout.write(' ~~> ');
  console.log(eval(s));
}

console.log('test begin');

test('xs');
test('xs.length');
test('xs[0]');
test('xs[0] = 1');
test('xs[0]');
test('xs.push(3)');
test('xs.length');

console.log('test end');
