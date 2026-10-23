/**
 * Returns a copy of the values with duplicates removed, keeping the first occurrence.
 *
 * @param values - The source array. It is not modified.
 * @returns A new array without duplicates.
 *
 * @example
 * ```ts
 * unique([1, 2, 2, 3]); // [1, 2, 3]
 * ```
 */
export function unique<T>(values: readonly T[]): T[] { return [...new Set(values)] }

/**
 * Splits the values into consecutive groups of at most the given size.
 *
 * @param values - The source array. It is not modified.
 * @param size - Maximum number of elements per group. Must be a positive integer.
 * @returns A new array of arrays; the last group may be shorter than `size`.
 * @throws {RangeError} When `size` is not a positive integer.
 *
 * @example
 * ```ts
 * chunk([1, 2, 3, 4, 5], 2); // [[1, 2], [3, 4], [5]]
 * ```
 */
export function chunk<T>(values: readonly T[], size: number): T[][] {
  if (!Number.isInteger(size) || size <= 0) throw new RangeError('size must be a positive integer')
  const result: T[][] = []
  for (let i = 0; i < values.length; i += size) result.push(values.slice(i, i + size))
  return result
}

/**
 * Groups the values into buckets keyed by the result of the key function.
 *
 * Map keys may be strings, objects, or other values. Preserves input order.
 *
 * @param values - The source array. It is not modified.
 * @param key - Derives the bucket key for each value.
 * @returns A map from key to the values that produced it, in input order.
 *
 * @example
 * ```ts
 * groupBy([1, 2, 3, 4], value => (value % 2 === 0 ? 'even' : 'odd')); // Map { 'odd' => [1, 3], 'even' => [2, 4] }
 * ```
 */
export function groupBy<T, K>(values: readonly T[], key: (value: T) => K): Map<K, T[]> {
  const result = new Map<K, T[]>()
  for (const value of values) {
    const group = key(value)
    if (!result.has(group)) result.set(group, [])
    result.get(group)!.push(value)
  }
  return result
}

/**
 * Returns the values present in both arrays.
 *
 * @param left - The first source array. It is not modified.
 * @param right - The second source array. It is not modified.
 * @returns The deduplicated values of `left` that also occur in `right`.
 *
 * @example
 * ```ts
 * intersection([1, 2, 3], [2, 3, 4]); // [2, 3]
 * ```
 */
export function intersection<T>(left: readonly T[], right: readonly T[]): T[] {
  const set = new Set(right)
  return unique(left).filter(value => set.has(value))
}

/**
 * Returns the values of the first array that are absent from the second.
 *
 * @param left - The first source array. It is not modified.
 * @param right - The second source array. It is not modified.
 * @returns The deduplicated values of `left` that do not occur in `right`.
 *
 * @example
 * ```ts
 * difference([1, 2, 3], [2, 3, 4]); // [1]
 * ```
 */
export function difference<T>(left: readonly T[], right: readonly T[]): T[] {
  const set = new Set(right)
  return unique(left).filter(value => !set.has(value))
}

/**
 * Builds a sequence of numbers from `start` toward `end`.
 *
 * When `end` is omitted the single argument is the bound of the sequence counted from zero: a
 * positive bound yields `[0, bound - 1]` and a negative bound yields `[0, ..., bound]`, so the
 * negative bound itself is the last value. When `end` is provided the range is half-open and the
 * `end` value is never part of the result.
 *
 * @param start - The first value of the sequence. When `end` is omitted it is used as the bound.
 * @param end - The exclusive bound of the sequence. Defaults to the bound described above.
 * @param step - The distance between two consecutive values. Defaults to `-1` when `end` is
 * smaller than `start` and to `1` otherwise.
 * @returns A new array with the generated numbers.
 * @throws {RangeError} When an argument is not a finite integer, or when `step` is `0`.
 *
 * @example
 * ```ts
 * range(5); // [0, 1, 2, 3, 4]
 * range(-3); // [0, -1, -2]
 * range(5, 0); // [5, 4, 3, 2, 1]
 * range(1, 10, 3); // [1, 4, 7]
 * ```
 */
export function range(start: number, end?: number, step?: number): number[] {
  if (!Number.isInteger(start)) throw new RangeError('start must be a finite integer')
  if (end !== undefined && !Number.isInteger(end)) throw new RangeError('end must be a finite integer')
  if (step !== undefined && !Number.isInteger(step)) throw new RangeError('step must be a finite integer')
  if (step === 0) throw new RangeError('step must not be zero')
  const bounded = end !== undefined
  const from = bounded ? start : 0
  const to = bounded ? (end as number) : start
  const distance = step !== undefined ? step : to < from ? -1 : 1
  const result: number[] = []
  if (distance > 0) {
    for (let value = from; value < to; value += distance) result.push(value)
  } else {
    // The bound is always exclusive, so a derived bound yields |start| values
    // and an explicit bound behaves like every other half-open range.
    for (let value = from; value > to; value += distance) result.push(value)
  }
  return result
}

/**
 * Normalizes a single value, an array or any iterable into an array.
 *
 * Arrays are copied shallowly, iterables such as `Set`, `Map`, strings and generators are expanded
 * with `Array.from` (a `Map` therefore yields its `[key, value]` entries) and every other value is
 * wrapped in a one element array.
 *
 * @param value - The value to normalize. `null` and `undefined` produce an empty array.
 * @returns A new array holding the normalized values.
 *
 * @example
 * ```ts
 * toArray([1, 2]); // [1, 2]
 * toArray(new Set([1, 2])); // [1, 2]
 * toArray(new Map([['a', 1]])); // [['a', 1]]
 * toArray('ab'); // ['a', 'b']
 * toArray(null); // []
 * toArray(5); // [5]
 * ```
 */
export function toArray<T>(value: T | readonly T[] | Iterable<T>): T[] {
  if (value === null || value === undefined) return []
  const source = value as any
  if (Array.isArray(source)) return [...source]
  if (typeof source[Symbol.iterator] === 'function') return Array.from(source as Iterable<T>)
  return [source as T]
}

/**
 * Flattens the nested arrays of the values up to the given depth.
 *
 * Only array elements are expanded, plain objects are kept as they are. A `depth` of `0` returns a
 * shallow copy of the values.
 *
 * @param values - The source array. It is not modified.
 * @param depth - How many levels of arrays are expanded. Defaults to `1`.
 * @returns A new array with the nested arrays expanded.
 * @throws {RangeError} When `depth` is not a non-negative integer.
 *
 * @example
 * ```ts
 * flatten([1, [2, [3, [4]]]]); // [1, 2, [3, [4]]]
 * flatten([1, [2, [3, [4]]]], 2); // [1, 2, 3, [4]]
 * flatten([1, [2]], 0); // [1, [2]]
 * ```
 */
export function flatten<T>(values: readonly T[], depth = 1): T[] {
  if (!Number.isInteger(depth) || depth < 0) throw new RangeError('depth must be a non-negative integer')
  if (depth === 0) return [...values]
  const result: T[] = []
  for (const value of values) {
    if (Array.isArray(value)) result.push(...flatten(value as any[], depth - 1))
    else result.push(value)
  }
  return result
}

/**
 * Returns the first value of the array.
 *
 * @param values - The source array. It is not modified.
 * @returns The first value, or `undefined` when the array is empty.
 *
 * @example
 * ```ts
 * first([1, 2, 3]); // 1
 * first([]); // undefined
 * ```
 */
export function first<T>(values: readonly T[]): T | undefined {
  return values.length > 0 ? values[0] : undefined
}

/**
 * Returns the last value of the array.
 *
 * @param values - The source array. It is not modified.
 * @returns The last value, or `undefined` when the array is empty.
 *
 * @example
 * ```ts
 * last([1, 2, 3]); // 3
 * last([]); // undefined
 * ```
 */
export function last<T>(values: readonly T[]): T | undefined {
  return values.length > 0 ? values[values.length - 1] : undefined
}

/**
 * Removes every falsy value from the values.
 *
 * Falsy means `false`, `null`, `undefined`, `0`, `''` and `NaN`, so the numbers `0` and the empty
 * strings are dropped as well. This matches the behaviour of lodash `_.compact`.
 *
 * @param values - The source array. It is not modified.
 * @returns A new array without the falsy values.
 *
 * @example
 * ```ts
 * compact([0, 1, false, 2, '', 3, null, undefined, NaN]); // [1, 2, 3]
 * ```
 */
export function compact<T>(values: readonly (T | null | undefined | false | 0 | '')[]): T[] {
  return values.filter(value => Boolean(value)) as T[]
}

/**
 * Returns the first `count` values of the array.
 *
 * @param values - The source array. It is not modified.
 * @param count - How many values are taken. A count of `0` or less returns an empty array.
 * @returns A new array with at most `count` values.
 * @throws {RangeError} When `count` is not a finite integer.
 *
 * @example
 * ```ts
 * take([1, 2, 3], 2); // [1, 2]
 * take([1, 2, 3], 0); // []
 * take([1, 2, 3], 9); // [1, 2, 3]
 * ```
 */
export function take<T>(values: readonly T[], count: number): T[] {
  if (!Number.isInteger(count)) throw new RangeError('count must be a finite integer')
  if (count <= 0) return []
  return values.slice(0, count)
}

/**
 * Returns the values of the array without its first `count` values.
 *
 * @param values - The source array. It is not modified.
 * @param count - How many values are dropped. A count of `0` or less keeps every value.
 * @returns A new array with the remaining values.
 * @throws {RangeError} When `count` is not a finite integer.
 *
 * @example
 * ```ts
 * drop([1, 2, 3], 2); // [3]
 * drop([1, 2, 3], 0); // [1, 2, 3]
 * drop([1, 2, 3], 9); // []
 * ```
 */
export function drop<T>(values: readonly T[], count: number): T[] {
  if (!Number.isInteger(count)) throw new RangeError('count must be a finite integer')
  if (count <= 0) return [...values]
  return values.slice(count)
}

/**
 * Groups the values of the arrays by position.
 *
 * The result has the length of the longest array, the positions a shorter array does not cover are
 * filled with `undefined`.
 *
 * @param arrays - The arrays to zip. They are not modified.
 * @returns A new array of arrays holding the values of every position.
 *
 * @example
 * ```ts
 * zip([1, 2], ['a', 'b', 'c']); // [[1, 'a'], [2, 'b'], [undefined, 'c']]
 * zip(); // []
 * ```
 */
export function zip<T>(...arrays: ReadonlyArray<readonly T[]>): Array<Array<T | undefined>> {
  const length = arrays.reduce((longest, values) => Math.max(longest, values.length), 0)
  const result: Array<Array<T | undefined>> = []
  for (let index = 0; index < length; index++) {
    result.push(arrays.map(values => values[index] as T | undefined))
  }
  return result
}

/**
 * Transposes the rows into columns.
 *
 * The result has as many rows as the longest input row, the positions a shorter row does not
 * cover are filled with `undefined`.
 *
 * @param rows - The rows to unzip. They are not modified.
 * @returns A new array of arrays holding the values of every column.
 *
 * @example
 * ```ts
 * unzip([[1, 2], [3, 4]]); // [[1, 3], [2, 4]]
 * unzip([[1, 2], [3]]); // [[1, 3], [2, undefined]]
 * unzip([]); // []
 * ```
 */
export function unzip<T>(rows: ReadonlyArray<readonly T[]>): T[][] {
  const length = rows.reduce((longest, values) => Math.max(longest, values.length), 0)
  const result: T[][] = []
  for (let index = 0; index < length; index++) {
    result.push(rows.map(values => values[index] as T))
  }
  return result
}

/**
 * Moves the value at the `from` index to the `to` index.
 *
 * @param values - The source array. It is not modified.
 * @param from - The index of the value that is moved.
 * @param to - The index the value is moved to.
 * @returns A new array with the value moved.
 * @throws {RangeError} When an index is not a finite integer or lies outside the array.
 *
 * @example
 * ```ts
 * arrayMove([1, 2, 3], 0, 2); // [2, 3, 1]
 * arrayMove([1, 2, 3], 1, 1); // [1, 2, 3]
 * ```
 */
export function arrayMove<T>(values: readonly T[], from: number, to: number): T[] {
  if (!Number.isInteger(from) || !Number.isInteger(to)) throw new RangeError('from and to must be finite integers')
  if (from < 0 || from >= values.length || to < 0 || to >= values.length) {
    throw new RangeError('from and to must be inside the array')
  }
  const result = [...values]
  if (from === to) return result
  const [moved] = result.splice(from, 1)
  result.splice(to, 0, moved)
  return result
}
