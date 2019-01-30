import {proxy, skipSymbol as _skipSymbol} from "./utils/proxy";
import {objectCreateMap } from "./utils/object";

export interface Ref {
  $ref: string
  id: string
}

export interface Record {
  id: string
}

export type Collection<T extends Record> = T[] | { [id: string]: T }
export type Collections<T extends Record> = { [name: string]: Collection<T> }

function skipSymbol(p) {
  return typeof p === "symbol" || _skipSymbol(p);
}

export function getFromCollectionsByRef<T extends Record>(collections: Collections<T>, ref: Ref): T {
  let collection = collections[ref.$ref];
  // console.log({collections, $ref: ref.$ref, collection});
  return Array.isArray(collection)
    ? collection.find(record => record.id === ref.id)
    : collection[ref.id]
}

export function mapCollection<T extends Record>(collection: Collection<T>, f: (record: T) => any) {
  return Array.isArray(collection)
    ? collection.map(record => f(record))
    : objectCreateMap(collection, record => f(record))
}

/*
export function proxyRecordInCollect<T extends Record>(collection: Collection<T>) {
  return Array.isArray(collection)
    ? new Proxy(collection, {
      get(target: T[], p: PropertyKey, receiver: any): any {
        if (skipSymbol(p) || p === 'length') {
          return Reflect.get(target, p, receiver)
        }
        switch (typeof p) {
          case "string":
            return target.find(record => record.id === p);
          case "number":
            // FIXME never be number on V8?
            return target[p];
          default:
            return Reflect.get(target, p, receiver)
        }
      }
    })
    : collection
}
*/

export function proxyCollections<T extends Record>(collections: Collections<T>) {
  collections = new Proxy(collections, {
    get(target: Collections<T>, p: PropertyKey, receiver: any): any {
      let value = Reflect.get(target, p, receiver);
      if (typeof p === "symbol" || skipSymbol(p) || typeof p !== 'string') {
        return value;
      }
      return proxyCollection(collections, value);
    }
  });
  return collections;
}

export function proxyCollection<T extends Record>(collections: Collections<T>, collection: Collection<T>): Collection<T> {
  // console.log('proxyCollection', {collection});
  collection = new Proxy(collection, {
    get(target: T[] | { [p: string]: T }, p: PropertyKey, receiver: any): any {
      // console.log('get in collection', {target, p});
      let value = Reflect.get(target, p, receiver);
      if (skipSymbol(p) || typeof value === "function") {
        return value
      }
      // console.log('proxyCollection.get', {target, p, value});
      switch (p) {
        case 'length':
          return Array.isArray(target)
            ? target.length
            : Object.keys(target).length;
        case 'push':
          return Array.isArray(target)
            ? value
            : (...records: T[]) => {
              for (let record of records) {
                target[record.id] = record;
              }
              return Object.keys(target).length;
            };
        case 'keys':
          return Array.isArray(target)
            ? target.keys()
            : Object.keys(target);
      }
      if (typeof p !== "string") {
        return value
      }
      let recordId: string = p;
      let record = Array.isArray(target)
        ? target.find(record => record.id === recordId)
        : target[recordId];
      if (record === undefined) {
        let idx = +p;
        if (!Number.isNaN(idx)) {
          record = Array.isArray(target)
            ? target[idx]
            : target[Object.keys(target)[idx]]
        }
      }
      if (record === undefined) {
        return undefined;
      }
      // let record = proxyRecordInCollect(collection)[p];
      return proxyRecord(collections, record);
    }
  });
  return collection;
  // return Array.isArray(collection)
  //   ? collection.map(record => proxyRecord(collections, record))
  //   : objectInplaceMap(collection, record => proxyRecord(collections, record));
}

export function proxyRecord<T extends Record>(collections: Collections<T>, record: T) {
  // console.log('proxyRecord', {record});
  return proxy(record, {
    get(target: T, p: PropertyKey, receiver: any): any {
      let value = Reflect.get(target, p, receiver);
      if (skipSymbol(p)) {
        return value;
      }
      if (value === undefined) {
        console.warn('get undefined field', {target, p});
        return value;
      }
      if (value !== null && typeof value === "object" && '$ref' in value && 'id' in value && Object.keys(value).length === 2) {
        return proxyRecord(collections, getFromCollectionsByRef(collections, value));
      }
      return proxyRecord(collections, value);
    }
  });
}
