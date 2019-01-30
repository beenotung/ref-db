import {proxyStoreCollections} from "../src/ref-db";
import {inspect} from "util";

let collectionNames = ['users', 'posts'];
let db = proxyStoreCollections('data', Number.MAX_SAFE_INTEGER, collectionNames);

function test(s: string) {
  process.stdout.write(s);
  process.stdout.write(' ~~> ');
  console.log(inspect(eval(s)), {depth: 99});
}

global['db'] = db;

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
