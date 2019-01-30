import {objectCreateMap, objectInplaceMap, objectProxyMap} from "./utils";
import {skipSymbol as _skipSymbol} from "./utils/proxy";
import {type} from "os";

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

function proxy<T extends object>(target: T, handler: ProxyHandler<T>) {
  if (typeof target === "object" && target !== null) {
    return new Proxy(target as any, handler)
  }
  return target;
}

export function getFromCollectionsByRef<T extends Record>(collections: Collections<T>, ref: Ref): T {
  let collection = collections[ref.$ref];
  return Array.isArray(collection)
    ? collection.find(record => record.id === ref.id)
    : collection[ref.id]
}

export function mapCollection<T extends Record>(collection: Collection<T>, f: (record: T) => any) {
  return Array.isArray(collection)
    ? collection.map(record => f(record))
    : objectCreateMap(collection, record => f(record))
}

export function proxyRecordInCollect<T extends Record>(collection: Collection<T>) {
  return Array.isArray(collection)
    ? new Proxy(collection, {
      get(target: T[], p: PropertyKey, receiver: any): any {
        switch (typeof p) {
          case "string":
            return target.find(record => record.id === p);
          case "number":
            return target[p];
          default:
            return undefined
        }
      }
    })
    : new Proxy(collection, {
      get(target: { [p: string]: T }, p: PropertyKey, receiver: any): any {
        return target[p as string];
      }
    })
}

export function proxyCollections<T extends Record>(collections: Collections<T>) {
  return objectProxyMap(collections, collection => proxyCollection(collections, collection));
}

export function proxyCollection<T extends Record>(collections: Collections<T>, collection: Collection<T>) {
  // console.log('proxyCollection', {collection});
  return new Proxy(collection, {
    get(target: T[] | { [p: string]: T }, p: PropertyKey, receiver: any): any {
      // console.log('get in collection', {target, p});
      let record = proxyRecordInCollect(collection)[p];
      return proxyRecord(collections, record);
    }
  });
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
        console.log('get undefined field', {target, p});
        return value;
      }
      if (typeof value === "object" && '$ref' in value && 'id' in value && Object.keys(value).length === 2) {
        return proxyRecord(collections, getFromCollectionsByRef(collections, value));
      }
      return proxyRecord(collections, value);
    }
  });
}
