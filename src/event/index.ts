export type EventMap = Record<PropertyKey, readonly unknown[]>

export class EventEmitter<Events extends EventMap> {
  private listeners = new Map<keyof Events, Set<Function>>()

  on<K extends keyof Events>(event: K, listener: (...args: Events[K]) => void): () => void {
    let set = this.listeners.get(event)
    if (!set) { set = new Set(); this.listeners.set(event, set) }
    set.add(listener)
    return () => this.off(event, listener)
  }
  once<K extends keyof Events>(event: K, listener: (...args: Events[K]) => void): () => void {
    const off = this.on(event, (...args) => { off(); listener(...args) })
    return off
  }
  off<K extends keyof Events>(event: K, listener: (...args: Events[K]) => void): void {
    const set = this.listeners.get(event)
    set?.delete(listener)
    if (set?.size === 0) this.listeners.delete(event)
  }
  emit<K extends keyof Events>(event: K, ...args: Events[K]): boolean {
    const set = this.listeners.get(event)
    if (!set?.size) return false
    for (const listener of Array.from(set)) (listener as (...values: Events[K]) => void)(...args)
    return true
  }
  clear(event?: keyof Events): void { event === undefined ? this.listeners.clear() : this.listeners.delete(event) }
  listenerCount(event: keyof Events): number { return this.listeners.get(event)?.size ?? 0 }
}
