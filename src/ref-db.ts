/// <reference types="./global" />

import {Record, Ref} from "./ref";
import {proxy, skipSymbol} from "./utils/proxy";
import {getLocalStorage} from "@beenotung/tslib/store";
import {remove, unique} from "@beenotung/tslib/array";

Symbol.store = Symbol.for('store');

export type StoreCollection<T extends Record> = { [id: string]: T }
export type StoreCollections<T extends Record> = { [name: string]: StoreCollection<T> }
  & { [Symbol.store]: Storage };

export namespace id {
  export function list(collectionName: string) {
    return [
      'list',
      collectionName,
    ].join('-')
  }

  export function record(collectionName: string, id: string) {
    switch (id) {
      case 'length':
      case 'push':
        throw new Error(`conflicting id of '${id}'`);
      default:
        return [
          collectionName,
          id,
        ].join('-');
    }
  }
}

export function getFromStoreCollectionsByRef<T extends Record>(collections: StoreCollections<T>, ref: Ref): T {
  let collection = collections[ref.$ref];
  return collection[ref.id];
}

export function proxyStoreRecord<T extends Record>(collections: StoreCollections<T>, record: T) {
  // console.log('proxyStoreRecord', {record});
  return proxy(record, {
    get(target: T, p: PropertyKey, receiver: any): any {
      let value = Reflect.get(target, p, receiver);
      if (p === Symbol.iterator || skipSymbol(p)) {
        return value;
      }
      if (value === undefined) {
        console.warn('get undefined field', {target, p});
        return value
      }
      if (value !== null && typeof value === "object" && '$ref' in value && 'id' in value && Object.keys(value).length === 2) {
        return proxyStoreRecord(collections, getFromStoreCollectionsByRef(collections, value));
      }
      return proxyStoreRecord(collections, value)
    }
  })
}


export function getStoreCollectionKeys(store: Storage, collectionName: string): string[] {
  let text = store.getItem(id.list(collectionName));
  if (!text) {
    return []
  }
  let keys = JSON.parse(text);
  if (Array.isArray(keys)) {
    // FIXME avoid duplicated key
    return unique(keys);
    // return keys
  }
  console.error(`invalid keys for collection '${collectionName}':`, text);
  throw new Error(`invalid keys for collection '${collectionName}'`)
}

export function setStoreCollectionKeys(store: Storage, collectionName: string, keys: string[]): string[] {
  // FIXME avoid duplicated key
  keys = unique(keys);
  store.setItem(id.list(collectionName), JSON.stringify(keys));
  return keys;
}

export function getStoreRecord<T extends Record>(collections: StoreCollections<T>, collectionName: string, recordId: string): T {
  let text = collections[Symbol.store].getItem(id.record(collectionName, recordId));
  if (!text) {
    return undefined
  }
  return JSON.parse(text);
}

export function proxyCollectionStoreKeys(store: Storage, collectionName: string): string[] {
  return new Proxy([], {
    get(target: any[], p: PropertyKey, receiver: any): any {
      let keys = getStoreCollectionKeys(store, collectionName);
      switch (p) {
        case 'push':
          return (...ids: string[]) => {
            let result = keys.push(...ids);
            store.setItem(id.list(collectionName), JSON.stringify(keys));
            return result;
          }
      }
      return Reflect.get(keys, p, receiver)
    },
    set(target: any[], p: PropertyKey, value: any, receiver: any): boolean {
      let keys = getStoreCollectionKeys(store, collectionName);
      let result = Reflect.set(keys, p, value, receiver);
      setStoreCollectionKeys(store, collectionName, keys);
      return result;
    }
  })
}

export function proxyStoreCollection<T extends Record>(collections: StoreCollections<T>, collectionName: string) {
  let collection = {} as StoreCollection<T>;
  collection = new Proxy(collection, {
    ownKeys(target: StoreCollection<T>): PropertyKey[] {
      let keys = getStoreCollectionKeys(collections[Symbol.store], collectionName);
      // console.log('proxyStoreCollection.ownKeys', {target, keys});
      return keys;
      // return Reflect.ownKeys(keys);
    },
    getOwnPropertyDescriptor(target: StoreCollection<T>, p: PropertyKey): PropertyDescriptor | undefined {
      if (p === 'constructor' || typeof p !== 'string') {
        return Reflect.getOwnPropertyDescriptor(target, p)
      }
      let keys = getStoreCollectionKeys(collections[Symbol.store], collectionName);
      if (keys.indexOf(p) !== -1) {
        let record = getStoreRecord(collections, collectionName, p);
        // console.log('call', {target, record, p});
        let res = {
          value: record,
          writable: true,
          enumerable: true,
          configurable: true,
        };
        // console.log('proxyStoreCollection.getOwnPropertyDescriptor', {target, p, res});
        return res;
      }
      // let res = Reflect.getOwnPropertyDescriptor(keys, p);
      // return res;
      return Reflect.getOwnPropertyDescriptor(target, p)
    },
    get(target: StoreCollection<T>, p: PropertyKey, receiver: any): any {
      // console.log('proxyStoreCollection.get', {target, p});
      if (p === Symbol.toStringTag) {
        return 'ProxyCollectionStore'
      }
      if (p === Symbol.iterator) {
        // console.log('get iterator on:', target);
        let keys = getStoreCollectionKeys(collections[Symbol.store], collectionName);
        // return keys[Symbol.iterator]
        return Reflect.get(keys, p, receiver);
      }
      if (skipSymbol(p) || typeof p !== 'string') {
        return Reflect.get(target, p, receiver)
      }
      let text = collections[Symbol.store].getItem(id.record(collectionName, p));
      if (!text) {
        let idx = +p;
        if (!Number.isNaN(idx)) {
          let recordId = getStoreCollectionKeys(collections[Symbol.store], collectionName)[idx];
          text = collections[Symbol.store].getItem(id.record(collectionName, recordId))
        }
      }
      if (!text) {
        return undefined
      }
      let record = JSON.parse(text) as T;
      return proxyStoreRecord(collections, record)
    },
    set(target: StoreCollection<T>, p: PropertyKey, value: any, receiver: any): boolean {
      // console.log('proxyStoreCollection.set', {target, p, value});
      if (typeof p !== 'string' || skipSymbol(p)) {
        return Reflect.set(target, p, value, receiver)
      }
      let record = value as T;
      if (!('id' in record)) {
        console.error('missing id in record:', value);
        // throw new Error('missing id in record');
        return false;
      }
      let keys = getStoreCollectionKeys(collections[Symbol.store], collectionName);
      if (!keys.indexOf(record.id)) {
        keys.push(record.id);
        setStoreCollectionKeys(collections[Symbol.store], collectionName, keys);
      }
      collections[Symbol.store].setItem(id.record(collectionName, record.id), JSON.stringify(record));
      return true;
    },
    deleteProperty(target: StoreCollection<T>, p: PropertyKey): boolean {
      if (typeof p !== 'string' || skipSymbol(p)) {
        return Reflect.deleteProperty(target, p)
      }
      let recordId: string = p;
      collections[Symbol.store].removeItem(id.record(collectionName, recordId));
      let keys = getStoreCollectionKeys(collections[Symbol.store], collectionName);
      let idx = keys.indexOf(recordId);
      if (idx !== -1) {
        keys.splice(idx, 1);
        setStoreCollectionKeys(collections[Symbol.store], collectionName, keys);
      }
      return idx !== -1;
    }
  });
  return collection;
}

let proxyString = '[object Proxy]';

export function proxyStoreCollections<T extends Record, name extends string = string>(storeName: string, storeQuota: number = Number.MAX_SAFE_INTEGER, whitelistCollectionNames?: name[]) {
  let store = getLocalStorage(storeName, storeQuota);
  let collections: StoreCollections<T> = {[Symbol.store]: store};
  if (Array.isArray(whitelistCollectionNames)) {
    for (let name of whitelistCollectionNames) {
      collections[name] = proxyString as any;
    }
  }
  collections = new Proxy(collections, {
    get(target: StoreCollections<T>, p: PropertyKey, receiver: any): any {
      if (p === Symbol.toStringTag) {
        return 'ProxyCollectionsStore'
      }
      if (p === Symbol.store || skipSymbol(p)) {
        return Reflect.get(target, p, receiver)
      }
      // console.log('proxyStoreCollections.get', {p});
      return typeof p === 'string' && (!Array.isArray(whitelistCollectionNames) || whitelistCollectionNames.indexOf(p as name) !== -1)
        ? proxyStoreCollection<T>(collections, p)
        : Reflect.get(target, p, receiver)
    }
  });
  return collections;
}
