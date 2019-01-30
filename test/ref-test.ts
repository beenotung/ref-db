import {proxyCollections, Record, Ref} from "../src/ref";
import {inspect, format} from "util";
import {format_datetime} from "@beenotung/tslib";

interface User extends Record {
  name: string
}

interface Post extends Record {
  message: string
  author: Ref
}

let users = [
  {id: 'user-1', name: 'Alice'},
  {id: 'user-2', name: 'Bob'},
];
let posts = [
  {id: 'post-1', message: 'I am Alice', author: {$ref: 'users', id: 'user-1'}},
  {id: 'post-2', message: 'I am Bob', author: {$ref: 'users', id: 'user-2'}},
];
let collections = {users, posts};
let graph = proxyCollections<User | Post>(collections);

function test(s) {
  process.stdout.write(s);
  process.stdout.write(' ~~> ');
  console.log(inspect(eval(s), {depth: 99}));
}

global['graph'] = graph;

test('graph');
test('graph.posts["post-1"]');              // { id: 'user-1', author: { '$ref': 'users', id: 'user-1' } }
test('graph.posts["post-1"].author');       // { id: 'user-1', name: 'Alice' }
test('graph.posts["post-1"].author.name');  // 'Alice'

test('graph.users.length');
test('graph.users.push({id:"user-3",name:"Carol"})');
test('graph.users.length');
