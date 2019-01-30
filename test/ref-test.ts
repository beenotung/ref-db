import {proxyCollections, Record, Ref} from "../src/ref";
import {inspect} from "util";

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

function log(x) {
  console.log(inspect(x, {depth: 99}))
}

log({graph});
log({'post-1': graph.posts['post-1']});
log({'post-1.author.name': graph.posts['post-1'].author.name});
