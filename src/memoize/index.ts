type AnyFunction = (this:any,...args:any[])=>any
const value = Symbol('memoized-value')
export function memoize<F extends AnyFunction>(fn:F): F & { clear():void } {
  let root = new Map<any,any>()
  const wrapped=function(this:ThisParameterType<F>,...args:Parameters<F>){ let node=root; for(const arg of args){if(!node.has(arg))node.set(arg,new Map());node=node.get(arg)} if(!node.has(value))node.set(value,fn.apply(this,args));return node.get(value) } as F & {clear():void}
  wrapped.clear=()=>{root=new Map()}; return wrapped
}
export function memoizeAsync<F extends AnyFunction>(fn:F): F & { clear():void } {
  let root=new Map<any,any>()
  const wrapped=function(this:ThisParameterType<F>,...args:Parameters<F>){let node=root;for(const arg of args){if(!node.has(arg))node.set(arg,new Map());node=node.get(arg)}if(!node.has(value)){const promise=Promise.resolve(fn.apply(this,args));node.set(value,promise);promise.catch(()=>node.delete(value))}return node.get(value)} as F & {clear():void}
  wrapped.clear=()=>{root=new Map()};return wrapped
}
