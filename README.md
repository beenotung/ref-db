# ref-db
[![npm Package Version](https://img.shields.io/npm/v/ref-db.svg?maxAge=2592000)](https://www.npmjs.com/package/ref-db)

access object with
transparent reference to synchronous db operation (not async operation)

## Supported Platforms

ref-db is built on top of cross-platform Storage, hence it works on:
- Browser (using [window.localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage))
- Node.js (using [node-localstorage](https://www.npmjs.com/package/node-localstorage))

## How it works?
The loaded data object is proxied, it saves and loads data from the storage automatically. You can just use it as if they're all in-memory.

## Usage

### Create Proxy Store (database)

With in-memory caching:
```typescript
import { proxyStoreCollectionsByPath } from 'ref-db'

let cachedDB = proxyStoreCollectionsByPath({
  path: 'data',
  storeQuota: Number.MAX_SAFE_INTEGER, // optional
  cacheSize: Number.MAX_SAFE_INTEGER, // optional
  whitelistCollectionNames: ['users', 'posts', 'comments'], // optional
})
```

Without caching (still benefit from OS-level file caching):
```typescript
import { proxyStoreCollections } from 'ref-db'
import { LocalStorage } from 'node-localstorage'
import { Store } from '@beenotung/tslib/store'

let localStorage = new LocalStorage('data')
let store = Store.create(localStorage)
let db = proxyStoreCollections({
  store,
  whitelistCollectionNames: ['users', 'posts', 'comments'], // optional
})
```

Whitelisted collections are auto proxied from the database object:
``` javascript
> console.log(db)
{
  users: '[object Proxy]',
  posts: '[object Proxy]',
  comments: '[object Proxy]',
  [Symbol(store)]: CachedObjectStore {
    ...
  }
}
```

Each collection can be used as if they are ordinary javascript object. The data will be loaded from storage lazily.

``` javascript
> db.users
{}

> Object.keys(db.users)
[ 'user-1' ]

> Object.keys(db.users).forEach(key => delete db.users[key])
undefined

> Object.keys(db.users)
[]

> db.users["user-1"] = { id: "user-1", name: "Alice" }
{ id: 'user-1', name: 'Alice' }

> Object.keys(db.users)
[ 'user-1' ]

> db.users["user-1"]
{ id: 'user-1', name: 'Alice' }

> db.posts["post-1"] = { id: "post-1", author: { $ref: "users", id: "user-1" } }
{ id: 'post-1', author: { '$ref': 'users', > id: 'user-1' } }

> db.posts["post-1"]
{ id: 'post-1', author: { '$ref': 'users', id: 'user-1' } }

> db.posts["post-1"].author
{ id: 'user-1', name: 'Alice' }

> db.posts["post-1"].author.name
'Alice'
```
