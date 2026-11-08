/** A known count is trusted this long before a page change or a return to the tab checks it again. */
const STALE_AFTER = 5 * 60_000

let lastChecked = 0
let subscribers = 0

/**
 * The unread notification count, shared by the navbar bell and the notifications page. No timer: notifications are
 * replies and likes, nothing urgent, so a tab left alone makes no requests. The bell checks once when it mounts,
 * then again on a page change or a return to the tab, but only when the last known count is over five minutes old.
 * Every response that carries the count (the bell's list, marking read, the notifications page) counts as a check.
 */
export const useNotifications = () => {
  const { $api } = useNuxtApp()
  const { isAuthenticated } = useAuth()
  const unread = useState<number>('notifications:unread', () => 0)

  /** Takes a count from any response that has one. */
  const record = (count: number) => {
    unread.value = count
    lastChecked = Date.now()
  }

  const refresh = async () => {
    if (!isAuthenticated.value) {
      unread.value = 0
      return
    }
    try {
      record((await $api<{ unread_count: number }>('/v1/me/notifications/unread-count', { progress: false })).unread_count)
    }
    catch {
      // Keep the last known count; the next check tries again.
    }
  }

  const refreshIfStale = () => {
    if (Date.now() - lastChecked >= STALE_AFTER) void refresh()
  }

  const onVisible = () => { if (document.visibilityState === 'visible') refreshIfStale() }

  const subscribe = () => {
    if (!import.meta.client) return
    subscribers++
    if (subscribers > 1) return
    void refresh()
    document.addEventListener('visibilitychange', onVisible)
  }

  const unsubscribe = () => {
    if (!import.meta.client || subscribers === 0) return
    subscribers--
    if (subscribers > 0) return
    document.removeEventListener('visibilitychange', onVisible)
  }

  return { unread, record, refreshIfStale, subscribe, unsubscribe }
}
