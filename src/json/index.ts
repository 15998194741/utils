export type JsonParseResult<T> = { ok: true; value: T } | { ok: false; error: SyntaxError }

export function safeJsonParse<T = unknown>(text: string): JsonParseResult<T> {
  try { return { ok: true, value: JSON.parse(text) as T } }
  catch (error) { return { ok: false, error: error instanceof SyntaxError ? error : new SyntaxError(String(error)) } }
}

/** Deterministic JSON for plain data. Object keys are sorted; arrays retain order. */
export function stableStringify(value: unknown, space?: string | number): string | undefined {
  const active = new WeakSet<object>()
  function normalize(input: any): any {
    if (input === null || typeof input !== 'object') return input
    if (active.has(input)) throw new TypeError('Cannot stringify cyclic data')
    active.add(input)
    let result: any
    if (Array.isArray(input)) result = input.map(normalize)
    else {
      result = Object.create(null)
      for (const key of Object.keys(input).sort()) result[key] = normalize(input[key])
    }
    active.delete(input)
    return result
  }
  return JSON.stringify(normalize(value), null, space)
}
