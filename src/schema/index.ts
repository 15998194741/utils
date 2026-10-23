/**
 * The outcome of a schema parse.
 *
 * A successful result carries the parsed `data`; a failed result carries the `error`.
 */
export type SafeParseResult<T>={success:true;data:T}|{success:false;error:SchemaError}
/**
 * The error thrown when a value does not satisfy a schema.
 *
 * The `path` holds the property keys that lead to the offending value.
 */
export class SchemaError extends TypeError { constructor(message:string,readonly path:readonly PropertyKey[]=[]){super(path.length?`${path.join('.')}: ${message}`:message);this.name='SchemaError'} }
/**
 * A validator that turns unknown input into a typed value.
 *
 * Schemas are immutable: `optional`, `refine` and the schema factories all return new instances.
 */
export class Schema<T>{constructor(private validator:(value:unknown,path:PropertyKey[])=>T){}parse(value:unknown):T{return this.validator(value,[])}safeParse(value:unknown):SafeParseResult<T>{try{return{success:true,data:this.parse(value)}}catch(error){return{success:false,error:error instanceof SchemaError?error:new SchemaError(String(error))}}}optional():Schema<T|undefined>{return new Schema((value,path)=>value===undefined?undefined:this.validator(value,path))}refine(check:(value:T)=>boolean,message='Refinement failed'):Schema<T>{return new Schema((value,path)=>{const parsed=this.validator(value,path);if(!check(parsed))throw new SchemaError(message,path);return parsed})}}
/**
 * Extracts the value type produced by a schema.
 */
export type InferSchema<S>=S extends Schema<infer T>?T:never
/**
 * Creates a schema that accepts strings.
 *
 * @returns The new schema.
 */
export const stringSchema=()=>new Schema<string>((value,path)=>{if(typeof value!=='string')throw new SchemaError('Expected string',path);return value})
/**
 * Creates a schema that accepts numbers, rejecting `NaN`.
 *
 * @returns The new schema.
 */
export const numberSchema=()=>new Schema<number>((value,path)=>{if(typeof value!=='number'||Number.isNaN(value))throw new SchemaError('Expected number',path);return value})
/**
 * Creates a schema that accepts booleans.
 *
 * @returns The new schema.
 */
export const booleanSchema=()=>new Schema<boolean>((value,path)=>{if(typeof value!=='boolean')throw new SchemaError('Expected boolean',path);return value})
/**
 * Creates a schema that accepts one exact value.
 *
 * @param expected - The only accepted value.
 * @returns The new schema.
 */
export const literalSchema=<T extends string|number|boolean|null>(expected:T)=>new Schema<T>((value,path)=>{if(value!==expected)throw new SchemaError(`Expected ${String(expected)}`,path);return expected})
/**
 * Creates a schema that accepts an array of items matching another schema.
 *
 * @param item - The schema every entry must satisfy.
 * @returns The new schema.
 */
export const arraySchema=<T>(item:Schema<T>)=>new Schema<T[]>((value,path)=>{if(!Array.isArray(value))throw new SchemaError('Expected array',path);return value.map((entry,index)=>{try{return item.parse(entry)}catch(error){if(error instanceof SchemaError)throw new SchemaError(error.message,[...path,index,...error.path]);throw error}})})
/**
 * Creates a schema that accepts an object matching a shape of schemas.
 *
 * @param shape - The schema of each property.
 * @returns The new schema.
 */
export function objectSchema<S extends Record<string,Schema<any>>>(shape:S):Schema<{[K in keyof S]:InferSchema<S[K]>}>{return new Schema((value,path)=>{if(value===null||typeof value!=='object'||Array.isArray(value))throw new SchemaError('Expected object',path);const result:any={};for(const key of Object.keys(shape)){try{result[key]=shape[key].parse((value as any)[key])}catch(error){if(error instanceof SchemaError)throw new SchemaError(error.message,[...path,key,...error.path]);throw error}}return result})}
/**
 * Creates a schema that accepts the first variant that matches.
 *
 * @param schemas - The variant schemas, tried in order.
 * @returns The new schema.
 */
export function unionSchema<S extends readonly Schema<any>[]>(schemas:S):Schema<InferSchema<S[number]>>{return new Schema((value,path)=>{for(const schema of schemas){const result=schema.safeParse(value);if(result.success)return result.data}throw new SchemaError('No union variant matched',path)})}
