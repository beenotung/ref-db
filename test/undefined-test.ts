import {proxyUndefined, undefined} from '../src/utils/undefined'

console.log('test begin');

function test(s: string) {
  if (process && process.stdout && process.stdout.write) {
    process.stdout.write(s + ' ~~> ');
  } else {
    console.log(s, ' ~~> ')
  }
  try {
    console.log(eval(s));
  } catch (e) {
    console.log('ERROR');
    console.log('failed to run:', s);
    console.error(e);
    process.exit(1);
  }
}

global['o'] = undefined;
test('o');                // undefined
test('o.name');           // undefined
test('o.asd');            // undefined
test('o()');              // undefined
test('o.asd()');          // undefined
test('o.asd().e()');      // undefined
test('Object.keys(o)');   // []
test('o.a.b.c');          // undefined
test('o.a.b.c = "d"');    // 'd'
test('o.a.b.c');          // undefined
test('o.a.b.c()');        // undefined
test('new o.a.b()');      // undefined
test('new o.a.b() .c()'); // undefined
test('for (let i of o.no){}');  // no error
test('for (let i in o.no){}');  // no error

global['o'] = proxyUndefined({name: 'Alice'});
test('o');            // { name: 'Alice' }
test('o.name');       // 'Alice'
test('o.firstname');  // undefined

console.log('test end');
