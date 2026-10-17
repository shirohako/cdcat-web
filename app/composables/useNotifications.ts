const POLL_INTERVAL = 60_000

let timer: ReturnType<typeof setInterval> | undefined
let subscribers = 0

/**
 * The unread notification count, shared by the navbar bell and the notifications page. While a
 * bell is mounted it polls every minute, but only when the page is visible.
 */
export const useNotifications = () => {
  const { $api } = useNuxtApp()
  const { isAuthenticated } = useAuth()
  const unread = useState<number>('notifications:unread', () => 0)

  const refresh = async () => {
    if (!isAuthenticated.value) {
      unread.value = 0
      return
    }
    try {
      unread.value = (await $api<{ unread_count: number }>('/v1/me/notifications/unread-count')).unread_count
    }
    catch {
      // Keep the last known count; the next poll tries again.
    }
  }

  const onVisible = () => { if (document.visibilityState === 'visible') void refresh() }

  const startPolling = () => {
    if (!import.meta.client) return
    subscribers++
    if (subscribers > 1) return
    void refresh()
    timer = setInterval(() => { if (document.visibilityState === 'visible') void refresh() }, POLL_INTERVAL)
    document.addEventListener('visibilitychange', onVisible)
  }

  const stopPolling = () => {
    if (!import.meta.client || subscribers === 0) return
    subscribers--
    if (subscribers > 0) return
    clearInterval(timer)
    document.removeEventListener('visibilitychange', onVisible)
  }

  return { unread, refresh, startPolling, stopPolling }
}
