import { sleep } from '../async'
/**
 * Options for {@link poll}.
 */
export interface PollOptions<T> { interval?: number; timeout?: number; signal?: AbortSignal; isDone?: (value:T)=>boolean }
/**
 * Repeats a task until it reports a final value.
 *
 * @param task - The work to run on every attempt.
 * @param options - The polling settings. `interval` is the pause between attempts in milliseconds
 * (default 1000); `timeout` is the overall budget in milliseconds (default 30000); `signal` aborts
 * the poll; `isDone` decides whether a result is final (default: the result is truthy).
 * @returns The first value accepted by `isDone`.
 * @throws {RangeError} When `interval` or `timeout` is not a non-negative finite number.
 * @throws {Error} When the timeout elapses or the signal is aborted.
 */
export async function poll<T>(task:()=>T|PromiseLike<T>,options:PollOptions<T>={}):Promise<T>{
  const {interval=1000,timeout=30000,signal,isDone=value=>Boolean(value)}=options
  if(!Number.isFinite(interval)||interval<0||!Number.isFinite(timeout)||timeout<0)throw new RangeError('interval and timeout must be non-negative finite numbers')
  const started=Date.now()
  for(;;){if(signal?.aborted)throw signal.reason??new Error('Polling aborted');const value=await task();if(isDone(value))return value;if(Date.now()-started>=timeout)throw new Error(`Polling timed out after ${timeout} ms`);await sleep(Math.min(interval,Math.max(0,timeout-(Date.now()-started))))}
}
/**
 * Waits until a condition becomes true.
 *
 * @param predicate - The condition to check on every attempt.
 * @param options - The polling settings, minus `isDone`. See {@link poll}.
 * @returns A promise that resolves with `true` once the predicate returns `true`.
 * @throws {RangeError} When `interval` or `timeout` is not a non-negative finite number.
 * @throws {Error} When the timeout elapses or the signal is aborted.
 *
 * @example
 * ```ts
 * await waitUntil(() => document.readyState === 'complete');
 * ```
 */
export function waitUntil(predicate:()=>boolean|PromiseLike<boolean>,options:Omit<PollOptions<boolean>,'isDone'>={}):Promise<boolean>{return poll<boolean>(predicate,{...options,isDone:value=>value})}
