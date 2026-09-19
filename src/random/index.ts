function unit(random: () => number): number {
  const value = random()
  if (!Number.isFinite(value) || value < 0 || value >= 1) throw new RangeError('random must return a finite value in [0, 1)')
  return value
}

/** Returns an integer in the inclusive range [min, max]. */
export function randomInt(min: number, max: number, random = Math.random): number {
  if (!Number.isSafeInteger(min) || !Number.isSafeInteger(max) || min > max) throw new RangeError('Expected safe integers with min <= max')
  const range = max - min + 1
  if (!Number.isSafeInteger(range)) throw new RangeError('Range is too large')
  return min + Math.floor(unit(random) * range)
}

export function shuffle<T>(values: readonly T[], random = Math.random): T[] {
  const result = values.slice()
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomInt(0, i, random)
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export function sample<T>(values: readonly T[], random = Math.random): T | undefined {
  return values.length ? values[randomInt(0, values.length - 1, random)] : undefined
}

/** Generates an RFC 4122 version 4 UUID with cryptographically secure browser randomness. */
export function uuid(): string {
  if (typeof crypto === 'undefined' || typeof crypto.getRandomValues !== 'function') throw new Error('Secure crypto.getRandomValues is unavailable')
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}
