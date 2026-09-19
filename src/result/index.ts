export type Result<T,E=unknown>={ok:true;value:T}|{ok:false;error:E}
export function tryCatch<T,E=unknown>(task:()=>T):Result<T,E>{try{return{ok:true,value:task()}}catch(error){return{ok:false,error:error as E}}}
export async function tryCatchAsync<T,E=unknown>(task:()=>T|PromiseLike<T>):Promise<Result<T,E>>{try{return{ok:true,value:await task()}}catch(error){return{ok:false,error:error as E}}}
