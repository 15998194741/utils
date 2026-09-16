type AnyFunction = (this: any, ...args: any[]) => any
export type ControlledFunction<F extends AnyFunction> = {
  (this: ThisParameterType<F>, ...args: Parameters<F>): void
  cancel(): void
  flush(): ReturnType<F> | undefined
}

function validateDelay(delay: number): void {
  if (!Number.isFinite(delay) || delay < 0 || delay > 2147483647) throw new RangeError('delay must be between 0 and 2147483647 ms')
}

/** Trailing debounce; the latest call supplies arguments and this. */
export function debounce<F extends AnyFunction>(fn: F, delay: number): ControlledFunction<F> {
  validateDelay(delay)
  let timer: ReturnType<typeof setTimeout> | undefined
  let pending: Parameters<F> | undefined
  let context: ThisParameterType<F>
  const invoke = (): ReturnType<F> | undefined => {
    if (!pending) return undefined
    const args = pending
    pending = undefined
    timer = undefined
    return fn.apply(context, args)
  }
  const wrapped = function(this: ThisParameterType<F>, ...args: Parameters<F>) {
    if (timer !== undefined) clearTimeout(timer)
    pending = args
    context = this
    timer = setTimeout(invoke, delay)
  } as ControlledFunction<F>
  wrapped.cancel = () => { if (timer !== undefined) clearTimeout(timer); timer = undefined; pending = undefined }
  wrapped.flush = () => { if (timer !== undefined) clearTimeout(timer); return invoke() }
  return wrapped
}

/** Leading and trailing throttle, using the latest pending arguments. */
export function throttle<F extends AnyFunction>(fn: F, delay: number): ControlledFunction<F> {
  validateDelay(delay)
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
      fn.apply(this, args)
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

/** Caches the first successful return value, including a returned Promise. */
export function once<F extends AnyFunction>(fn: F): (this: ThisParameterType<F>, ...args: Parameters<F>) => ReturnType<F> {
  let called = false
  let result: ReturnType<F>
  return function(this: ThisParameterType<F>, ...args: Parameters<F>) {
    if (!called) { result = fn.apply(this, args); called = true }
    return result
  }
}
