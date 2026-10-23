/**
 * Cancels a subscription. Calling it more than once is safe.
 */
export type Unsubscribe=()=>void
/**
 * A readable, writable value that notifies subscribers when it changes.
 */
export interface Signal<T>{get():T;set(value:T):void;update(updater:(value:T)=>T):void;subscribe(listener:(value:T,previous:T)=>void):Unsubscribe}
/**
 * Creates a signal holding an initial value.
 *
 * @param initial - The starting value.
 * @returns The new signal.
 */
export function createSignal<T>(initial:T):Signal<T>{let value=initial;const listeners=new Set<(value:T,previous:T)=>void>();return{get:()=>value,set(next){if(Object.is(value,next))return;const previous=value;value=next;for(const listener of Array.from(listeners))listener(value,previous)},update(fn){this.set(fn(value))},subscribe(listener){listeners.add(listener);return()=>listeners.delete(listener)}}}
/**
 * Derives a signal that recomputes whenever one of its dependencies changes.
 *
 * @param compute - The computation producing the derived value.
 * @param dependencies - The signals that trigger a recomputation.
 * @returns The derived signal, with an extra `dispose()` method that drops the subscriptions.
 */
export function computed<T>(compute:()=>T,dependencies:readonly Signal<any>[]):Signal<T>&{dispose():void}{const output=createSignal(compute()) as Signal<T>&{dispose():void};const unsubscribers=dependencies.map(dependency=>dependency.subscribe(()=>output.set(compute())));output.dispose=()=>{for(const unsubscribe of unsubscribers)unsubscribe()};return output}
/**
 * Runs a listener whenever a signal changes.
 *
 * @param signal - The signal to observe.
 * @param listener - Called with the new value and the previous one.
 * @param immediate - When `true`, the listener is called once right away. Default: `false`.
 * @returns A function that stops the subscription.
 */
export function watch<T>(signal:Signal<T>,listener:(value:T,previous:T)=>void,immediate=false):Unsubscribe{if(immediate)listener(signal.get(),signal.get());return signal.subscribe(listener)}
