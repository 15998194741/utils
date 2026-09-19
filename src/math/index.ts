function sorted(values: readonly number[]): number[] {
  if (!values.length) throw new RangeError('values must not be empty')
  if (values.some(value => !Number.isFinite(value))) throw new RangeError('values must contain only finite numbers')
  return values.slice().sort((a, b) => a - b)
}
export function median(values: readonly number[]): number { return percentile(values, 0.5) }
/** Population variance. */
export function variance(values: readonly number[]): number {
  if (!values.length || values.some(value => !Number.isFinite(value))) throw new RangeError('values must contain at least one finite number')
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length
  return values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length
}
/** Linear interpolation percentile where p is in [0, 1]. */
export function percentile(values: readonly number[], p: number): number {
  if (!Number.isFinite(p) || p < 0 || p > 1) throw new RangeError('p must be between 0 and 1')
  const data = sorted(values), index = (data.length - 1) * p, lower = Math.floor(index), fraction = index - lower
  return data[lower] + (data[Math.min(lower + 1, data.length - 1)] - data[lower]) * fraction
}
