export function keyBy<T, K>(values: readonly T[], key: (value: T) => K): Map<K, T> { const result = new Map<K,T>(); for (const value of values) result.set(key(value), value); return result }
export function countBy<T, K>(values: readonly T[], key: (value: T) => K): Map<K, number> { const result = new Map<K,number>(); for (const value of values) { const k=key(value); result.set(k,(result.get(k) ?? 0)+1) } return result }
export function partition<T>(values: readonly T[], predicate: (value:T,index:number)=>boolean): [T[],T[]] { const yes:T[]=[], no:T[]=[]; values.forEach((value,index)=>(predicate(value,index)?yes:no).push(value)); return [yes,no] }
export interface Order<T> { iteratee: (value:T)=>unknown; direction?: 'asc'|'desc' }
export function orderBy<T>(values: readonly T[], orders: readonly Order<T>[]): T[] {
  return values.map((value,index)=>({value,index})).sort((a,b)=>{ for(const order of orders){ const left=order.iteratee(a.value) as any,right=order.iteratee(b.value) as any; if(left<right)return order.direction==='desc'?1:-1;if(left>right)return order.direction==='desc'?-1:1 } return a.index-b.index }).map(item=>item.value)
}
