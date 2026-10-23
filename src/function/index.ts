type AnyFunction = (this: any, ...args: any[]) => any
/**
 * A debounced or throttled function with manual controls.
 *
 * `cancel()` drops any pending invocation; `flush()` runs it right away and returns its result.
 */
export type ControlledFunction<F extends AnyFunction> = {
  (this: ThisParameterType<F>, ...args: Parameters<F>): void
  cancel(): void
  flush(): ReturnType<F> | undefined
}

function validateDelay(delay: number): void {
  if (!Number.isFinite(delay) || delay < 0 || delay > 2147483647) throw new RangeError('delay must be between 0 and 2147483647 ms')
}

/**
 * Options for {@link debounce}.
 */
export interface DebounceOptions {
  /** Invoke on the leading edge of the burst instead of waiting. Default: false. */
  leading?: boolean
  /** Maximum time in milliseconds the function may be deferred during a burst. Default: unlimited. */
  maxWait?: number
}

/**
 * Wraps a function so it runs only after the calls stop for the given delay.
 *
 * Trailing debounce; the latest call supplies arguments and this.
 *
 * @param fn - The function to debounce.
 * @param delay - The quiet period in milliseconds. Must be between 0 and 2147483647.
 * @param options - The debounce settings. `leading` runs the function on the first call of a
 * burst (default false); `maxWait` caps how long a call may be deferred during a burst, in
 * milliseconds (default unlimited).
 * @returns The debounced function, with `cancel()` and `flush()` controls.
 * @throws {RangeError} When `delay` is outside the allowed range.
 * @throws {RangeError} When `maxWait` is not a finite positive number.
 *
 * @example
 * ```ts
 * const save = debounce(() => console.log('saved'), 300);
 * save(); // logs 'saved' once, 300 ms later
 * ```
 *
 * @example
 * ```ts
 * const track = debounce(() => console.log('tracked'), 300, { leading: true });
 * track(); // logs 'tracked' right away
 * ```
 */
export function debounce<F extends AnyFunction>(fn: F, delay: number, options?: DebounceOptions): ControlledFunction<F> {
  validateDelay(delay)
  const leading = options?.leading ?? false
  const maxWait = options?.maxWait
  if (maxWait !== undefined && (!Number.isFinite(maxWait) || maxWait <= 0)) {
    throw new RangeError('maxWait must be a finite positive number')
  }
  // A timer cannot represent a delay above 2^31-1 ms, so the ceiling is applied once.
  const maxDelay = maxWait === undefined ? undefined : Math.min(maxWait, 2147483647)
  let timer: ReturnType<typeof setTimeout> | undefined
  let maxTimer: ReturnType<typeof setTimeout> | undefined
  let pending: Parameters<F> | undefined
  let context: ThisParameterType<F>
  let bursting = false
  let leadingInvoked = false
  let burstStart = 0
  let lastInvoke = 0
  const clearTimer = () => {
    if (timer !== undefined) clearTimeout(timer)
    timer = undefined
  }
  const clearMaxTimer = () => {
    if (maxTimer !== undefined) clearTimeout(maxTimer)
    maxTimer = undefined
  }
  const invoke = (): ReturnType<F> | undefined => {
    if (!pending) return undefined
    const args = pending
    pending = undefined
    lastInvoke = Date.now()
    return fn.apply(context, args)
  }
  // A burst ends once the quiet period elapses, so the next call opens a new one.
  const endBurst = () => {
    bursting = false
    leadingInvoked = false
    clearMaxTimer()
  }
  // The moment a deferred call has to run: the burst start, or the previous invocation.
  const deadline = () => Math.max(burstStart, lastInvoke) + (maxDelay || 0)
  const armMax = () => {
    clearMaxTimer()
    const remaining = deadline() - Date.now()
    if (remaining > 0) maxTimer = setTimeout(onMaxWait, remaining)
  }
  const onQuiet = () => {
    timer = undefined
    invoke()
    endBurst()
  }
  const onMaxWait = () => {
    maxTimer = undefined
    if (!bursting) return
    if (pending) invoke()
    armMax()
  }
  const wrapped = function(this: ThisParameterType<F>, ...args: Parameters<F>) {
    const now = Date.now()
    context = this
    if (!bursting) {
      bursting = true
      leadingInvoked = false
      burstStart = now
      lastInvoke = 0
    }
    if (leading && !leadingInvoked) {
      leadingInvoked = true
      pending = args
      invoke()
      clearTimer()
      timer = setTimeout(onQuiet, delay)
      armMax()
      return
    }
    pending = args
    if (maxDelay !== undefined) {
      const remaining = deadline() - now
      if (remaining <= 0) {
        // The deadline already passed, so the call cannot be deferred any longer.
        invoke()
        clearTimer()
        timer = setTimeout(onQuiet, delay)
        armMax()
        return
      }
      if (maxTimer === undefined) maxTimer = setTimeout(onMaxWait, remaining)
    }
    clearTimer()
    timer = setTimeout(onQuiet, delay)
  } as ControlledFunction<F>
  wrapped.cancel = () => { clearTimer(); pending = undefined; endBurst() }
  wrapped.flush = () => { clearTimer(); const result = invoke(); endBurst(); return result }
  return wrapped
}

/**
 * Options for {@link throttle}.
 */
export interface ThrottleOptions {
  /** Invoke on the leading edge of the window. Default: true. */
  leading?: boolean
}

/**
 * Wraps a function so it runs at most once per delay window.
 *
 * Leading and trailing throttle, using the latest pending arguments.
 *
 * @param fn - The function to throttle.
 * @param delay - The window length in milliseconds. Must be between 0 and 2147483647.
 * @param options - The throttle settings. `leading` runs the function at the start of the window
 * (default true); with `leading` false the function only runs at the end of the window.
 * @returns The throttled function, with `cancel()` and `flush()` controls.
 * @throws {RangeError} When `delay` is outside the allowed range.
 *
 * @example
 * ```ts
 * const track = throttle(() => console.log('tracked'), 300);
 * track(); // runs immediately; further calls within 300 ms are deferred to one trailing run
 * ```
 *
 * @example
 * ```ts
 * const report = throttle(() => console.log('reported'), 300, { leading: false });
 * report(); // runs once, 300 ms later
 * ```
 */
export function throttle<F extends AnyFunction>(fn: F, delay: number, options?: ThrottleOptions): ControlledFunction<F> {
  validateDelay(delay)
  const leading = options?.leading ?? true
  let timer: ReturnType<typeof setTimeout> | undefined
  let pending: Parameters<F> | undefined
  let context: ThisParameterType<F>
  const tick = () => {
    timer = undefined
    if (pending) {
      const args = pending
      pending = undefined
      timer = setTimeout(tick, delay)
      fn.apply(context, args)
    }
  }
  const wrapped = function(this: ThisParameterType<F>, ...args: Parameters<F>) {
    if (timer === undefined) {
      timer = setTimeout(tick, delay)
      if (leading) fn.apply(this, args)
      else { pending = args; context = this }
    } else { pending = args; context = this }
  } as ControlledFunction<F>
  wrapped.cancel = () => { if (timer !== undefined) clearTimeout(timer); timer = undefined; pending = undefined }
  wrapped.flush = () => {
    if (!pending) return undefined
    const args = pending
    pending = undefined
    return fn.apply(context, args)
  }
  return wrapped
}

/**
 * Wraps a function so it runs only the first time it is called.
 *
 * Caches the first successful return value, including a returned Promise.
 *
 * @param fn - The function to wrap.
 * @returns A function that returns the first result on every call.
 *
 * @example
 * ```ts
 * const init = once(() => ({ ready: true }));
 * init() === init(); // true
 * ```
 */
export function once<F extends AnyFunction>(fn: F): (this: ThisParameterType<F>, ...args: Parameters<F>) => ReturnType<F> {
  let called = false
  let result: ReturnType<F>
  return function(this: ThisParameterType<F>, ...args: Parameters<F>) {
    if (!called) { result = fn.apply(this, args); called = true }
    return result
  }
}

/**
 * Combines functions into one, applied from right to left.
 *
 * `compose(f, g)(value)` is `f(g(value))`. Without functions the result is the identity.
 *
 * @param fns - The functions to compose, from the last one that runs to the first one.
 * @returns A function that applies every function in reverse order.
 *
 * @example
 * ```ts
 * const shout = compose((text: string) => text.toUpperCase(), (text: string) => `${text}!`);
 * shout('hi'); // 'HI!'
 * ```
 */
export function compose<T = any>(...fns: Array<(value: any) => any>): (value: any) => T {
  return (value: any) => fns.reduceRight((accumulator, fn) => fn(accumulator), value) as T
}

/**
 * Combines functions into one, applied from left to right.
 *
 * `pipe(f, g)(value)` is `g(f(value))`. Without functions the result is the identity.
 *
 * @param fns - The functions to pipe, from the first one that runs to the last one.
 * @returns A function that applies every function in order.
 *
 * @example
 * ```ts
 * const trim = (text: string) => text.trim();
 * const upper = (text: string) => text.toUpperCase();
 * pipe(trim, upper)('  hi  '); // 'HI'
 * ```
 */
export function pipe<T = any>(...fns: Array<(value: any) => any>): (value: any) => T {
  return (value: any) => fns.reduce((accumulator, fn) => fn(accumulator), value) as T
}

/**
 * Turns a function into a curried function that collects its arguments over several calls.
 *
 * The wrapped function runs once the collected arguments reach the arity; every call returns a
 * new function until then, and the original function is never modified.
 *
 * @param fn - The function to curry.
 * @param arity - The number of arguments the function needs. Defaults to `fn.length`, and to 1
 * when the function declares no parameter.
 * @returns A function that takes the arguments one call at a time and returns the result of the
 * original function once the arity is reached.
 * @throws {RangeError} When `arity` is not a positive integer.
 *
 * @example
 * ```ts
 * const add = (a: number, b: number) => a + b;
 * const addCurried = curry(add);
 * addCurried(1)(2); // 3
 * ```
 */
export function curry<F extends (...args: any[]) => any>(fn: F, arity?: number): (...args: any[]) => any {
  if (arity !== undefined && (!Number.isInteger(arity) || arity <= 0)) {
    throw new RangeError('arity must be a positive integer')
  }
  const size = arity === undefined ? fn.length || 1 : arity
  const collect = (collected: any[]): ((...args: any[]) => any) => function(this: any, ...args: any[]) {
    const all = collected.concat(args)
    if (all.length >= size) return (fn as (...values: any[]) => any).apply(this, all)
    return collect(all)
  }
  return collect([])
}
