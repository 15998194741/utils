/**
 * The value types accepted by {@link stringifyQuery}.
 *
 * `null` becomes an empty string, `undefined` omits the key, and an array repeats the key.
 */
export type QueryValue = string | number | boolean | null | undefined

/**
 * Parses a query string into a plain object.
 *
 * Accepts a query string, optionally prefixed by ?. Repeated keys become arrays.
 *
 * @param query - The query string to parse. A leading `?` and a trailing `#fragment` are ignored.
 * @returns An object mapping each key to its value; repeated keys map to an array of values.
 *
 * @example
 * ```ts
 * parseQuery('?a=1&b=2'); // { a: '1', b: '2' }
 * parseQuery('a=1&a=2'); // { a: ['1', '2'] }
 * ```
 */
export function parseQuery(query: string): Record<string, string | string[]> {
  const result: Record<string, string | string[]> = Object.create(null)
  const params = new URLSearchParams(query.replace(/^\?/, '').split('#')[0])
  params.forEach((value, key) => {
    const previous = result[key]
    if (previous === undefined) result[key] = value
    else if (Array.isArray(previous)) previous.push(value)
    else result[key] = [previous, value]
  })
  return result
}

/**
 * Builds a query string from an object.
 *
 * No leading ?. Arrays repeat keys, null becomes empty string, undefined is omitted.
 *
 * @param query - The parameters to encode.
 * @returns The encoded query string, without a leading `?`.
 *
 * @example
 * ```ts
 * stringifyQuery({ a: 1, b: 'x' }); // 'a=1&b=x'
 * stringifyQuery({ a: [1, 2] }); // 'a=1&a=2'
 * ```
 */
export function stringifyQuery(query: Record<string, QueryValue | readonly QueryValue[]>): string {
  const params = new URLSearchParams()
  for (const key of Object.keys(query)) {
    const value = query[key]
    for (const item of Array.isArray(value) ? value : [value]) {
      if (item !== undefined) params.append(key, item === null ? '' : String(item))
    }
  }
  return params.toString()
}
