import type { MaybeRefOrGetter } from 'vue'
import type { ArtistCard } from '~/types/artist'

// Requests in flight and ids that failed, for the whole page. Hover cards keep their own cache rather than
// usePageData's, which would push whole pages out of the revisit cache.
const loading = new Map<number, Promise<void>>()
const failedIds = reactive(new Set<number>())

/** The hover-card summary of an artist (GET /artists/{id}/card), fetched once per id and kept for the visit. */
export const useArtistCard = (id: MaybeRefOrGetter<number | null>) => {
  const { $api } = useNuxtApp()
  const cards = useState<Record<number, ArtistCard>>('artist-cards', () => ({}))

  const load = (artistId: number) => {
    if (cards.value[artistId] || loading.has(artistId)) return
    failedIds.delete(artistId)
    loading.set(artistId, $api<ArtistCard>(`/v1/artists/${artistId}/card`, { progress: false })
      .then((card) => { cards.value = { ...cards.value, [artistId]: card } })
      .catch(() => { failedIds.add(artistId) })
      .finally(() => { loading.delete(artistId) }))
  }

  watch(() => toValue(id), (artistId) => {
    if (import.meta.client && artistId) load(artistId)
  }, { immediate: true })

  const card = computed(() => {
    const artistId = toValue(id)
    return artistId ? cards.value[artistId] ?? null : null
  })
  const failed = computed(() => {
    const artistId = toValue(id)
    return Boolean(artistId && failedIds.has(artistId))
  })

  return { card, failed }
}
