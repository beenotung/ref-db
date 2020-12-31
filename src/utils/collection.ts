import { Record } from '../ref';

export function toCollection<T extends Record>(
  collection: T[] | { [id: string]: T },
): { [id: string]: T } {
  return Array.isArray(collection)
    ? collection.reduce((acc, c) => {
        acc[c.id] = c;
        return acc;
      }, {} as { [id: string]: T })
    : collection;
}
