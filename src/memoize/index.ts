type AnyFunction = (this:any,...args:any[])=>any
const value = Symbol('memoized-value')
/**
 * Caches the result of a function by its arguments.
 *
 * The cache is keyed on argument identity, so objects and functions are compared by reference.
 *
 * @param fn - The function to memoize.
 * @returns The wrapped function, with an extra `clear()` method that empties the cache.
 *
 * @example
 * ```ts
 * const add = memoize((a: number, b: number) => a + b);
 * add(1, 2); // 3
 * add.clear();
 * ```
 */
export function memoize<F extends AnyFunction>(fn:F): F & { clear():void } {
  let root = new Map<any,any>()
  const wrapped=function(this:ThisParameterType<F>,...args:Parameters<F>){ let node=root; for(const arg of args){if(!node.has(arg))node.set(arg,new Map());node=node.get(arg)} if(!node.has(value))node.set(value,fn.apply(this,args));return node.get(value) } as F & {clear():void}
  wrapped.clear=()=>{root=new Map()}; return wrapped
}
/**
 * Caches the promise returned by an asynchronous function by its arguments.
 *
 * The cache is keyed on argument identity. A rejected promise is evicted, so the next
 * call retries.
 *
 * @param fn - The function to memoize.
 * @returns The wrapped function, with an extra `clear()` method that empties the cache.
 *
 * @example
 * ```ts
 * const load = memoizeAsync(async (id: string) => id);
 * await load('a'); // 'a'
 * load.clear();
 * ```
 */
export function memoizeAsync<F extends AnyFunction>(fn:F): F & { clear():void } {
  let root=new Map<any,any>()
  const wrapped=function(this:ThisParameterType<F>,...args:Parameters<F>){let node=root;for(const arg of args){if(!node.has(arg))node.set(arg,new Map());node=node.get(arg)}if(!node.has(value)){const promise=Promise.resolve(fn.apply(this,args));node.set(value,promise);promise.catch(()=>node.delete(value))}return node.get(value)} as F & {clear():void}
  wrapped.clear=()=>{root=new Map()};return wrapped
}
