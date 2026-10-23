const owns = (value: object, key: PropertyKey) => Object.prototype.hasOwnProperty.call(value, key)

/**
 * Values that can be cloned level by level. Functions are excluded on purpose:
 * copying one would produce a plain object that is no longer callable.
 */
const isCloneable = (value: unknown): value is object => value !== null && typeof value === 'object'

/** Mirrors the `get` path rules: a string path is split on `.`, an array path is literal. */
const resolveKeys = (path: string | readonly PropertyKey[]): readonly PropertyKey[] =>
  typeof path === 'string' ? path.split('.') : path

/** Copies one level, keeping property descriptors and the prototype of the source. */
function shallowClone<T extends object>(source: T): T {
  const isArray = Array.isArray(source)
  const target: any = isArray ? (source as any).slice() : Object.create(Object.getPrototypeOf(source))
  for (const key of Reflect.ownKeys(source)) {
    if (isArray && key === 'length') continue
    const descriptor = Object.getOwnPropertyDescriptor(source, key)!
    Object.defineProperty(target, key, { ...descriptor })
  }
  return target
}

/** Reads an own-property path, returning `undefined` as soon as a level is missing. */
function readPath(value: unknown, keys: readonly PropertyKey[]): unknown {
  let current: any = value
  for (const key of keys) {
    if (current === null || current === undefined || !owns(Object(current), key)) return undefined
    current = current[key]
  }
  return current
}

/**
 * Writes a value at a nested path and returns a new object.
 *
 * The input object is never modified: every level along the path is shallow copied
 * before the write, so the original structure stays untouched. Missing intermediate
 * levels are created as plain objects, and an intermediate level that holds a
 * primitive is replaced by a plain object.
 *
 * @param target - The object to write into. It is never modified.
 * @param path - A dotted string path (`'a.b.c'`) or a literal list of keys (`['a.b']`).
 * @param value - The value to store at the path.
 * @returns A new object with the value written at the path.
 * @throws {TypeError} When `target` is not a plain object or `path` resolves to no key. Functions are rejected because copying one would produce a non-callable object.
 *
 * @example
 * ```ts
 * set({ a: { b: 1 } }, 'a.c', 2); // { a: { b: 1, c: 2 } }
 * set({}, 'a.b.c', 1); // { a: { b: { c: 1 } } }
 * ```
 */
export function set<T extends object>(target: T, path: string | readonly PropertyKey[], value: unknown): T {
  if (!isCloneable(target)) throw new TypeError('set expects an object target')
  const keys = resolveKeys(path)
  if (!keys.length) throw new TypeError('set requires a non-empty path')

  const root: any = shallowClone(target)
  let node: any = root
  for (let index = 0; index < keys.length - 1; index += 1) {
    const key = keys[index]
    const child = owns(node, key) ? node[key] : undefined
    const next: any = isCloneable(child) ? shallowClone(child) : {}
    Object.defineProperty(node, key, { value: next, enumerable: true, writable: true, configurable: true })
    node = next
  }
  const last = keys[keys.length - 1]
  Object.defineProperty(node, last, { value, enumerable: true, writable: true, configurable: true })
  return root
}

/**
 * Removes the property at a nested path and returns a new object.
 *
 * The input object is never modified: every level along the path is shallow copied
 * before the property is dropped. A path that does not exist is a no-op and the
 * shallow copy of the input is returned. Empty objects left behind by the removal
 * are kept as they are.
 *
 * @param target - The object to remove from. It is never modified.
 * @param path - A dotted string path (`'a.b'`) or a literal list of keys (`['a.b']`).
 * @returns A new object without the property at the path.
 * @throws {TypeError} When `target` is not an object.
 *
 * @example
 * ```ts
 * unset({ a: { b: 1 } }, 'a.b'); // { a: {} }
 * unset({ a: 1 }, 'b.c'); // { a: 1 }
 * ```
 */
export function unset<T extends object>(target: T, path: string | readonly PropertyKey[]): T {
  if (!isCloneable(target)) throw new TypeError('unset expects an object target')
  const keys = resolveKeys(path)
  if (!keys.length) return shallowClone(target)

  let current: any = target
  for (let index = 0; index < keys.length - 1; index += 1) {
    const key = keys[index]
    if (!isCloneable(current) || !owns(Object(current), key)) return shallowClone(target)
    current = current[key]
  }
  const last = keys[keys.length - 1]
  if (!isCloneable(current) || !owns(Object(current), last)) return shallowClone(target)

  const root: any = shallowClone(target)
  let node: any = root
  for (let index = 0; index < keys.length - 1; index += 1) {
    const key = keys[index]
    const child = owns(node, key) ? node[key] : undefined
    const next: any = isCloneable(child) ? shallowClone(child) : {}
    Object.defineProperty(node, key, { value: next, enumerable: true, writable: true, configurable: true })
    node = next
  }
  Reflect.deleteProperty(node, last)
  return root
}

/**
 * Replaces the value at a nested path with the result of `updater` and returns a new object.
 *
 * The input object is never modified. `updater` receives the current value, or
 * `undefined` when the path does not exist yet, and any error it throws is propagated
 * to the caller.
 *
 * @param target - The object to update. It is never modified.
 * @param path - A dotted string path (`'a.b'`) or a literal list of keys (`['a.b']`).
 * @param updater - Receives the current value and returns the value to store.
 * @returns A new object with the updated value at the path.
 * @throws {TypeError} When `target` is not a plain object or `path` resolves to no key. Functions are rejected because copying one would produce a non-callable object.
 *
 * @example
 * ```ts
 * update({ count: 1 }, 'count', value => (value as number) + 1); // { count: 2 }
 * update({}, 'count', value => value ?? 0); // { count: 0 }
 * ```
 */
export function update<T extends object>(
  target: T,
  path: string | readonly PropertyKey[],
  updater: (current: unknown) => unknown,
): T {
  if (!isCloneable(target)) throw new TypeError('update expects an object target')
  const keys = resolveKeys(path)
  if (!keys.length) throw new TypeError('update requires a non-empty path')

  const next = updater(readPath(target, keys))
  return set(target, path, next)
}
