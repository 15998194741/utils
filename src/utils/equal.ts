/** Compares enumerable own properties of plain objects and arrays, including cycles.
 * Date and RegExp are compared by value; other instances by identity.
 */
export function isEqual(left: any, right: any): boolean {
  const leftSeen = new WeakMap<object, object>()
  const rightSeen = new WeakMap<object, object>()
  function equal(a: any, b: any): boolean {
    if (Object.is(a, b)) return true
    if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') return false
    if (Object.getPrototypeOf(a) !== Object.getPrototypeOf(b)) return false
    if (leftSeen.has(a) || rightSeen.has(b)) return leftSeen.get(a) === b && rightSeen.get(b) === a
    leftSeen.set(a, b); rightSeen.set(b, a)
    if (a instanceof Date) return Object.is(a.getTime(), b.getTime())
    if (a instanceof RegExp) return a.source === b.source && a.flags === b.flags && a.lastIndex === b.lastIndex
    if (Array.isArray(a)) { if (a.length !== b.length) return false }
    else if (Object.getPrototypeOf(a) !== Object.prototype && Object.getPrototypeOf(a) !== null) return false
    const keys = (obj: object) => Reflect.ownKeys(obj).filter(key => Object.prototype.propertyIsEnumerable.call(obj, key))
    const ak = keys(a), bk = keys(b)
    return ak.length === bk.length && ak.every(key => Object.prototype.propertyIsEnumerable.call(b, key) && equal(a[key], b[key]))
  }
  return equal(left, right)
}

export function shallowEqual(left: any, right: any): boolean {
  if (Object.is(left, right)) return true
  if (!left || !right || typeof left !== 'object' || typeof right !== 'object') return false
  if (Object.getPrototypeOf(left) !== Object.getPrototypeOf(right)) return false
  if (Array.isArray(left) && left.length !== right.length) return false
  const keys = (obj: object) => Reflect.ownKeys(obj).filter(key => Object.prototype.propertyIsEnumerable.call(obj, key))
  const a = keys(left), b = keys(right)
  return a.length === b.length && a.every(key => Object.prototype.propertyIsEnumerable.call(right, key) && Object.is(left[key], right[key]))
}

export function arrayIsEqual(...arrays: readonly any[][]): boolean {
  return arrays.every((array, index) => index === 0 || isEqual(arrays[index - 1], array))
}
// Legacy names remain available.
export const isRqual = isEqual
export const arrayIsRqual = arrayIsEqual
export const arrayIsRqualShallow = shallowEqual
export const objectIsRqualShallow = isEqual
