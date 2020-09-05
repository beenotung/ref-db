/**
 * cached instance
 * */
import { proxyStoreCollectionsByPath } from 'ref-db'

let cachedDB = proxyStoreCollectionsByPath({
  path: 'data',
  storeQuota: Number.MAX_SAFE_INTEGER, // optional
  cacheSize: Number.MAX_SAFE_INTEGER, // optional
  whitelistCollectionNames: ['users', 'posts', 'comments'], // optional
})
console.log(cachedDB)

/**
 * not cached instance
 * */
import { proxyStoreCollections } from 'ref-db'
import { LocalStorage } from 'node-localstorage'
import { Store } from '@beenotung/tslib/store'

let localStorage = new LocalStorage('data')
let store = Store.create(localStorage)
let db = proxyStoreCollections({
  store,
  whitelistCollectionNames: ['users', 'posts', 'comments'], // optional
})
console.log(db)
