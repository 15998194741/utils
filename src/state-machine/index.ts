/**
 * A transition between two states.
 *
 * The optional `guard` blocks the transition, and the optional `action` runs before the state changes.
 */
export interface Transition<S extends PropertyKey,_E extends PropertyKey,C>{target:S;guard?:(context:C)=>boolean;action?:(context:C)=>void}
/**
 * The configuration of a state machine.
 *
 * Each state maps the events it accepts to a target state or a full {@link Transition}.
 */
export type MachineConfig<S extends PropertyKey,E extends PropertyKey,C>={initial:S;context:C;states:{[K in S]?:Partial<Record<E,S|Transition<S,E,C>>>}}
/**
 * Creates a state machine from a configuration.
 *
 * @param config - The machine configuration.
 * @returns The machine, exposing `state`, `context`, `send` and `subscribe`.
 */
export function createStateMachine<S extends PropertyKey,E extends PropertyKey,C>(config:MachineConfig<S,E,C>){let state=config.initial;const listeners=new Set<(state:S,previous:S)=>void>();return{get state(){return state},context:config.context,send(event:E):boolean{const entry=config.states[state]?.[event];if(entry===undefined)return false;const transition:Transition<S,E,C>=typeof entry==='object'?entry as Transition<S,E,C>:{target:entry as S};if(transition.guard&&!transition.guard(config.context))return false;const previous=state;transition.action?.(config.context);state=transition.target;if(state!==previous)for(const listener of Array.from(listeners))listener(state,previous);return true},subscribe(listener:(state:S,previous:S)=>void):()=>void{listeners.add(listener);return()=>listeners.delete(listener)}}}
