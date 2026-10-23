/**
 * Throws when a condition does not hold.
 *
 * @param condition - The condition that must be truthy.
 * @param message - The error message. Default: `'Invariant failed'`.
 * @throws {Error} When `condition` is falsy.
 *
 * @example
 * ```ts
 * invariant(list.length > 0, 'List must not be empty');
 * ```
 */
export function invariant(condition:unknown,message='Invariant failed'):asserts condition{if(!condition)throw new Error(message)}
/**
 * Throws when a value is `null` or `undefined`, narrowing its type.
 *
 * @param value - The value that must be defined.
 * @param message - The error message. Default: `'Expected value to be defined'`.
 * @throws {Error} When `value` is `null` or `undefined`.
 *
 * @example
 * ```ts
 * assertDefined(config.name, 'Config name is required');
 * ```
 */
export function assertDefined<T>(value:T,message='Expected value to be defined'):asserts value is NonNullable<T>{if(value===null||value===undefined)throw new Error(message)}
/**
 * Throws for a value that should be impossible to reach.
 *
 * @param value - The unreachable value. Its type must be `never`.
 * @param message - The error message. Default: `'Unexpected value'`.
 * @returns Nothing; the call always throws.
 * @throws {Error} Always.
 *
 * @example
 * ```ts
 * assertNever(state); // throws when a new state is added without handling it
 * ```
 */
export function assertNever(value:never,message='Unexpected value'):never{throw new Error(`${message}: ${String(value)}`)}
