function validateDelay(delay: number): void {
  if (!Number.isFinite(delay) || delay < 0 || delay > 2147483647) throw new RangeError('delay must be between 0 and 2147483647 ms')
}

export function sleep(delay: number): Promise<void> {
  validateDelay(delay)
  return new Promise(resolve => setTimeout(resolve, delay))
}

export interface RetryOptions {
  /** Additional attempts after the first failure. Default: 3. */
  retries?: number
  delay?: number
}

export async function retry<T>(task: (attempt: number) => T | PromiseLike<T>, options: RetryOptions = {}): Promise<T> {
  const { retries = 3, delay = 0 } = options
  if (!Number.isInteger(retries) || retries < 0) throw new RangeError('retries must be a non-negative integer')
  validateDelay(delay)
  for (let attempt = 1; ; attempt++) {
    try { return await task(attempt) } catch (error) {
      if (attempt > retries) throw error
      await sleep(delay)
    }
  }
}

/** Timeout rejects the wrapper; it does not cancel the underlying operation. */
export function withTimeout<T>(promise: PromiseLike<T>, delay: number): Promise<T> {
  validateDelay(delay)
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Operation timed out after ${delay} ms`)), delay)
    Promise.resolve(promise).then(value => { clearTimeout(timer); resolve(value) }, error => { clearTimeout(timer); reject(error) })
  })
}

/** Preserves result order; on failure stops scheduling new work. In-flight work continues. */
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
