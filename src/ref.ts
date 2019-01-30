import {objectInplaceMap, objectProxyMap} from "./utils";

export interface Ref {
  $ref: string
  id: string
}

export interface Record {
  id: string
}

export type Collection<T extends Record> = T[] | { [id: string]: T }
export type Collections<T extends Record> = { [name: string]: Collection<T> }

export function getFromCollectionsByRef<T extends Record>(collections: Collections<T>, ref: Ref): T {
  let collection = collections[ref.$ref];
  return Array.isArray(collection)
    ? collection.find(record => record.id === ref.id)
    : collection[ref.id]
}

export function mapCollection<T extends Record>(collection: Collection<T>, f: (record: T) => any) {
  return Array.isArray(collection)
    ? collection.map(record => f(record))
    : Object.keys(collection).map(id => f(collection[id]))
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
    : new Proxy(collection, {})
}

export function wrapCollections<T extends Record>(collections: Collections<T>) {
  return objectProxyMap(collections, collection => wrapCollection(collections, collection));
}

export function wrapCollection<T extends Record>(collections: Collections<T>, collection: Collection<T>) {
  return Array.isArray(collection)
    ? collection.map(record => wrapRecord(collections, record))
    : objectInplaceMap(collection, record => wrapRecord(collections, record));
}

export function wrapRecord<T extends Record>(collections: Collections<T>, record: T) {
  return new Proxy(record, {
    get(target: T, p: PropertyKey, receiver: any): any {
      let value = Reflect.get(target, p, receiver);
      if ('$ref' in value && 'id' in value && Object.keys(value).length === 2) {
        return getFromCollectionsByRef(collections, value);
      }
      return value;
    }
  })
}
