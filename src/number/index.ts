function validateRange(min: number, max: number): void {
  if (Number.isNaN(min) || Number.isNaN(max) || min > max) throw new RangeError('Expected min <= max and non-NaN bounds')
}
/**
 * Restricts a number to the inclusive range between min and max.
 *
 * @param value - The number to restrict.
 * @param min - The lower bound.
 * @param max - The upper bound.
 * @returns `value` clamped into the range; the bound itself when the value is outside.
 * @throws {RangeError} When a bound is `NaN` or `min` is greater than `max`.
 *
 * @example
 * ```ts
 * clamp(15, 0, 10); // 10
 * clamp(-5, 0, 10); // 0
 * ```
 */
export function clamp(value: number, min: number, max: number): number {
  validateRange(min, max)
  return Math.min(max, Math.max(min, value))
}
/**
 * Reports whether a number falls inside a range, including both endpoints.
 *
 * Inclusive at both ends.
 *
 * @param value - The number to test.
 * @param min - The lower bound.
 * @param max - The upper bound.
 * @returns `true` when `min <= value <= max`.
 * @throws {RangeError} When a bound is `NaN` or `min` is greater than `max`.
 *
 * @example
 * ```ts
 * inRange(5, 1, 10); // true
 * inRange(11, 1, 10); // false
 * ```
 */
export function inRange(value: number, min: number, max: number): boolean {
  validateRange(min, max)
  return value >= min && value <= max
}
/**
 * Adds up all numbers in an array.
 *
 * @param values - The numbers to add.
 * @returns The total; `0` for an empty array.
 *
 * @example
 * ```ts
 * sum([1, 2, 3]); // 6
 * ```
 */
export function sum(values: readonly number[]): number { return values.reduce((total, value) => total + value, 0) }
/**
 * Returns the arithmetic mean of an array of numbers.
 *
 * Empty input returns NaN. Uses ordinary JavaScript floating-point arithmetic.
 *
 * @param values - The numbers to average.
 * @returns The mean of the values, or `NaN` for an empty array.
 *
 * @example
 * ```ts
 * average([1, 2, 3]); // 2
 * ```
 */
export function average(values: readonly number[]): number { return values.length ? sum(values) / values.length : NaN }
