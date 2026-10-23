import { deepClone } from '../utils/copy'

const owns = (value: object, key: PropertyKey) => Object.prototype.hasOwnProperty.call(value, key)

/**
 * Returns a new object containing only the requested own properties.
 *
 * @param value - The source object. It is not modified.
 * @param keys - The property keys to keep. Missing keys are skipped.
 * @returns A new object holding the own properties that exist in `value`.
 *
 * @example
 * ```ts
 * pick({ a: 1, b: 2, c: 3 }, ['a', 'c']); // { a: 1, c: 3 }
 * ```
 */
export function pick<T extends object, K extends keyof T>(value: T, keys: readonly K[]): Pick<T, K> {
  const result = {} as Pick<T, K>
  for (const key of keys) if (owns(value, key)) {
    Object.defineProperty(result, key, { value: value[key], enumerable: true, writable: true, configurable: true })
  }
  return result
}

/**
 * Returns a new object without the excluded own properties.
 *
 * @param value - The source object. It is not modified.
 * @param keys - The property keys to drop.
 * @returns A new object holding the enumerable own properties not listed in `keys`.
 *
 * @example
 * ```ts
 * omit({ a: 1, b: 2, c: 3 }, ['b']); // { a: 1, c: 3 }
 * ```
 */
export function omit<T extends object, K extends keyof T>(value: T, keys: readonly K[]): Omit<T, K> {
  const excluded = new Set<PropertyKey>(keys)
  const remaining = Reflect.ownKeys(value).filter(key => !excluded.has(key) && Object.prototype.propertyIsEnumerable.call(value, key))
  return pick(value, remaining as (keyof T)[]) as Omit<T, K>
}

/**
 * Reads a nested value by path without throwing.
 *
 * Own properties only. Supports dotted paths or explicit segments for keys containing dots.
 *
 * @param value - The source value to read from.
 * @param path - A dotted path such as `'a.b.c'`, or an explicit array of segments.
 * @param fallback - Returned when the path is missing or resolves to `undefined`.
 * @returns The value at the path, or `fallback` when it cannot be resolved.
 *
 * @example
 * ```ts
 * get({ a: { b: { c: 7 } } }, 'a.b.c'); // 7
 * get({ a: 1 }, 'a.b', 'fallback'); // 'fallback'
 * ```
 */
export function get<T = unknown>(value: unknown, path: string | readonly PropertyKey[], fallback?: T): T | undefined {
  const keys = typeof path === 'string' ? path.split('.') : path
  let current: any = value
  for (const key of keys) {
    if (current === null || current === undefined || !owns(Object(current), key)) return fallback
    current = current[key]
  }
  return current === undefined ? fallback : current as T
}

/**
 * Reports whether a value has no contents.
 *
 * Empty means no contents or enumerable own properties; 0 and false are not empty.
 *
 * @param value - The value to inspect.
 * @returns `true` for `null`, `undefined`, empty strings and arrays, empty `Map`/`Set`,
 * and objects without enumerable own properties; `false` otherwise.
 *
 * @example
 * ```ts
 * isEmpty([]); // true
 * isEmpty({}); // true
 * isEmpty(0); // false
 * ```
 */
export function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true
  if (typeof value === 'string' || Array.isArray(value)) return value.length === 0
  if (value instanceof Map || value instanceof Set) return value.size === 0
  if (typeof value === 'object') return Reflect.ownKeys(value).every(key => !Object.prototype.propertyIsEnumerable.call(value, key))
  return false
}

function isPlain(value: any): value is Record<PropertyKey, any> {
  return value !== null && typeof value === 'object' && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null)
}

/**
 * Merges the sources into a new object, recursing into nested plain objects.
 *
 * Merges enumerable own properties of plain objects. Arrays replace rather than concatenate.
 * Inputs must be acyclic; special instances follow deepClone semantics.
 *
 * @param sources - The plain objects to merge, applied left to right. Later values win.
 * @returns A new object holding the merged result.
 * @throws {TypeError} When a source is not a plain object or the sources contain a cycle.
 *
 * @example
 * ```ts
 * deepMerge({ a: { x: 1 } }, { a: { y: 2 }, b: 3 }); // { a: { x: 1, y: 2 }, b: 3 }
 * ```
 */
export function deepMerge(...sources: readonly Record<string, any>[]): Record<string, any> {
  const active = new WeakSet<object>()
  function merge(target: Record<PropertyKey, any>, source: Record<PropertyKey, any>): void {
    if (active.has(source)) throw new TypeError('deepMerge does not support cyclic plain objects')
    active.add(source)
    for (const key of Reflect.ownKeys(source)) {
      if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue
      const value = source[key]
      let next: any
      if (isPlain(value)) {
        next = owns(target, key) && isPlain(target[key]) ? target[key] : Object.create(Object.getPrototypeOf(value))
        merge(next, value)
      } else next = deepClone(value)
      Object.defineProperty(target, key, { value: next, enumerable: true, writable: true, configurable: true })
    }
    active.delete(source)
  }
  const result = {}
  for (const source of sources) {
    if (!isPlain(source)) throw new TypeError('deepMerge expects plain objects')
    merge(result, source)
  }
  return result
}

/**
 * Returns a new object holding the own properties the predicate accepts.
 *
 * Only enumerable own properties are considered, including Symbol keys. The
 * predicate receives the property value and its key.
 *
 * @param value - The source object. It is not modified.
 * @param predicate - Called with each property value and key; keeps the property when it returns `true`.
 * @returns A new object holding the accepted properties.
 *
 * @example
 * ```ts
 * pickBy({ a: 1, b: 2, c: 3 }, value => value > 1); // { b: 2, c: 3 }
 * ```
 */
export function pickBy<T extends object>(value: T, predicate: (property: T[keyof T], key: PropertyKey) => boolean): Partial<T> {
  const result: Partial<T> = {}
  for (const key of Reflect.ownKeys(value)) {
    if (!Object.prototype.propertyIsEnumerable.call(value, key)) continue
    if (predicate(value[key as keyof T], key)) {
      Object.defineProperty(result, key, { value: value[key as keyof T], enumerable: true, writable: true, configurable: true })
    }
  }
  return result
}

/**
 * Returns a new object without the own properties the predicate accepts.
 *
 * Only enumerable own properties are considered, including Symbol keys. The
 * predicate receives the property value and its key.
 *
 * @param value - The source object. It is not modified.
 * @param predicate - Called with each property value and key; drops the property when it returns `true`.
 * @returns A new object holding the remaining properties.
 *
 * @example
 * ```ts
 * omitBy({ a: 1, b: 2, c: 3 }, value => value > 1); // { a: 1 }
 * ```
 */
export function omitBy<T extends object>(value: T, predicate: (property: T[keyof T], key: PropertyKey) => boolean): Partial<T> {
  const result: Partial<T> = {}
  for (const key of Reflect.ownKeys(value)) {
    if (!Object.prototype.propertyIsEnumerable.call(value, key)) continue
    if (!predicate(value[key as keyof T], key)) {
      Object.defineProperty(result, key, { value: value[key as keyof T], enumerable: true, writable: true, configurable: true })
    }
  }
  return result
}

/**
 * Fills the undefined properties of an object from fallback sources.
 *
 * Only properties that already exist on the target are filled, and only when
 * their current value is `undefined`. Keys that are missing from the target are
 * not added. Sources are consulted left to right and the first one that owns
 * the key wins.
 *
 * @param target - The object holding the values to complete. It is not modified.
 * @param sources - The fallback objects, consulted left to right.
 * @returns A new object with the completed properties.
 *
 * @example
 * ```ts
 * defaults({ timeout: undefined, retries: 1 }, { timeout: 3000, retries: 5 });
 * // { timeout: 3000, retries: 1 }
 * ```
 */
export function defaults<T extends object>(target: T, ...sources: Partial<T>[]): T {
  const result: any = {}
  for (const key of Reflect.ownKeys(target)) {
    if (!Object.prototype.propertyIsEnumerable.call(target, key)) continue
    Object.defineProperty(result, key, { value: target[key as keyof T], enumerable: true, writable: true, configurable: true })
  }
  for (const key of Reflect.ownKeys(result)) {
    if (result[key] !== undefined) continue
    for (const source of sources) {
      if (source && owns(source, key)) {
        result[key] = source[key as keyof T]
        break
      }
    }
  }
  return result as T
}

/**
 * Merges the sources into a new object, one level deep.
 *
 * Only enumerable own properties are copied, including Symbol keys. Later
 * sources win. Unlike `Object.assign` the sources are never modified.
 *
 * @param sources - The objects to merge, applied left to right.
 * @returns A new object holding the merged result.
 *
 * @example
 * ```ts
 * assign({ a: 1 }, { b: 2 }, { a: 3 }); // { a: 3, b: 2 }
 * ```
 */
export function assign<T extends object>(...sources: Partial<T>[]): T {
  const result: any = {}
  for (const source of sources) {
    if (source === null || source === undefined) continue
    for (const key of Reflect.ownKeys(source)) {
      if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue
      Object.defineProperty(result, key, { value: source[key as keyof T], enumerable: true, writable: true, configurable: true })
    }
  }
  return result as T
}
