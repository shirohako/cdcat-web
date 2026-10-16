import type { Ref } from 'vue'

export interface EventOption {
  id: number
  name: string
  slug: string
  start_date: string | null
  end_date: string | null
  series: { id: number, name: string } | null
}

const day = (value: string | null) => value?.slice(0, 10) ?? ''

/** "Comic Market · 2025-12-30 ~ 2025-12-31" */
export const describeEvent = (event: EventOption) => {
  const start = day(event.start_date)
  const end = day(event.end_date)
  return [event.series?.name, end && end !== start ? `${start} ~ ${end}` : start].filter(Boolean).join(' · ')
}

/** Whether an event is running on a YYYY-MM-DD date. */
export const eventCoversDate = (event: EventOption, date: string) =>
  day(event.start_date) <= date && (day(event.end_date) || day(event.start_date)) >= date

/** Debounced name / slug search against GET /v1/events. */
export const useEventSearch = (limit = 10) => {
  const { $api } = useNuxtApp()
  const search = ref('')
  const results = ref<EventOption[]>([])
  const searching = ref(false)
  let timer: ReturnType<typeof setTimeout> | undefined

  watch(search, (value) => {
    clearTimeout(timer)
    const term = value.trim()
    if (!term) {
      results.value = []
      searching.value = false
      return
    }
    searching.value = true
    timer = setTimeout(async () => {
      try {
        const page = await $api<{ events: EventOption[] }>('/v1/events', { query: { search: term, per_page: limit } })
        if (search.value.trim() === term) results.value = page.events
      } catch {
        results.value = []
      } finally {
        if (search.value.trim() === term) searching.value = false
      }
    }, 300)
  })
  onBeforeUnmount(() => clearTimeout(timer))

  return { search, results, searching }
}

/** The event behind a stored id; callers may set `selected` directly to skip the fetch. */
export const useEventLookup = (id: Ref<number | null | undefined>) => {
  const { $api } = useNuxtApp()
  const selected = ref<EventOption | null>(null)

  watch(id, async (value) => {
    if (!value) {
      selected.value = null
      return
    }
    if (selected.value?.id === value) return
    try {
      selected.value = await $api<EventOption>(`/v1/events/${value}`)
    } catch {
      selected.value = null
    }
  }, { immediate: true })

  return { selected }
}
