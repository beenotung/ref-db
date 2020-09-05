import { proxyStoreCollectionsByPath } from '../src/ref-db';
import { inspect } from 'util';

let collectionNames = ['users', 'posts'];
let db = proxyStoreCollectionsByPath({
  path: 'data',
  storeQuota: Number.MAX_SAFE_INTEGER, // optional
  cacheSize: Number.MAX_SAFE_INTEGER, // optional
  whitelistCollectionNames: collectionNames, // optional
});

function test(s: string) {
  process.stdout.write(s);
  process.stdout.write(' ~~> ');
  console.log(inspect(eval(s), { depth: 99 }));
}

global['db'] = db;

// console.log('keys:',db[Symbol.store].getObject('list-users'))
// console.log('keys:',db[Symbol.store].getObject('list-users'))
// console.log('keys:',getStoreCollectionKeys(db,'users'));
// console.log('keys:',getStoreCollectionKeys(db,'users'));

test('db');
test('db.users');
test('Object.keys(db.users)');
test('Object.keys(db.users).forEach(key=>delete db.users[key])');
test('Object.keys(db.users)');
test('db.users["user-1"] = {id:"user-1",name:"Alice"}');
test('Object.keys(db.users)');
test('db.users["user-1"]');

test('db.posts["post-1"] = {id:"post-1",author:{$ref:"users",id:"user-1"}}');
test('db.posts["post-1"]');             // { id: 'post-1', author: { '$ref': 'users', id: 'user-1' } }
test('db.posts["post-1"].author');      // { id: 'user-1', name: 'Alice' }
test('db.posts["post-1"].author.name'); // 'Alice'
