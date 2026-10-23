function sorted(values: readonly number[]): number[] {
  if (!values.length) throw new RangeError('values must not be empty')
  if (values.some(value => !Number.isFinite(value))) throw new RangeError('values must contain only finite numbers')
  return values.slice().sort((a, b) => a - b)
}
/**
 * Returns the median of a set of numbers.
 *
 * @param values - The numbers to inspect. Must contain at least one finite number.
 * @returns The middle value, or the average of the two middle values for an even count.
 * @throws {RangeError} When the array is empty or contains a non-finite number.
 *
 * @example
 * ```ts
 * median([1, 3, 2]); // 2
 * median([1, 2, 3, 4]); // 2.5
 * ```
 */
export function median(values: readonly number[]): number { return percentile(values, 0.5) }
/**
 * Returns the population variance of a set of numbers.
 *
 * Population variance.
 *
 * @param values - The numbers to inspect. Must contain at least one finite number.
 * @returns The average squared distance from the mean.
 * @throws {RangeError} When the array is empty or contains a non-finite number.
 *
 * @example
 * ```ts
 * variance([2, 4, 4, 4, 5, 5, 7, 9]); // 4
 * ```
 */
export function variance(values: readonly number[]): number {
  if (!values.length || values.some(value => !Number.isFinite(value))) throw new RangeError('values must contain at least one finite number')
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length
  return values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length
}
/**
 * Returns the value at a given percentile using linear interpolation.
 *
 * Linear interpolation percentile where p is in [0, 1].
 *
 * @param values - The numbers to inspect. Must contain at least one finite number.
 * @param p - The percentile to look up, from `0` to `1`.
 * @returns The interpolated value at position `p` of the sorted data.
 * @throws {RangeError} When `p` is outside `[0, 1]`, or the array is empty or contains a non-finite number.
 *
 * @example
 * ```ts
 * percentile([1, 2, 3, 4], 0.5); // 2.5
 * percentile([1, 2, 3, 4], 0.25); // 1.75
 * ```
 */
export function percentile(values: readonly number[], p: number): number {
  if (!Number.isFinite(p) || p < 0 || p > 1) throw new RangeError('p must be between 0 and 1')
  const data = sorted(values), index = (data.length - 1) * p, lower = Math.floor(index), fraction = index - lower
  return data[lower] + (data[Math.min(lower + 1, data.length - 1)] - data[lower]) * fraction
}
