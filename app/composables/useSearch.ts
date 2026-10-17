import type { SearchGroup, SearchGroupsResponse, SearchResult } from '~/types/search'

/** Shortest query the API takes: 2 characters, or 1 with a kanji, kana or hangul (docs/api/search.md). */
export const searchable = (query: string) => {
  const text = query.replace(/\s+/g, '')
  return text.length >= 2 || /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u.test(text)
}

/** Where a search result opens. */
export const searchResultPath = (result: Pick<SearchResult, 'type' | 'id' | 'meta'>) => {
  switch (result.type) {
    case 'album': return `/albums/${result.id}`
    case 'track': return `/tracks/${result.id}`
    case 'artist': return `/artists/${result.id}`
    case 'label': return `/labels/${result.id}`
    case 'work': return `/works/${result.id}`
    case 'entry': return `/entries/${result.id}`
    case 'franchise': return `/franchises/${result.id}`
  }
}

/**
 * Search-as-you-type for the navbar: grouped results a few per type, 250 ms after typing stops.
 * A newer query aborts the request of an older one so stale results never show.
 */
export const useQuickSearch = (limit = 3) => {
  const { $api } = useNuxtApp()
  const query = ref('')
  const groups = ref<SearchGroup[]>([])
  const loading = ref(false)
  const failed = ref(false)
  let timer: ReturnType<typeof setTimeout> | undefined
  let controller: AbortController | null = null

  const run = async (text: string) => {
    controller?.abort()
    const current = new AbortController()
    controller = current
    loading.value = true
    failed.value = false
    try {
      const data = await $api<SearchGroupsResponse>('/v1/search', { query: { q: text, limit }, signal: current.signal })
      if (controller === current) groups.value = data.groups.filter(group => group.items.length)
    } catch {
      if (controller === current && !current.signal.aborted) {
        groups.value = []
        failed.value = true
      }
    } finally {
      if (controller === current) loading.value = false
    }
  }

  watch(query, (value) => {
    clearTimeout(timer)
    const text = value.trim()
    if (!searchable(text)) {
      controller?.abort()
      controller = null
      groups.value = []
      loading.value = false
      return
    }
    timer = setTimeout(() => run(text), 250)
  })
  onBeforeUnmount(() => {
    clearTimeout(timer)
    controller?.abort()
  })

  return { query, groups, loading, failed }
}
