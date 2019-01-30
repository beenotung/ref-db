import {proxyStoreCollections} from "../src/ref-db";

let collectionNames = ['users', 'posts'];
let db = proxyStoreCollections('data', Number.MAX_SAFE_INTEGER, collectionNames);

function test(s: string) {
  process.stdout.write(s);
  process.stdout.write(' ~~> ');
  console.log(eval(s));
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
test('db.posts["post-1"].author');
test('db.posts["post-1"].author.name');
test('db.posts["post-1"].author.name === "Alice"');
