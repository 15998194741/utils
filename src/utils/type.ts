/**
 * Type names returned by {@link whatType}.
 *
 * The union lists the names that occur most often. The trailing
 * `(string & {})` keeps editor completion for those names while still
 * allowing any other name that `Object.prototype.toString` can produce,
 * such as `date`, `error`, `promise`, or `bigint`.
 */
export type WhatType =
  | 'array'
  | 'bigint'
  | 'boolean'
  | 'date'
  | 'error'
  | 'function'
  | 'htmldocument'
  | 'htmlcollection'
  | 'map'
  | 'null'
  | 'number'
  | 'object'
  | 'promise'
  | 'regexp'
  | 'set'
  | 'string'
  | 'symbol'
  | 'undefined'
  | 'weakmap'
  | 'weakset'
  | (string & {})

/**
 * Returns the lowercase type name of a value.
 *
 * The name comes from `Object.prototype.toString`, so it reflects the
 * internal slot rather than the prototype: an array reports `array`, a
 * `null` reports `null`, and a `Map` reports `map`. Values whose type has no
 * well-known name report `object`.
 *
 * @param value - Any value.
 * @returns The lowercase type name.
 *
 * @example
 * ```ts
 * whatType([]);        // 'array'
 * whatType(new Map()); // 'map'
 * whatType(undefined); // 'undefined'
 * ```
 */
export function whatType(value: unknown): WhatType {
  return Object.prototype.toString.call(value).replace(/^\[object (\w+)\]$/, '$1').toLowerCase() as WhatType
}
