export type QueryValue = string | number | boolean | null | undefined

/** Accepts a query string, optionally prefixed by ?. Repeated keys become arrays. */
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

/** No leading ?. Arrays repeat keys, null becomes empty string, undefined is omitted. */
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
