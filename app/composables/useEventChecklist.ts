/**
 * The member's 想去 list for one event: circle ids, loaded after sign-in and changed optimistically.
 * Guests are sent to the login page when they try to add a circle.
 */
export const useEventChecklist = (eventId: MaybeRefOrGetter<number>) => {
  const { $api } = useNuxtApp()
  const { isAuthenticated } = useAuth()
  const route = useRoute()
  const ids = ref(new Set<number>())
  const pending = ref(new Set<number>())

  const load = async () => {
    if (!isAuthenticated.value) {
      ids.value = new Set()
      return
    }
    try {
      const data = await $api<{ circle_ids: number[] }>(`/v1/me/events/${toValue(eventId)}/checklist`, { progress: false })
      ids.value = new Set(data.circle_ids)
    } catch {
      // the list is a convenience; the page works without it
    }
  }

  onMounted(load)
  watch(isAuthenticated, load)

  const toggle = async (circleId: number) => {
    if (!isAuthenticated.value) {
      await navigateTo(`/auth/login?redirect=${encodeURIComponent(route.fullPath)}`)
      return
    }
    if (pending.value.has(circleId)) return
    const checked = !ids.value.has(circleId)
    const next = new Set(ids.value)
    if (checked) next.add(circleId)
    else next.delete(circleId)
    ids.value = next
    pending.value = new Set(pending.value).add(circleId)
    try {
      await $api(`/v1/me/events/${toValue(eventId)}/checklist/${circleId}`, { method: checked ? 'PUT' : 'DELETE', progress: false })
    } catch {
      const undo = new Set(ids.value)
      if (checked) undo.delete(circleId)
      else undo.add(circleId)
      ids.value = undo
    } finally {
      const done = new Set(pending.value)
      done.delete(circleId)
      pending.value = done
    }
  }

  return { ids: readonly(ids), has: (id: number) => ids.value.has(id), toggle, isAuthenticated }
}
