import { deepClone } from '../utils/copy'

const owns = (value: object, key: PropertyKey) => Object.prototype.hasOwnProperty.call(value, key)

export function pick<T extends object, K extends keyof T>(value: T, keys: readonly K[]): Pick<T, K> {
  const result = {} as Pick<T, K>
  for (const key of keys) if (owns(value, key)) {
    Object.defineProperty(result, key, { value: value[key], enumerable: true, writable: true, configurable: true })
  }
  return result
}

export function omit<T extends object, K extends keyof T>(value: T, keys: readonly K[]): Omit<T, K> {
  const excluded = new Set<PropertyKey>(keys)
  const remaining = Reflect.ownKeys(value).filter(key => !excluded.has(key) && Object.prototype.propertyIsEnumerable.call(value, key))
  return pick(value, remaining as (keyof T)[]) as Omit<T, K>
}

/** Own properties only. Supports dotted paths or explicit segments for keys containing dots. */
export function get<T = unknown>(value: unknown, path: string | readonly PropertyKey[], fallback?: T): T | undefined {
  const keys = typeof path === 'string' ? path.split('.') : path
  let current: any = value
  for (const key of keys) {
    if (current === null || current === undefined || !owns(Object(current), key)) return fallback
    current = current[key]
  }
  return current === undefined ? fallback : current as T
}

/** Empty means no contents or enumerable own properties; 0 and false are not empty. */
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

/** Merges enumerable own properties of plain objects. Arrays replace rather than concatenate.
 * Inputs must be acyclic; special instances follow deepClone semantics.
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
