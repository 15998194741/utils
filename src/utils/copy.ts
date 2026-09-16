/** JSON-compatible object and array copy. */
export function copy<T extends object>(value: T): T {
  return JSON.parse(JSON.stringify(value))
}

/** Copies plain objects, arrays, Date, RegExp, Map and Set, including cycles.
 * Other instances and functions retain their original identity.
 */
export function deepClone<T>(value: T): T {
  const seen = new WeakMap<object, any>()
  function clone(input: any): any {
    if (input === null || typeof input !== 'object') return input
    if (seen.has(input)) return seen.get(input)
    let output: any
    if (input instanceof Date) output = new Date(input.getTime())
    else if (input instanceof RegExp) { output = new RegExp(input.source, input.flags); output.lastIndex = input.lastIndex }
    else if (input instanceof Map) output = new Map()
    else if (input instanceof Set) output = new Set()
    else if (Array.isArray(input)) output = new Array(input.length)
    else if (Object.getPrototypeOf(input) === Object.prototype || Object.getPrototypeOf(input) === null) output = Object.create(Object.getPrototypeOf(input))
    else return input
    seen.set(input, output)
    if (input instanceof Map) input.forEach((v, k) => output.set(clone(k), clone(v)))
    if (input instanceof Set) input.forEach(v => output.add(clone(v)))
    for (const key of Reflect.ownKeys(input)) {
      const descriptor = Object.getOwnPropertyDescriptor(input, key)!
      if ('value' in descriptor) descriptor.value = clone(descriptor.value)
      Object.defineProperty(output, key, descriptor)
    }
    return output
  }
  return clone(value)
}
copy.deepcopy = deepClone
