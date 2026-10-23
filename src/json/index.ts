/**
 * The outcome of a {@link safeJsonParse} call.
 *
 * A successful result carries the parsed value; a failed result carries the `SyntaxError`.
 */
export type JsonParseResult<T> = { ok: true; value: T } | { ok: false; error: SyntaxError }

/**
 * Parses a JSON string without throwing.
 *
 * @param text - The JSON text to parse.
 * @returns `{ ok: true, value }` on success, or `{ ok: false, error }` when the text is malformed.
 *
 * @example
 * ```ts
 * safeJsonParse('{"a":1}'); // { ok: true, value: { a: 1 } }
 * safeJsonParse('oops').ok; // false
 * ```
 */
export function safeJsonParse<T = unknown>(text: string): JsonParseResult<T> {
  try { return { ok: true, value: JSON.parse(text) as T } }
  catch (error) { return { ok: false, error: error instanceof SyntaxError ? error : new SyntaxError(String(error)) } }
}

/**
 * Serializes a value to JSON with deterministic key ordering.
 *
 * Deterministic JSON for plain data. Object keys are sorted; arrays retain order.
 *
 * @param value - The value to serialize.
 * @param space - Passed to `JSON.stringify` to control indentation.
 * @returns The JSON text, or `undefined` when the value cannot be represented in JSON.
 * @throws {TypeError} When the value contains a cycle.
 *
 * @example
 * ```ts
 * stableStringify({ b: 1, a: 2 }); // '{"a":2,"b":1}'
 * ```
 */
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
