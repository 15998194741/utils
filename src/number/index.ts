function validateRange(min: number, max: number): void {
  if (Number.isNaN(min) || Number.isNaN(max) || min > max) throw new RangeError('Expected min <= max and non-NaN bounds')
}
export function clamp(value: number, min: number, max: number): number {
  validateRange(min, max)
  return Math.min(max, Math.max(min, value))
}
/** Inclusive at both ends. */
export function inRange(value: number, min: number, max: number): boolean {
  validateRange(min, max)
  return value >= min && value <= max
}
export function sum(values: readonly number[]): number { return values.reduce((total, value) => total + value, 0) }
/** Empty input returns NaN. Uses ordinary JavaScript floating-point arithmetic. */
export function average(values: readonly number[]): number { return values.length ? sum(values) / values.length : NaN }
