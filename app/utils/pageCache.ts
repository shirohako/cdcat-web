/** How long data from an earlier visit is shown again while it refreshes. */
export const PAGE_CACHE_MAX_AGE = 10 * 60_000
/** How many keys keep their data for revisits; beyond this the least recently fetched are dropped. */
export const PAGE_CACHE_MAX_ENTRIES = 30

interface Entry {
  /** When the data was last fetched successfully. */
  at: number
  /** Who it was fetched for: viewer-specific fields (favourites, tracking) mustn't show for someone else. */
  user: number | null
}

export interface PageCache {
  /** Records a successful fetch of `key`. Returns the keys that should now be dropped from the payload. */
  touch: (key: string, user: number | null) => string[]
  /** Whether `key` was fetched for `user` recently enough to show again. */
  isFresh: (key: string, user: number | null) => boolean
  /** A mounted page uses `key`: never drop it meanwhile. Pair each call with `release`. */
  retain: (key: string) => void
  release: (key: string) => void
}

/**
 * Bookkeeping for the revisit cache in composables/usePageData.ts: when and for whom each key was
 * fetched, and which keys mounted pages are using. The data itself stays in the Nuxt payload.
 */
export function createPageCache(options: { maxAge?: number, maxEntries?: number, now?: () => number } = {}): PageCache {
  const { maxAge = PAGE_CACHE_MAX_AGE, maxEntries = PAGE_CACHE_MAX_ENTRIES, now = Date.now } = options
  /** Least recently fetched first. */
  const entries = new Map<string, Entry>()
  const users = new Map<string, number>()

  const evict = () => {
    const dropped: string[] = []
    for (const key of entries.keys()) {
      if (entries.size <= maxEntries) break
      if (users.has(key)) continue
      entries.delete(key)
      dropped.push(key)
    }
    return dropped
  }

  return {
    touch(key, user) {
      entries.delete(key)
      entries.set(key, { at: now(), user })
      return evict()
    },
    isFresh(key, user) {
      const entry = entries.get(key)
      return !!entry && entry.user === user && now() - entry.at < maxAge
    },
    retain(key) {
      users.set(key, (users.get(key) ?? 0) + 1)
    },
    release(key) {
      const count = (users.get(key) ?? 0) - 1
      if (count > 0) users.set(key, count)
      else users.delete(key)
    },
  }
}

/** The app's cache. Module state, so only touch it in the browser: on the server it would be shared by every request. */
export const pageCache = createPageCache()
