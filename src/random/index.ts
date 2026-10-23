function unit(random: () => number): number {
  const value = random()
  if (!Number.isFinite(value) || value < 0 || value >= 1) throw new RangeError('random must return a finite value in [0, 1)')
  return value
}

/**
 * Returns an integer in the inclusive range [min, max].
 *
 * @param min - The lower bound. Must be a safe integer.
 * @param max - The upper bound. Must be a safe integer and not below `min`.
 * @param random - The randomness source. Default: `Math.random`. Must return a value in `[0, 1)`.
 * @returns A random integer between `min` and `max`.
 * @throws {RangeError} When the bounds are not safe integers, `min > max`, the range is too large,
 * or `random` returns a value outside `[0, 1)`.
 *
 * @example
 * ```ts
 * randomInt(1, 10); // an integer between 1 and 10
 * randomInt(1, 10, () => 0.5); // 6
 * ```
 */
export function randomInt(min: number, max: number, random = Math.random): number {
  if (!Number.isSafeInteger(min) || !Number.isSafeInteger(max) || min > max) throw new RangeError('Expected safe integers with min <= max')
  const range = max - min + 1
  if (!Number.isSafeInteger(range)) throw new RangeError('Range is too large')
  return min + Math.floor(unit(random) * range)
}

/**
 * Returns a shuffled copy of the values.
 *
 * @param values - The source array. It is not modified.
 * @param random - The randomness source. Default: `Math.random`. Must return a value in `[0, 1)`.
 * @returns A new array with the values in random order.
 * @throws {RangeError} When `random` returns a value outside `[0, 1)`.
 *
 * @example
 * ```ts
 * shuffle([1, 2, 3]); // e.g. [2, 3, 1]
 * shuffle([1, 2, 3], () => 0); // [2, 3, 1]
 * ```
 */
export function shuffle<T>(values: readonly T[], random = Math.random): T[] {
  const result = values.slice()
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomInt(0, i, random)
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/**
 * Picks one value at random from the array.
 *
 * @param values - The source array. It is not modified.
 * @param random - The randomness source. Default: `Math.random`. Must return a value in `[0, 1)`.
 * @returns A randomly selected value, or `undefined` when the array is empty.
 * @throws {RangeError} When `random` returns a value outside `[0, 1)`.
 *
 * @example
 * ```ts
 * sample([1, 2, 3]); // one of 1, 2, 3
 * sample([]); // undefined
 * ```
 */
export function sample<T>(values: readonly T[], random = Math.random): T | undefined {
  return values.length ? values[randomInt(0, values.length - 1, random)] : undefined
}

/**
 * Generates a random UUID.
 *
 * Generates an RFC 4122 version 4 UUID with cryptographically secure browser randomness.
 *
 * @returns A UUID string in the canonical `8-4-4-4-12` form.
 * @throws {Error} When `crypto.getRandomValues` is unavailable.
 *
 * @example
 * ```ts
 * uuid(); // e.g. 'ab4c11ef-e8cc-4584-b2fd-8b8cda2d8ee2'
 * ```
 */
export function uuid(): string {
  if (typeof crypto === 'undefined' || typeof crypto.getRandomValues !== 'function') throw new Error('Secure crypto.getRandomValues is unavailable')
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}
