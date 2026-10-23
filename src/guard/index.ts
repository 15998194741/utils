/**
 * Checks whether a value is a non-null object.
 *
 * Arrays count as objects here, which is the difference to {@link isPlainObject}:
 * use `isObject` when you only want to exclude primitives, use `isPlainObject`
 * when you want a plain key-value record.
 *
 * @param value - Any value.
 * @returns `true` when the value is a non-null object, `false` otherwise.
 *
 * @example
 * ```ts
 * isObject({});        // true
 * isObject([]);        // true — arrays are objects too
 * isObject(new Date());// true
 * isObject(null);      // false
 * isObject('text');    // false
 * ```
 */
export function isObject(value: unknown): value is object {
  return value !== null && typeof value === 'object'
}

/**
 * Checks whether a value is a plain object, i.e. an object whose prototype is
 * `Object.prototype` or `null`.
 *
 * Arrays, `Date`, `Map`, `Set` and class instances are **not** plain objects.
 *
 * @param value - Any value.
 * @returns `true` when the value is a plain object, `false` otherwise.
 *
 * @example
 * ```ts
 * isPlainObject({ a: 1 });        // true
 * isPlainObject(Object.create(null)); // true
 * isPlainObject([]);              // false
 * isPlainObject(new Date());      // false
 * isPlainObject(null);            // false
 * ```
 */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

/**
 * Checks whether a value is an array.
 *
 * @param value - Any value.
 * @returns `true` when the value is an array, `false` otherwise.
 *
 * @example
 * ```ts
 * isArray([]);        // true
 * isArray([1, 2]);    // true
 * isArray({ 0: 1 });  // false — array-likes are not arrays
 * isArray('ab');      // false
 * ```
 */
export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value)
}

/**
 * Checks whether a value is a string primitive.
 *
 * @param value - Any value.
 * @returns `true` when the value is a string, `false` otherwise.
 *
 * @example
 * ```ts
 * isString('text');   // true
 * isString('');       // true
 * isString(42);       // false
 * isString(null);     // false
 * ```
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string'
}

/**
 * Checks whether a value is a usable number.
 *
 * `NaN` is **not** a number here, so `isNumber(NaN)` returns `false`.
 *
 * @param value - Any value.
 * @returns `true` when the value is a number other than `NaN`, `false` otherwise.
 *
 * @example
 * ```ts
 * isNumber(42);     // true
 * isNumber(-1.5);   // true
 * isNumber(Infinity); // true
 * isNumber(NaN);    // false
 * isNumber('42');   // false
 * ```
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !Number.isNaN(value)
}

/**
 * Checks whether a value is a boolean.
 *
 * @param value - Any value.
 * @returns `true` when the value is a boolean, `false` otherwise.
 *
 * @example
 * ```ts
 * isBoolean(true);   // true
 * isBoolean(false);  // true
 * isBoolean(0);      // false
 * isBoolean('true'); // false
 * ```
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean'
}

/**
 * Checks whether a value is callable.
 *
 * @param value - Any value.
 * @returns `true` when the value is a function, `false` otherwise.
 *
 * @example
 * ```ts
 * isFunction(() => {});   // true
 * isFunction(async () => {}); // true
 * isFunction(class Foo {});   // true
 * isFunction({});         // false
 * ```
 */
export function isFunction(value: unknown): value is (...args: any[]) => any {
  return typeof value === 'function'
}

/**
 * Checks whether a value is `null` or `undefined`.
 *
 * @param value - Any value.
 * @returns `true` when the value is nullish, `false` otherwise.
 *
 * @example
 * ```ts
 * isNil(null);      // true
 * isNil(undefined); // true
 * isNil(0);         // false
 * isNil('');        // false
 * ```
 */
export function isNil(value: unknown): value is null | undefined {
  return value === null || value === undefined
}

/**
 * Checks whether a value is a promise or a thenable.
 *
 * The check is duck typed on the `then` method instead of `instanceof Promise`,
 * so promises created in another realm (iframe, worker, vm context) and plain
 * thenables are detected as well.
 *
 * @param value - Any value.
 * @returns `true` when the value exposes a callable `then` method, `false` otherwise.
 *
 * @example
 * ```ts
 * isPromise(Promise.resolve(1)); // true
 * isPromise({ then() {} });        // true — thenable
 * isPromise({ then: 1 });          // false
 * isPromise(null);                 // false
 * ```
 */
export function isPromise(value: unknown): value is PromiseLike<unknown> {
  if (value === null || value === undefined) return false
  return typeof (value as { then?: unknown }).then === 'function'
}
