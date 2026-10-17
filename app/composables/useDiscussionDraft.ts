/**
 * A draft kept in this browser until it is posted. Keys name the place being
 * written, e.g. `topic:12` or `reply:4567`. Storage failures are ignored: drafts
 * are a convenience, not a guarantee.
 */
export const useDiscussionDraft = <T>(key: MaybeRefOrGetter<string>, initial: () => T) => {
  const storageKey = computed(() => `cdcat:discussion-draft:${toValue(key)}`)
  const value = ref(initial()) as Ref<T>
  let timer: ReturnType<typeof setTimeout> | undefined

  const load = () => {
    if (!import.meta.client) return false
    try {
      const stored = localStorage.getItem(storageKey.value)
      if (!stored) return false
      value.value = { ...initial(), ...JSON.parse(stored) }
      return true
    }
    catch {
      return false
    }
  }

  const save = () => {
    if (!import.meta.client) return
    clearTimeout(timer)
    timer = setTimeout(() => {
      try {
        const json = JSON.stringify(value.value)
        // An emptied draft leaves nothing behind.
        if (json === JSON.stringify(initial())) localStorage.removeItem(storageKey.value)
        else localStorage.setItem(storageKey.value, json)
      }
      catch { /* storage full or disabled */ }
    }, 400)
  }

  const clear = () => {
    clearTimeout(timer)
    value.value = initial()
    if (!import.meta.client) return
    try {
      localStorage.removeItem(storageKey.value)
    }
    catch { /* ignore */ }
  }

  watch(value, save, { deep: true })
  onBeforeUnmount(() => clearTimeout(timer))

  return { value, load, clear }
}
