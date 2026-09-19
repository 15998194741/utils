import { sleep } from '../async'
export interface PollOptions<T> { interval?: number; timeout?: number; signal?: AbortSignal; isDone?: (value:T)=>boolean }
export async function poll<T>(task:()=>T|PromiseLike<T>,options:PollOptions<T>={}):Promise<T>{
  const {interval=1000,timeout=30000,signal,isDone=value=>Boolean(value)}=options
  if(!Number.isFinite(interval)||interval<0||!Number.isFinite(timeout)||timeout<0)throw new RangeError('interval and timeout must be non-negative finite numbers')
  const started=Date.now()
  for(;;){if(signal?.aborted)throw signal.reason??new Error('Polling aborted');const value=await task();if(isDone(value))return value;if(Date.now()-started>=timeout)throw new Error(`Polling timed out after ${timeout} ms`);await sleep(Math.min(interval,Math.max(0,timeout-(Date.now()-started))))}
}
export function waitUntil(predicate:()=>boolean|PromiseLike<boolean>,options:Omit<PollOptions<boolean>,'isDone'>={}):Promise<boolean>{return poll<boolean>(predicate,{...options,isDone:value=>value})}
