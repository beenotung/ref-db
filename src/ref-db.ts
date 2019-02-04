/// <reference types="./global" />

import { unique } from '@beenotung/tslib/array';
import { CachedObjectStore } from '@beenotung/tslib/cached-store';
import { Store } from '@beenotung/tslib/store';
import { Record, Ref } from './ref';
import { proxy, skipSymbol } from './utils/proxy';

Symbol.store = Symbol.for('store');

export interface StoreCollection<T extends Record = any> {
  [id: string]: T;
}

export type StoreCollections<T extends Record = any> = {
  [name: string]: StoreCollection<T>;
} & { [Symbol.store]: Store };

export namespace id {
  export function list(collectionName: string) {
    return ['list', collectionName].join('-');
  }

  export function record(collectionName: string, id: string) {
    switch (id) {
      case 'length':
      case 'push':
        throw new Error(`conflicting id of '${id}'`);
      default:
        return [collectionName, id].join('-');
    }
  }
}

export function getFromStoreCollectionsByRef<T extends Record>(
  collections: StoreCollections<T>,
  ref: Ref,
): T {
  const collection = collections[ref.$ref];
  return collection[ref.id];
}

export function proxyStoreRecord<T extends Record>(
  collections: StoreCollections<T>,
  record: T,
) {
  // console.log('proxyStoreRecord', {record});
  return proxy(record, {
    get(target: T, p: PropertyKey, receiver: any): any {
      const value = Reflect.get(target, p, receiver);
      if (p === Symbol.iterator || skipSymbol(p)) {
        return value;
      }
      if (value === undefined) {
        console.warn('get undefined field', { target, p });
        return value;
      }
      if (
        value !== null &&
        typeof value === 'object' &&
        '$ref' in value &&
        'id' in value &&
        Object.keys(value).length === 2
      ) {
        return proxyStoreRecord(
          collections,
          getFromStoreCollectionsByRef(collections, value),
        );
      }
      return proxyStoreRecord(collections, value);
    },
  });
}

export function getStoreCollectionKeys(
  collections: StoreCollections<any>,
  collectionName: string,
): string[] {
  const store = collections[Symbol.store];
  const key = id.list(collectionName);
  const keys = store.getObject(key) || [];
  // console.log('getStoreCollectionKeys',{key,keys});
  if (Array.isArray(keys)) {
    // FIXME avoid duplicated key
    // return keys
    return unique(keys);
  }
  console.error(
    `Invalid keys for collection ${collectionName}: type=${typeof keys}, value=${store.getItem(
      key,
    )}`,
  );
  throw new Error(`Invalid keys for collection '${collectionName}'`);
}

export function setStoreCollectionKeys(
  collections: StoreCollections,
  collectionName: string,
  keys: string[],
): string[] {
  // FIXME avoid duplicated key
  keys = unique(keys);
  // console.log('store key:', {id: id.list(collectionName), keys});
  collections[Symbol.store].setObject(id.list(collectionName), keys);
  return keys;
}

export function getStoreRecord<T extends Record>(
  collections: StoreCollections<T>,
  collectionName: string,
  recordId: string,
): T {
  return collections[Symbol.store].getObject(
    id.record(collectionName, recordId),
  );
}

export function proxyCollectionStoreKeys(
  collections: StoreCollections,
  collectionName: string,
): string[] {
  return new Proxy([], {
    get(target: any[], p: PropertyKey, receiver: any): any {
      const keys = getStoreCollectionKeys(collections, collectionName);
      switch (p) {
        case 'push':
          return (...ids: string[]) => {
            // TODO use better way to deduplicate
            keys.push(...ids);
            collections[Symbol.store].setObject(id.list(collectionName), keys);
            return unique(keys).length;
          };
      }
      return Reflect.get(keys, p, receiver);
    },
    set(target: any[], p: PropertyKey, value: any, receiver: any): boolean {
      const keys = getStoreCollectionKeys(collections, collectionName);
      const result = Reflect.set(keys, p, value, receiver);
      setStoreCollectionKeys(collections, collectionName, keys);
      return result;
    },
  });
}

export function proxyStoreCollection<T extends Record>(
  collections: StoreCollections<T>,
  collectionName: string,
) {
  let collection = {} as StoreCollection<T>;
  collection = new Proxy(collection, {
    ownKeys(target: StoreCollection<T>): PropertyKey[] {
      const keys = getStoreCollectionKeys(collections, collectionName);
      // console.log('proxyStoreCollection.ownKeys', { target, keys });
      return keys;
      // return Reflect.ownKeys(keys);
    },
    getOwnPropertyDescriptor(
      target: StoreCollection<T>,
      p: PropertyKey,
    ): PropertyDescriptor | undefined {
      if (p === 'constructor' || typeof p !== 'string') {
        return Reflect.getOwnPropertyDescriptor(target, p);
      }
      const keys = getStoreCollectionKeys(collections, collectionName);
      // console.log('getOwnPropertyDescriptor', { target, p ,keys});
      if (keys.indexOf(p) !== -1) {
        const record = getStoreRecord(collections, collectionName, p);
        // console.log('call', {target, record, p});
        return {
          value: record,
          writable: true,
          enumerable: true,
          configurable: true,
        };
      }
      // let res = Reflect.getOwnPropertyDescriptor(keys, p);
      // return res;
      return Reflect.getOwnPropertyDescriptor(target, p);
    },
    get(target: StoreCollection<T>, p: PropertyKey, receiver: any): any {
      // console.log('proxyStoreCollection.get', {target, p});
      if (p === Symbol.toStringTag) {
        return 'ProxyCollectionStore';
      }
      if (p === Symbol.iterator) {
        // console.log('get iterator on:', target);
        const keys = getStoreCollectionKeys(collections, collectionName);
        // return keys[Symbol.iterator]
        return Reflect.get(keys, p, receiver);
      }
      if (skipSymbol(p) || typeof p !== 'string') {
        return Reflect.get(target, p, receiver);
      }
      // let text = collections[Symbol.store].getItem(
      //   id.record(collectionName, p),
      // );
      // if (!text) {
      //   const idx = +p;
      //   if (!Number.isNaN(idx)) {
      //     const recordId = getStoreCollectionKeys(
      //       collections,
      //       collectionName,
      //     )[idx];
      //     text = collections[Symbol.store].getItem(
      //       id.record(collectionName, recordId),
      //     );
      //   }
      // }
      // if (!text) {
      //   return undefined;
      // }
      // const record = JSON.parse(text) as T;
      // console.log('<debug>');
      // console.log('p:', p);
      let record = collections[Symbol.store].getObject<T>(
        id.record(collectionName, p),
      );
      // console.log('record:', record);
      if (!record) {
        const idx = +p;
        if (!Number.isNaN(idx)) {
          const recordId = getStoreCollectionKeys(collections, collectionName)[
            idx
          ];
          // console.log('recordId:', recordId);
          record = collections[Symbol.store].getObject(
            id.record(collectionName, recordId),
          );
          // console.log('record:', record);
        }
      }
      if (!record) {
        return record;
      }
      return proxyStoreRecord(collections, record);
    },
    set(
      target: StoreCollection<T>,
      p: PropertyKey,
      value: any,
      receiver: any,
    ): boolean {
      // console.log('proxyStoreCollection.set', {target, p, value});
      if (typeof p !== 'string' || skipSymbol(p)) {
        return Reflect.set(target, p, value, receiver);
      }
      const record = value as T;
      if (!('id' in record)) {
        console.error('missing id in record:', value);
        // throw new Error('missing id in record');
        return false;
      }
      const keys = getStoreCollectionKeys(collections, collectionName);
      // console.log('keys:', keys);
      if (keys.indexOf(record.id) === -1) {
        keys.push(record.id);
        setStoreCollectionKeys(collections, collectionName, keys);
      }
      // console.log('store record:', {id: id.record(collectionName, record.id), record});
      collections[Symbol.store].setObject(
        id.record(collectionName, record.id),
        record,
      );
      return true;
    },
    deleteProperty(target: StoreCollection<T>, p: PropertyKey): boolean {
      if (typeof p !== 'string' || skipSymbol(p)) {
        return Reflect.deleteProperty(target, p);
      }
      const recordId: string = p;
      collections[Symbol.store].removeItem(id.record(collectionName, recordId));
      const keys = getStoreCollectionKeys(collections, collectionName);
      const idx = keys.indexOf(recordId);
      if (idx !== -1) {
        keys.splice(idx, 1);
        setStoreCollectionKeys(collections, collectionName, keys);
      }
      return idx !== -1;
    },
  });
  return collection;
}

const proxyString = '[object Proxy]';

export function proxyStoreCollections<
  T extends Record,
  name extends string = string
>(
  storeName: string,
  storeQuota: number = Number.MAX_SAFE_INTEGER,
  cacheSize: number = Number.MAX_SAFE_INTEGER,
  whitelistCollectionNames?: name[],
) {
  // const store = new Store(getLocalStorage(storeName, storeQuota));
  const store = CachedObjectStore.create(storeName, cacheSize, storeQuota); // getLocalStorage(storeName, storeQuota)
  let collections: StoreCollections<T> = Object.assign(
    {} as { [name: string]: StoreCollection<T> },
    { [Symbol.store]: store },
  );
  if (Array.isArray(whitelistCollectionNames)) {
    for (const name of whitelistCollectionNames) {
      collections[name] = proxyString as any;
    }
  }
  collections = new Proxy(collections, {
    get(target: StoreCollections<T>, p: PropertyKey, receiver: any): any {
      if (p === Symbol.toStringTag) {
        return 'ProxyCollectionsStore';
      }
      if (p === Symbol.store || skipSymbol(p)) {
        return Reflect.get(target, p, receiver);
      }
      // console.log("<debug>");
      // console.log('proxyStoreCollections.get', {p});
      return typeof p === 'string' &&
        (!Array.isArray(whitelistCollectionNames) ||
          whitelistCollectionNames.indexOf(p as name) !== -1)
        ? proxyStoreCollection<T>(collections, p)
        : Reflect.get(target, p, receiver);
    },
  });
  return collections;
}
