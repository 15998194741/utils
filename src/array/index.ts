export function unique<T>(values: readonly T[]): T[] { return [...new Set(values)] }

export function chunk<T>(values: readonly T[], size: number): T[][] {
  if (!Number.isInteger(size) || size <= 0) throw new RangeError('size must be a positive integer')
  const result: T[][] = []
  for (let i = 0; i < values.length; i += size) result.push(values.slice(i, i + size))
  return result
}

/** Map keys may be strings, objects, or other values. Preserves input order. */
export function groupBy<T, K>(values: readonly T[], key: (value: T) => K): Map<K, T[]> {
  const result = new Map<K, T[]>()
  for (const value of values) {
    const group = key(value)
    if (!result.has(group)) result.set(group, [])
    result.get(group)!.push(value)
  }
  return result
}

export function intersection<T>(left: readonly T[], right: readonly T[]): T[] {
  const set = new Set(right)
  return unique(left).filter(value => set.has(value))
}

export function difference<T>(left: readonly T[], right: readonly T[]): T[] {
  const set = new Set(right)
  return unique(left).filter(value => !set.has(value))
}
