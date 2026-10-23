import { deepClone } from '../utils/copy'
import { isEqual } from '../utils/equal'
/**
 * A single change that turns one object into another.
 *
 * `add` and `replace` carry the new `value`; `remove` deletes the key at `path`.
 * An empty `path` refers to the whole value.
 */
export type PatchOperation={op:'add'|'replace';path:PropertyKey[];value:any}|{op:'remove';path:PropertyKey[]}
const plain=(value:any)=>value!==null&&typeof value==='object'&&!Array.isArray(value)&&(Object.getPrototypeOf(value)===Object.prototype||Object.getPrototypeOf(value)===null)
/**
 * Computes the changes needed to turn one value into another.
 *
 * Plain objects are compared recursively; other values are compared as a whole.
 *
 * @param left - The original value.
 * @param right - The target value.
 * @returns The ordered list of operations that turn `left` into `right`.
 */
export function objectDiff(left:any,right:any):PatchOperation[]{const result:PatchOperation[]=[];function visit(a:any,b:any,path:PropertyKey[]){if(isEqual(a,b))return;if(plain(a)&&plain(b)){const keys=new Set([...Reflect.ownKeys(a),...Reflect.ownKeys(b)]);for(const key of keys){if(!Object.prototype.hasOwnProperty.call(b,key))result.push({op:'remove',path:[...path,key]});else if(!Object.prototype.hasOwnProperty.call(a,key))result.push({op:'add',path:[...path,key],value:deepClone(b[key])});else visit(a[key],b[key],[...path,key])}}else result.push({op:path.length?'replace':'replace',path,value:deepClone(b)})}visit(left,right,[]);return result}
/**
 * Applies a list of patch operations to a value.
 *
 * @param value - The value to patch. It is cloned, so the input is not modified.
 * @param operations - The operations to apply, in order.
 * @returns The patched value, or `undefined` when an operation removes the root.
 * @throws {TypeError} When a path does not exist in the value being patched.
 */
export function applyPatch<T>(value:T,operations:readonly PatchOperation[]):T|undefined{let root:any=deepClone(value);for(const operation of operations){if(!operation.path.length){if(operation.op==='remove')root=undefined;else root=deepClone(operation.value);continue}let target=root;for(let i=0;i<operation.path.length-1;i++){const key=operation.path[i];if(target===null||typeof target!=='object'||!Object.prototype.hasOwnProperty.call(target,key))throw new TypeError('Invalid patch path');target=target[key]}const key=operation.path[operation.path.length-1];if(operation.op==='remove'){if(Array.isArray(target)&&typeof key==='number')target.splice(key,1);else delete target[key]}else Object.defineProperty(target,key,{value:deepClone(operation.value),enumerable:true,writable:true,configurable:true})}return root}

/**
 * State shared by every key in one arrayDiff call.
 *
 * Identities are assigned on first sight, so the same object, symbol, or
 * prototype always produces the same identifier within a single call.
 */
type KeyContext={identities:WeakMap<object,number>;nextIdentity:number;symbols:Map<symbol,number>;nextSymbol:number}

const createContext=():KeyContext=>({identities:new WeakMap(),nextIdentity:0,symbols:new Map(),nextSymbol:0})

const identityKey=(value:object,context:KeyContext):string=>{
  let id=context.identities.get(value)
  if(id===undefined){id=context.nextIdentity++;context.identities.set(value,id)}
  return 'x'+id
}

const symbolKey=(value:symbol,context:KeyContext):string=>{
  let id=context.symbols.get(value)
  if(id===undefined){id=context.nextSymbol++;context.symbols.set(value,id)}
  return 'y'+id
}

/**
 * Builds a lookup key for a value.
 *
 * The key is consistent with {@link isEqual}: whenever isEqual reports two
 * values as equal, they produce the same key. That is what makes it usable
 * as a pre-filter, because a value only has to be compared in full against
 * the candidates that share its key.
 *
 * Values that isEqual only ever compares by identity, such as class
 * instances, functions, and symbols, get an identity based key. Cyclic
 * structures are handled with a back reference to their position on the
 * current path.
 */
const canonicalKey=(value:any,context:KeyContext,stack:object[]):string=>{
  const type=typeof value
  if(value===null)return 'z'
  if(type==='undefined')return 'u'
  if(type==='boolean')return 'b'+value
  if(type==='number')return 'd'+(Object.is(value,-0)?'-0':String(value))
  if(type==='string')return 's'+JSON.stringify(value)
  if(type==='bigint')return 'g'+value
  if(type==='symbol')return symbolKey(value,context)
  if(type==='function')return identityKey(value,context)
  if(type!=='object')return '?'+type
  const cycle=stack.indexOf(value)
  if(cycle>=0)return '@'+cycle
  const proto=Object.getPrototypeOf(value)
  if(value instanceof Date)return 'D'+identityKey(proto,context)+':'+value.getTime()
  if(value instanceof RegExp)return 'R'+identityKey(proto,context)+':'+value.source+'|'+value.flags+'|'+value.lastIndex
  if(Array.isArray(value)){
    stack.push(value)
    const parts:string[]=[]
    for(let index=0;index<value.length;index++)parts.push(canonicalKey(value[index],context,stack))
    stack.pop()
    return 'A['+parts.join(',')+']'
  }
  if(proto===Object.prototype||proto===null){
    stack.push(value)
    const parts:string[]=[]
    for(const key of Object.keys(value).sort())parts.push(JSON.stringify(key)+':'+canonicalKey(value[key],context,stack))
    stack.pop()
    return (proto===null?'N{':'O{')+parts.join(',')+'}'
  }
  return identityKey(value,context)
}

const buildIndex=<T>(values:readonly T[],context:KeyContext):Map<string,T[]>=>{
  const index=new Map<string,T[]>()
  for(const value of values){
    const key=canonicalKey(value,context,[])
    const bucket=index.get(key)
    if(bucket)bucket.push(value)
    else index.set(key,[value])
  }
  return index
}

const containsEqual=<T>(index:Map<string,T[]>,value:T,context:KeyContext):boolean=>{
  const candidates=index.get(canonicalKey(value,context,[]))
  if(!candidates)return false
  for(const candidate of candidates)if(isEqual(candidate,value))return true
  return false
}

/**
 * Compares two arrays and reports the entries that were added and removed.
 *
 * Entries are compared with {@link isEqual}, so nested objects are matched by value.
 *
 * @param left - The original array.
 * @param right - The target array.
 * @returns An object with the `added` and `removed` entries, in their original order.
 *
 * @example
 * ```ts
 * arrayDiff([1, 2], [2, 3]); // { added: [3], removed: [1] }
 * ```
 */
export function arrayDiff<T>(left:readonly T[],right:readonly T[]):{added:T[];removed:T[]}{
  // Comparing every entry of one side against every entry of the other side
  // costs O(n * m) deep comparisons, which does not survive a realistic list
  // of records. The lookup key narrows each entry down to the few candidates
  // that can still be equal to it, and isEqual stays the only judge.
  const context=createContext()
  const leftIndex=buildIndex(left,context)
  const rightIndex=buildIndex(right,context)
  return{added:right.filter(value=>!containsEqual(leftIndex,value,context)),removed:left.filter(value=>!containsEqual(rightIndex,value,context))}
}
