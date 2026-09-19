export class Queue<T> {
  private values: T[] = []; private head = 0
  enqueue(value: T): number { this.values.push(value); return this.size }
  dequeue(): T | undefined { const value = this.values[this.head++]; if (this.head > 64 && this.head * 2 > this.values.length) { this.values = this.values.slice(this.head); this.head = 0 } return value }
  peek(): T | undefined { return this.values[this.head] }
  get size(): number { return this.values.length - this.head }
  clear(): void { this.values = []; this.head = 0 }
}

export class Stack<T> {
  private values: T[] = []
  push(value: T): number { return this.values.push(value) }
  pop(): T | undefined { return this.values.pop() }
  peek(): T | undefined { return this.values[this.values.length - 1] }
  get size(): number { return this.values.length }
  clear(): void { this.values.length = 0 }
}

/** The comparator places a negative result closer to the front. */
export class PriorityQueue<T> {
  private values: T[] = []
  constructor(private compare: (left: T, right: T) => number) {}
  enqueue(value: T): number { this.values.push(value); this.up(this.values.length - 1); return this.size }
  dequeue(): T | undefined {
    if (!this.values.length) return undefined
    const first = this.values[0], last = this.values.pop()!
    if (this.values.length) { this.values[0] = last; this.down(0) }
    return first
  }
  peek(): T | undefined { return this.values[0] }
  get size(): number { return this.values.length }
  clear(): void { this.values.length = 0 }
  private up(index: number) { while (index) { const parent = Math.floor((index - 1) / 2); if (this.compare(this.values[parent], this.values[index]) <= 0) break; [this.values[parent], this.values[index]] = [this.values[index], this.values[parent]]; index = parent } }
  private down(index: number) { for (;;) { let best = index, left = index * 2 + 1, right = left + 1; if (left < this.size && this.compare(this.values[left], this.values[best]) < 0) best = left; if (right < this.size && this.compare(this.values[right], this.values[best]) < 0) best = right; if (best === index) return; [this.values[index], this.values[best]] = [this.values[best], this.values[index]]; index = best } }
}

export class LRUCache<K, V> {
  private values = new Map<K, V>()
  constructor(readonly capacity: number) { if (!Number.isInteger(capacity) || capacity <= 0) throw new RangeError('capacity must be a positive integer') }
  get(key: K): V | undefined { if (!this.values.has(key)) return undefined; const value = this.values.get(key)!; this.values.delete(key); this.values.set(key, value); return value }
  has(key: K): boolean { return this.values.has(key) }
  set(key: K, value: V): this { this.values.delete(key); this.values.set(key, value); if (this.values.size > this.capacity) this.values.delete(this.values.keys().next().value); return this }
  delete(key: K): boolean { return this.values.delete(key) }
  clear(): void { this.values.clear() }
  get size(): number { return this.values.size }
  keys(): IterableIterator<K> { return this.values.keys() }
}
