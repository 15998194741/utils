/**
 * The outcome of an operation that may fail.
 *
 * A successful result carries the value; a failed result carries the error.
 */
export type Result<T,E=unknown>={ok:true;value:T}|{ok:false;error:E}
/**
 * Runs a synchronous task and captures its result instead of throwing.
 *
 * @param task - The function to run.
 * @returns `{ ok: true, value }` on success, or `{ ok: false, error }` when the task throws.
 *
 * @example
 * ```ts
 * tryCatch(() => 42); // { ok: true, value: 42 }
 * ```
 */
export function tryCatch<T,E=unknown>(task:()=>T):Result<T,E>{try{return{ok:true,value:task()}}catch(error){return{ok:false,error:error as E}}}
/**
 * Runs an asynchronous task and captures its result instead of rejecting.
 *
 * @param task - The function or promise to await.
 * @returns A promise of `{ ok: true, value }`, or of `{ ok: false, error }` when the task throws.
 *
 * @example
 * ```ts
 * await tryCatchAsync(async () => 42); // { ok: true, value: 42 }
 * ```
 */
export async function tryCatchAsync<T,E=unknown>(task:()=>T|PromiseLike<T>):Promise<Result<T,E>>{try{return{ok:true,value:await task()}}catch(error){return{ok:false,error:error as E}}}
