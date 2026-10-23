function validateDelay(delay: number): void {
  if (!Number.isFinite(delay) || delay < 0 || delay > 2147483647) throw new RangeError('delay must be between 0 and 2147483647 ms')
}

/**
 * Waits for the given number of milliseconds.
 *
 * @param delay - The time to wait in milliseconds. Must be between 0 and 2147483647.
 * @returns A promise that resolves after the delay.
 * @throws {RangeError} When `delay` is outside the allowed range.
 *
 * @example
 * ```ts
 * await sleep(100); // resolves after 100 ms
 * ```
 */
export function sleep(delay: number): Promise<void> {
  validateDelay(delay)
  return new Promise(resolve => setTimeout(resolve, delay))
}

/**
 * Options for {@link retry}.
 */
export interface RetryOptions {
  /** Additional attempts after the first failure. Default: 3. */
  retries?: number
  delay?: number
  /** Multiplier applied to the delay after each failed attempt. Default: 1 (constant delay). */
  backoff?: number
  /** Upper bound in milliseconds for a single wait. Default: unlimited. */
  maxDelay?: number
}

/**
 * Runs a task and retries it until it succeeds.
 *
 * @param task - The work to run. It receives the 1-based attempt number.
 * @param options - The retry settings. `retries` counts additional attempts after the first
 * failure (default 3); `delay` is the pause between attempts in milliseconds (default 0).
 * `backoff` multiplies the pause after every failure (default 1) and `maxDelay` caps a single
 * pause in milliseconds (default unlimited).
 * @returns The value produced by the first successful attempt.
 * @throws {RangeError} When `retries` is not a non-negative integer or `delay` is out of range.
 * @throws {RangeError} When `backoff` is not a finite number of at least 1, or `maxDelay` is not a
 * finite non-negative number.
 * @throws The error from the last attempt when every attempt fails.
 *
 * @example
 * ```ts
 * const data = await retry(async attempt => {
 *   const response = await fetch(url)
 *   if (!response.ok) throw new Error(`failed on attempt ${attempt}`)
 *   return response.json()
 * });
 * ```
 *
 * @example
 * ```ts
 * await retry(() => save(), { retries: 5, delay: 100, backoff: 2 }); // waits 100, 200, 400, 800 ms
 * ```
 */
export async function retry<T>(task: (attempt: number) => T | PromiseLike<T>, options: RetryOptions = {}): Promise<T> {
  const { retries = 3, delay = 0, backoff = 1, maxDelay } = options
  if (!Number.isInteger(retries) || retries < 0) throw new RangeError('retries must be a non-negative integer')
  validateDelay(delay)
  if (!Number.isFinite(backoff) || backoff < 1) throw new RangeError('backoff must be a finite number of at least 1')
  if (maxDelay !== undefined && (!Number.isFinite(maxDelay) || maxDelay < 0)) {
    throw new RangeError('maxDelay must be a finite non-negative number')
  }
  let failures = 0
  for (let attempt = 1; ; attempt++) {
    try { return await task(attempt) } catch (error) {
      if (attempt > retries) throw error
      let wait = delay * Math.pow(backoff, failures)
      if (maxDelay !== undefined) wait = Math.min(wait, maxDelay)
      await sleep(wait)
      failures++
    }
  }
}

/**
 * Rejects a promise that takes too long to settle.
 *
 * Timeout rejects the wrapper; it does not cancel the underlying operation.
 *
 * @param promise - The promise to guard.
 * @param delay - The timeout in milliseconds. Must be between 0 and 2147483647.
 * @returns A promise resolving with the original value, or rejecting with a timeout error.
 * @throws {RangeError} When `delay` is outside the allowed range.
 *
 * @example
 * ```ts
 * await withTimeout(fetch(url), 5000);
 * ```
 */
export function withTimeout<T>(promise: PromiseLike<T>, delay: number): Promise<T> {
  validateDelay(delay)
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Operation timed out after ${delay} ms`)), delay)
    Promise.resolve(promise).then(value => { clearTimeout(timer); resolve(value) }, error => { clearTimeout(timer); reject(error) })
  })
}

/**
 * Maps values concurrently while capping how many run at once.
 *
 * Preserves result order; on failure stops scheduling new work. In-flight work continues.
 *
 * @param values - The source array. It is not modified.
 * @param limit - The maximum number of concurrent mappers. Must be a positive integer.
 * @param mapper - The per-value work, receiving the value and its index.
 * @returns A promise of the mapped values, in input order.
 * @throws {RangeError} When `limit` is not a positive integer.
 *
 * @example
 * ```ts
 * await mapLimit([1, 2, 3], 2, async value => value * 2); // [2, 4, 6]
 * ```
 */
export async function mapLimit<T, R>(values: readonly T[], limit: number, mapper: (value: T, index: number) => R | PromiseLike<R>): Promise<R[]> {
  if (!Number.isInteger(limit) || limit <= 0) throw new RangeError('limit must be a positive integer')
  const result = new Array<R>(values.length)
  let next = 0
  let failed = false
  async function worker() {
    while (!failed && next < values.length) {
      const index = next++
      try { result[index] = await mapper(values[index], index) }
      catch (error) { failed = true; throw error }
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, values.length) }, worker))
  return result
}
