<script setup lang="ts">
import type { AlbumSimple } from '~/types/album'
import type { EventCircle, EventDetail, VenueMapData } from '~/types/event'
import type { GenreFamily } from '~/utils/eventVenue'
import { Disc3, Layers, MapPin, Palette, Search, Star, Users, X } from '@lucide/vue'

const route = useRoute()
const router = useRouter()
const eventId = Number(route.params.id)
const { t } = useI18n()
const { localizeError } = useLocalizedApiError()

const { data: event, status, error, revealClass } = await usePageAPI<EventDetail>(`/v1/events/${eventId}`)

// The map and the circle list are large and only useful in the browser: load them there.
const { data: map, status: mapStatus } = usePageAPI<VenueMapData>(`/v1/events/${eventId}/map`, { server: false })
const { data: circleData, status: circlesStatus, error: circlesError, refresh: refreshCircles } = usePageAPI<{ circles: EventCircle[] }>(`/v1/events/${eventId}/circles`, { server: false })
const circles = computed(() => circleData.value?.circles ?? [])
const checklist = useEventChecklist(eventId)

const spaces = computed(() => map.value ? buildSpaces(map.value, circles.value) : [])
const genres = computed(() => map.value?.genres ?? {})
const hallNames = computed(() => {
  const halls = new Map((map.value?.halls ?? []).map(h => [h.id, h.name]))
  const byCircle = new Map<number, string>()
  for (const space of spaces.value) {
    for (const piece of space.pieces) if (piece.circle) byCircle.set(piece.circle.id, halls.get(space.hallId) ?? '')
  }
  return byCircle
})
const circleHall = computed(() => {
  const out = new Map<number, number>()
  for (const space of spaces.value) for (const piece of space.pieces) if (piece.circle) out.set(piece.circle.id, space.hallId)
  return out
})

// ── Filters, shared by the map (dims the rest) and the list ─────────────
const query = ref('')
const family = ref<GenreFamily | null>(null)
const genre = ref<string | null>(null)
const hall = ref<number | null>(null)
const onlyChecked = ref(false)
const colorByGenre = ref(true)

const searchText = computed(() => new Map(circles.value.map(c => [c.id, circleSearchText(c)])))
const filtering = computed(() => Boolean(query.value.trim() || family.value || genre.value || hall.value || onlyChecked.value))
const filtered = computed(() => {
  const terms = foldSearch(query.value).split(/\s+/).filter(Boolean)
  return circles.value.filter((circle) => {
    if (family.value && genreFamily(circle.genre, genres.value) !== family.value) return false
    if (genre.value && circle.genre !== genre.value) return false
    if (hall.value && circleHall.value.get(circle.id) !== hall.value) return false
    if (onlyChecked.value && !checklist.ids.value.has(circle.id)) return false
    const text = searchText.value.get(circle.id) ?? ''
    return terms.every(term => text.includes(term))
  })
})
const highlighted = computed(() => filtering.value ? new Set(filtered.value.map(c => c.id)) : null)

// The list follows the hall the map is zoomed into, unless a hall is picked in the filters.
const mapHall = ref<number | null>(null)
const followMap = ref(true)
const followedHall = computed(() => followMap.value && !hall.value && mapHall.value ? map.value?.halls.find(h => h.id === mapHall.value) ?? null : null)
const listCircles = computed(() => followedHall.value
  ? filtered.value.filter(circle => circleHall.value.get(circle.id) === followedHall.value!.id)
  : filtered.value)
const clearFilters = () => {
  query.value = ''
  family.value = null
  genre.value = null
  hall.value = null
  onlyChecked.value = false
}

const familyCounts = computed(() => {
  const counts: Record<string, number> = {}
  for (const circle of circles.value) {
    const key = genreFamily(circle.genre, genres.value)
    if (key) counts[key] = (counts[key] ?? 0) + 1
  }
  return counts
})
const genreOptions = computed(() => {
  const counts = new Map<string, number>()
  for (const circle of circles.value) if (circle.genre) counts.set(circle.genre, (counts.get(circle.genre) ?? 0) + 1)
  return [...counts.entries()]
    .filter(([code]) => !family.value || genreFamily(code, genres.value) === family.value)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([code, count]) => ({ code, count, label: genreShortLabel(code, genres.value) }))
})
watch(family, () => {
  if (genre.value && family.value && genreFamily(genre.value, genres.value) !== family.value) genre.value = null
})

// ── Selection (?circle=) and tabs (?tab=) ───────────────────────────────
const selectedId = computed(() => Number(route.query.circle) || null)
const selected = computed(() => circles.value.find(c => c.id === selectedId.value) ?? null)
const select = (id: number | null) => router.replace({ query: { ...route.query, circle: id ?? undefined } })
const venueMap = ref<{ focusCircle: (id: number) => boolean, focusHall: (id: number) => void } | null>(null)
const mapSection = ref<HTMLElement | null>(null)
const locate = (id: number) => {
  mapSection.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  venueMap.value?.focusCircle(id)
  if (window.matchMedia('(max-width: 639px)').matches) select(null)
}
const selectedSpaceLabel = computed(() => {
  if (!selected.value?.space_code) return ''
  return [hallNames.value.get(selected.value.id), selected.value.space_code].filter(Boolean).join(' · ')
})
const onHall = (id: number | null) => {
  mapHall.value = id
  router.replace({ query: { ...route.query, hall: id ?? undefined } })
}

type Tab = 'circles' | 'albums'
const tab = computed<Tab>({
  get: () => route.query.tab === 'albums' ? 'albums' : 'circles',
  set: value => router.replace({ query: { ...route.query, tab: value === 'circles' ? undefined : value } }),
})

// ── Albums released here ────────────────────────────────────────────────
const albumPage = ref(1)
const { data: albumData, loading: albumsLoading, refetching: albumsRefetching } = usePageAPI<{ albums: AlbumSimple[], pagination: { total: number, last_page: number } }>('/v1/albums', {
  query: computed(() => ({ release_event_id: eventId, page: albumPage.value, per_page: 24 })),
})
const albumCircle = computed(() => {
  const out = new Map<number, EventCircle>()
  for (const circle of circles.value) for (const id of circle.album_ids) if (!out.has(id)) out.set(id, circle)
  return out
})

const stats = computed(() => {
  const out = [{ key: 'circles', label: t('event_page.stats.circles'), value: event.value?.circles_count ?? 0 }]
  if (map.value) {
    out.push({ key: 'spaces', label: t('event_page.stats.spaces'), value: map.value.spaces.length })
    out.push({ key: 'halls', label: t('event_page.stats.halls'), value: map.value.halls.length })
  }
  out.push({ key: 'albums', label: t('event_page.stats.albums'), value: event.value?.released_albums_count ?? 0 })
  return out.filter(s => s.value || s.key === 'circles')
})

const description = computed(() => event.value
  ? t('event_page.seo_description', { name: event.value.name, venue: event.value.venue ?? '', count: event.value.circles_count ?? 0 })
  : '')
useSeoMeta({
  title: () => event.value?.name ?? t('collection_pages.events.title'),
  description: () => description.value,
  ogTitle: () => event.value?.name,
  ogDescription: () => description.value,
  ogImage: () => event.value?.main_visual_url ?? undefined,
})
</script>

<template>
  <div class="min-h-screen">
    <template v-if="event">
      <div :class="revealClass">
        <EventHero :event="event" :stats="stats" :has-map="event.has_map ?? false" @jump-map="mapSection?.scrollIntoView({ behavior: 'smooth' })" />

        <div class="container mx-auto max-w-6xl space-y-8 px-4 py-8 md:px-8 2xl:max-w-7xl">
          <!-- Venue map with the filters it shares with the list -->
          <section v-if="event.has_map" ref="mapSection" class="card scroll-mt-20 overflow-hidden">
            <header class="flex flex-col gap-3 border-b border-line p-4 md:p-5">
              <div class="flex flex-wrap items-center justify-between gap-3">
                <div class="flex items-center gap-2.5">
                  <UiIconTile :icon="MapPin" />
                  <div>
                    <h2 class="text-base font-bold text-title">{{ t('event_page.map.title') }}</h2>
                    <p class="text-xs text-meta">{{ t('event_page.map.hint') }}</p>
                  </div>
                </div>
                <label class="relative w-full sm:w-80">
                  <Search :size="16" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
                  <input
                    v-model="query"
                    type="search"
                    class="input w-full pl-9"
                    :placeholder="t('event_page.filters.search')"
                  >
                </label>
              </div>

              <!-- Genre colours (utils/eventVenue.ts) are the map's, the same in both themes. -->
              <div class="flex flex-wrap items-center gap-2">
                <button
                  v-for="item in GENRE_FAMILIES"
                  :key="item.key"
                  type="button"
                  class="chip"
                  :class="{ 'chip-selected': family === item.key }"
                  :aria-pressed="family === item.key"
                  @click="family = family === item.key ? null : item.key"
                >
                  <span class="size-2.5 rounded-full" :style="{ background: item.color }" />
                  {{ t(`event_page.families.${item.key}`) }}
                  <span class="tabular-nums opacity-60">{{ familyCounts[item.key] ?? 0 }}</span>
                </button>
                <select v-model="genre" class="select select-sm" :class="{ 'border-primary bg-primary/10': genre }">
                  <option :value="null">{{ t('event_page.filters.all_genres') }}</option>
                  <option v-for="option in genreOptions" :key="option.code" :value="option.code">{{ option.label }} ({{ option.count }})</option>
                </select>
                <select v-if="map && map.halls.length > 1" v-model="hall" class="select select-sm" :class="{ 'border-primary bg-primary/10': hall }">
                  <option :value="null">{{ t('event_page.filters.all_halls') }}</option>
                  <option v-for="item in map.halls" :key="item.id" :value="item.id">{{ item.name }}</option>
                </select>
                <button type="button" class="chip" :class="{ 'chip-selected': onlyChecked }" :aria-pressed="onlyChecked" @click="onlyChecked = !onlyChecked">
                  <!-- The checklist's gold star -->
                  <Star :size="14" :class="onlyChecked ? 'text-amber-500 dark:text-amber-400' : 'opacity-60'" :fill="onlyChecked ? 'currentColor' : 'none'" />
                  {{ t('event_page.checklist.title') }}
                  <span class="tabular-nums opacity-60">{{ checklist.ids.value.size }}</span>
                </button>
                <button v-if="filtering" type="button" class="inline-flex items-center gap-1 px-2 text-xs font-medium text-meta transition-colors duration-150 ease-out hover:text-primary" @click="clearFilters">
                  <X :size="13" />{{ t('event_page.filters.clear') }}
                </button>
                <span class="ml-auto flex items-center gap-3 text-xs text-meta">
                  <span v-if="filtering">{{ t('event_page.filters.matching', { count: filtered.length, total: circles.length }) }}</span>
                  <button type="button" class="inline-flex items-center gap-1.5 transition-colors duration-150 ease-out hover:text-primary" :aria-pressed="colorByGenre" @click="colorByGenre = !colorByGenre">
                    <Palette :size="14" />{{ colorByGenre ? t('event_page.map.color_genre') : t('event_page.map.color_plain') }}
                  </button>
                </span>
              </div>
            </header>

            <div class="h-[68vh] min-h-[420px] max-h-[820px]">
              <EventVenueMap
                v-if="map && circleData"
                ref="venueMap"
                class="h-full"
                :map="map"
                :spaces="spaces"
                :highlighted="highlighted"
                :checked="checklist.ids.value"
                :color-by-genre="colorByGenre"
                :selected-circle-id="selectedId"
                @select="select"
                @hall="onHall"
              />
              <div v-else-if="mapStatus === 'error' || circlesStatus === 'error'" class="flex h-full items-center justify-center bg-sunken">
                <CommonLoadError :message="localizeError(circlesError)" @retry="refreshCircles()" />
              </div>
              <div v-else class="relative h-full overflow-hidden bg-sunken">
                <div class="skeleton absolute inset-x-[6%] top-[12%] h-[36%] rounded-lg" style="width: 41%" />
                <div class="skeleton absolute right-[6%] top-[12%] h-[36%] w-[41%] rounded-lg" />
                <div class="skeleton absolute inset-x-[6%] bottom-[8%] h-[38%] rounded-lg" />
              </div>
            </div>
          </section>

          <!-- Circles and albums -->
          <section>
            <div class="mb-4 flex items-center gap-1 border-b border-line">
              <button type="button" class="tab-button" :class="{ 'is-active': tab === 'circles' }" @click="tab = 'circles'">
                <Users :size="16" />{{ t('event_page.tabs.circles') }}
                <span class="tab-count">{{ filtering || followedHall ? `${listCircles.length}/${circles.length}` : (event.circles_count ?? circles.length) }}</span>
              </button>
              <button type="button" class="tab-button" :class="{ 'is-active': tab === 'albums' }" @click="tab = 'albums'">
                <Disc3 :size="16" />{{ t('event_page.tabs.albums') }}
                <span class="tab-count">{{ event.released_albums_count ?? 0 }}</span>
              </button>
            </div>

            <template v-if="tab === 'circles'">
              <div v-if="!event.has_map && circles.length" class="mb-4 flex flex-wrap gap-2">
                <label class="relative w-full sm:w-80">
                  <Search :size="16" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
                  <input v-model="query" type="search" class="input w-full pl-9" :placeholder="t('event_page.filters.search')">
                </label>
              </div>
              <div v-if="circlesStatus === 'error' && !circleData" class="flex min-h-40 items-center justify-center">
                <CommonLoadError :message="localizeError(circlesError)" @retry="refreshCircles()" />
              </div>
              <div v-else-if="!circleData" class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <div v-for="n in 9" :key="n" class="card flex gap-3 p-3">
                  <div class="skeleton size-20 shrink-0 rounded-xl" />
                  <div class="flex-1 space-y-2 py-1">
                    <div class="skeleton h-4 w-16 rounded" />
                    <div class="skeleton h-4 w-3/4 rounded" />
                    <div class="skeleton h-3 w-1/2 rounded" />
                  </div>
                </div>
              </div>
              <div v-else-if="!circles.length" class="card flex min-h-40 items-center justify-center">
                <UiEmpty :title="t('event_page.circles.none')" :icon="Layers" />
              </div>
              <template v-else>
                <div v-if="followedHall" class="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-info/25 bg-info/10 px-3 py-2 text-sm text-body">
                  <MapPin :size="15" class="shrink-0 text-info" />
                  <span>{{ t('event_page.circles.following', { hall: followedHall.name, count: listCircles.length }) }}</span>
                  <button type="button" class="link ml-auto font-medium" @click="followMap = false">{{ t('event_page.circles.show_all_halls') }}</button>
                </div>
                <button
                  v-else-if="!followMap && mapHall && !hall"
                  type="button"
                  class="link mb-3 text-xs"
                  @click="followMap = true"
                >
                  {{ t('event_page.circles.follow_map') }}
                </button>
                <EventCircleList
                  :circles="listCircles"
                  :genres="genres"
                  :checked="checklist.ids.value"
                  :selected-id="selectedId"
                  :halls="hallNames"
                  @select="select"
                  @toggle-check="checklist.toggle"
                />
              </template>
            </template>

            <template v-else>
              <CollectionLoadingSkeleton v-if="albumsLoading" variant="covers" />
              <div v-else-if="albumData?.albums.length" class="space-y-6">
                <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4" :class="{ 'pointer-events-none opacity-60': albumsRefetching }">
                  <div v-for="album in albumData.albums" :key="album.id" class="space-y-1.5">
                    <AlbumCard :album="album" />
                    <button
                      v-if="albumCircle.get(album.id)"
                      type="button"
                      class="flex w-full items-center gap-1.5 rounded-lg px-1.5 py-1 text-left text-xs text-body transition-colors duration-150 ease-out hover:bg-ghost-hover hover:text-primary"
                      @click="select(albumCircle.get(album.id)!.id)"
                    >
                      <MapPin :size="13" class="shrink-0 text-primary" />
                      <span class="font-mono font-semibold text-title">{{ albumCircle.get(album.id)!.space_code ?? t('event_page.circle.catalog_only') }}</span>
                      <span class="truncate">{{ albumCircle.get(album.id)!.name }}</span>
                    </button>
                  </div>
                </div>
                <CommonPagination :page="albumPage" :total-pages="albumData.pagination.last_page" :disabled="albumsRefetching" @update:page="albumPage = $event" />
              </div>
              <div v-else class="card flex min-h-40 items-center justify-center">
                <UiEmpty :title="t('event_page.albums.empty')" :icon="Disc3" />
              </div>
            </template>
          </section>
        </div>
      </div>

      <EventCircleDrawer
        :circle="selected"
        :event-id="eventId"
        :genres="genres"
        :space-label="selectedSpaceLabel"
        :checked="selected ? checklist.ids.value.has(selected.id) : false"
        @close="select(null)"
        @toggle-check="selected && checklist.toggle(selected.id)"
        @locate="selected && locate(selected.id)"
      />
    </template>

    <div v-else-if="status === 'error'" class="flex min-h-[60vh] items-center justify-center px-4">
      <div class="alert alert-error max-w-md">
        <span>{{ error?.statusCode === 404 ? t('event_page.not_found') : localizeError(error) }}</span>
      </div>
    </div>

    <SkeletonCatalogDetail v-else hero="poster" :sections="2" />
  </div>
</template>

<style scoped>
.tab-button {
  margin-bottom: -1px;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  border-bottom: 2px solid transparent;
  padding: 0.75rem 1rem;
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--meta);
  transition: color 150ms ease-out, border-color 150ms ease-out;
}
.tab-button:hover {
  color: var(--title);
}
.tab-button.is-active {
  border-color: var(--primary);
  color: var(--primary);
}
.tab-count {
  border-radius: 9999px;
  background: var(--btn);
  padding: 0.05rem 0.5rem;
  font-size: 0.75rem;
  color: var(--btn-content);
}
</style>
