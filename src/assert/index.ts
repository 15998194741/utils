export function invariant(condition:unknown,message='Invariant failed'):asserts condition{if(!condition)throw new Error(message)}
export function assertDefined<T>(value:T,message='Expected value to be defined'):asserts value is NonNullable<T>{if(value===null||value===undefined)throw new Error(message)}
export function assertNever(value:never,message='Unexpected value'):never{throw new Error(`${message}: ${String(value)}`)}
