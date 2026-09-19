export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

interface StoredValue<T> { value: T; expiresAt: number | null }

/** JSON storage with optional TTL. Malformed and expired entries are removed and return fallback. */
export function createStorage(storage: StorageLike, prefix = '') {
  return {
    set<T>(key: string, value: T, ttl?: number): void {
      if (ttl !== undefined && (!Number.isFinite(ttl) || ttl < 0)) throw new RangeError('ttl must be a non-negative finite number')
      const entry: StoredValue<T> = { value, expiresAt: ttl === undefined ? null : Date.now() + ttl }
      storage.setItem(prefix + key, JSON.stringify(entry))
    },
    get<T>(key: string, fallback?: T): T | undefined {
      const name = prefix + key
      const raw = storage.getItem(name)
      if (raw === null) return fallback
      try {
        const entry = JSON.parse(raw) as StoredValue<T>
        if (!entry || !Object.prototype.hasOwnProperty.call(entry, 'value') || (entry.expiresAt !== null && (typeof entry.expiresAt !== 'number' || !Number.isFinite(entry.expiresAt)))) throw new Error()
        if (entry.expiresAt !== null && Date.now() >= entry.expiresAt) { storage.removeItem(name); return fallback }
        return entry.value
      } catch { storage.removeItem(name); return fallback }
    },
    remove(key: string): void { storage.removeItem(prefix + key) }
  }
}
