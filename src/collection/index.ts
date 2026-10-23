/**
 * Indexes the values by the result of the key function.
 *
 * @param values - The source array. It is not modified.
 * @param key - Derives the key for each value.
 * @returns A map from key to value; later values with the same key overwrite earlier ones.
 *
 * @example
 * ```ts
 * keyBy([{ id: 'a' }, { id: 'b' }], value => value.id); // Map { 'a' => { id: 'a' }, 'b' => { id: 'b' } }
 * ```
 */
export function keyBy<T, K>(values: readonly T[], key: (value: T) => K): Map<K, T> { const result = new Map<K,T>(); for (const value of values) result.set(key(value), value); return result }
/**
 * Counts how many values share the same key.
 *
 * @param values - The source array. It is not modified.
 * @param key - Derives the key for each value.
 * @returns A map from key to the number of values that produced it.
 *
 * @example
 * ```ts
 * countBy([1, 2, 3, 4], value => (value % 2 === 0 ? 'even' : 'odd')); // Map { 'odd' => 2, 'even' => 2 }
 * ```
 */
export function countBy<T, K>(values: readonly T[], key: (value: T) => K): Map<K, number> { const result = new Map<K,number>(); for (const value of values) { const k=key(value); result.set(k,(result.get(k) ?? 0)+1) } return result }
/**
 * Splits the values into the ones matching the predicate and the ones that do not.
 *
 * @param values - The source array. It is not modified.
 * @param predicate - Tested for each value, receiving the value and its index.
 * @returns A tuple of `[matching, notMatching]`, both in input order.
 *
 * @example
 * ```ts
 * partition([1, 2, 3, 4], value => value % 2 === 0); // [[2, 4], [1, 3]]
 * ```
 */
export function partition<T>(values: readonly T[], predicate: (value:T,index:number)=>boolean): [T[],T[]] { const yes:T[]=[], no:T[]=[]; values.forEach((value,index)=>(predicate(value,index)?yes:no).push(value)); return [yes,no] }
/**
 * Describes one sorting rule for {@link orderBy}.
 */
export interface Order<T> { iteratee: (value:T)=>unknown; direction?: 'asc'|'desc' }
/**
 * Sorts the values by one or more rules, applying each rule in turn.
 *
 * @param values - The source array. It is not modified.
 * @param orders - The rules to apply. Each rule contributes an iteratee and an optional direction
 * (`'asc'` by default).
 * @returns A new sorted array. Values that compare equal keep their original order.
 *
 * @example
 * ```ts
 * orderBy([{ n: 3 }, { n: 1 }, { n: 2 }], [{ iteratee: value => value.n, direction: 'desc' }]); // [{ n: 3 }, { n: 2 }, { n: 1 }]
 * ```
 */
export function orderBy<T>(values: readonly T[], orders: readonly Order<T>[]): T[] {
  return values.map((value,index)=>({value,index})).sort((a,b)=>{ for(const order of orders){ const left=order.iteratee(a.value) as any,right=order.iteratee(b.value) as any; if(left<right)return order.direction==='desc'?1:-1;if(left>right)return order.direction==='desc'?-1:1 } return a.index-b.index }).map(item=>item.value)
}
