<script setup lang="ts">
import { Calendar, Film, Music2, Plus, Search } from '@lucide/vue'
import { ENTRY_FORMATS, ENTRY_TYPES, ENTRY_TYPE_ICONS, type EntrySummary, type EntryType } from '~/types/entry'
import type { Pagination } from '~/types/api'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const { displayName, originalName, typeLabel, formatLabel, typeWithFormat, formatReleaseDate } = useEntryDisplay()

usePageSeo({ title: () => t('menu.entry'), description: () => t('seo.pages.entries') })

const selectedType = computed(() => (ENTRY_TYPES as readonly string[]).includes(route.query.type as string) ? route.query.type as EntryType : 'all')
const selectedFormat = computed(() => (route.query.format as string) || '')
const search = computed(() => (route.query.search as string) || '')
const currentPage = computed(() => Math.max(1, Number.parseInt(route.query.page as string || '1') || 1))
const searchInput = ref(search.value)
watch(search, (value) => { searchInput.value = value })

const typeFilters = computed(() => [
  { value: 'all', label: t('catalog.all'), icon: 'lucide:layout-grid' },
  ...ENTRY_TYPES.map(type => ({ value: type, label: typeLabel(type), icon: ENTRY_TYPE_ICONS[type] })),
])
const formats = computed(() => selectedType.value === 'all' ? [] : ENTRY_FORMATS[selectedType.value])

const { includePending, setIncludePending } = usePendingToggle()
const { data, status, refresh, loading, refetching, revealKey, revealClass } = usePageAPI<{ entries: EntrySummary[], pagination: Pagination }>('/v1/entries', {
  query: computed(() => ({
    page: currentPage.value,
    per_page: 20,
    type: selectedType.value === 'all' ? undefined : selectedType.value,
    format: selectedFormat.value || undefined,
    search: search.value.trim().length >= 2 ? search.value.trim() : undefined,
    include_pending: includePending.value ? 1 : undefined,
  })),
})

const entries = computed(() => data.value?.entries || [])
const pagination = computed(() => data.value?.pagination || { total: 0, per_page: 20, current_page: 1, last_page: 1 })

const updateQuery = (changes: Record<string, string | number | undefined>) => {
  router.push({ query: { ...route.query, page: undefined, ...changes } })
}
const selectType = (type: string) => updateQuery({ type: type === 'all' ? undefined : type, format: undefined })
const selectFormat = (format: string) => updateQuery({ format: format === selectedFormat.value ? undefined : format })
const submitSearch = () => updateQuery({ search: searchInput.value.trim() || undefined })
const goToPage = (page: number) => {
  if (page < 1 || page > pagination.value.last_page) return
  router.push({ query: { ...route.query, page: page === 1 ? undefined : page } })
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <div class="min-h-screen">
    <div class="container mx-auto max-w-6xl px-4 py-8 md:px-8 2xl:max-w-7xl">
      <CollectionPageCard>
        <template #header>
          <CollectionPageHeader
            :model-value="selectedType"
            :title="$t('menu.entry')"
            :description="$t('content_display.entry_desc')"
            icon="lucide:panels-top-left"
            :filters="typeFilters"
            :filter-label="$t('catalog.type')"
            @update:model-value="selectType"
          >
            <template #action>
              <button
                class="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary p-0 text-xs font-semibold text-on-primary transition-colors duration-150 ease-out hover:bg-primary-strong sm:h-9 sm:w-auto sm:gap-2 sm:px-3.5"
                @click="navigateTo('/contribute?type=entry')"
              >
                <Plus class="h-3.5 w-3.5" />
                <span class="hidden sm:inline">{{ $t('common.new') }}</span>
              </button>
            </template>
          </CollectionPageHeader>
          <div class="flex flex-col gap-2.5 border-b border-line px-4 py-3 sm:flex-row sm:items-center sm:px-6">
            <form class="flex min-w-0 flex-1 items-center gap-2" role="search" @submit.prevent="submitSearch">
              <label class="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-lg bg-field px-3 ring-1 ring-line focus-within:ring-primary">
                <Search class="h-4 w-4 shrink-0 text-faint" />
                <input v-model="searchInput" type="search" class="min-w-0 flex-1 bg-transparent text-sm text-title outline-none placeholder:text-faint" :placeholder="$t('catalog.search_placeholder')" :aria-label="$t('catalog.search')" >
              </label>
              <button type="submit" class="btn btn-primary btn-sm h-9 shrink-0 text-xs">{{ $t('catalog.search') }}</button>
            </form>
            <CatalogPendingToggle :model-value="includePending" @update:model-value="setIncludePending" />
            <div v-if="formats.length" class="flex gap-1.5 overflow-x-auto">
              <button
                v-for="format in formats"
                :key="format"
                type="button"
                class="h-8 shrink-0 rounded-lg px-3 text-xs font-medium ring-1 ring-inset transition-colors duration-150 ease-out"
                :class="selectedFormat === format ? 'bg-primary text-on-primary ring-primary' : 'bg-btn text-btn-content ring-transparent hover:bg-btn-hover'"
                :aria-pressed="selectedFormat === format"
                @click="selectFormat(format)"
              >
                {{ formatLabel(format) }}
              </button>
            </div>
          </div>
        </template>

        <CommonLoadError v-if="status === 'error' && data" class="mb-4" @retry="refresh()" />

        <CollectionLoadingSkeleton v-if="loading" variant="list" />

        <div v-else-if="status === 'error' && !data" class="flex min-h-72 items-center justify-center text-sm text-danger">
          {{ $t('common.load_failed') }}
        </div>

        <div v-else :key="revealKey" class="transition-opacity" :class="[revealClass, { 'pointer-events-none opacity-60': refetching }]" :inert="refetching">
          <div class="space-y-3">
            <NuxtLink v-for="entry in entries" :key="entry.id" :to="`/entries/${entry.id}`" class="group block">
              <article class="flex gap-4 rounded-xl bg-sunken p-4 transition-colors duration-150 ease-out group-hover:bg-card-hover group-active:bg-card-active">
                <div class="relative h-32 w-22 shrink-0 overflow-hidden rounded-lg bg-btn">
                  <img v-if="entry.image_url" v-img-fade :src="entry.image_url" :alt="displayName(entry)" class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" >
                  <div v-else class="flex h-full items-center justify-center text-faint">
                    <Film :size="36" />
                  </div>
                </div>

                <div class="flex min-w-0 flex-1 flex-col justify-between gap-2">
                  <div>
                    <div class="mb-1 flex flex-wrap items-center gap-2">
                      <span class="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
                        <Icon :name="ENTRY_TYPE_ICONS[entry.type] || 'lucide:shapes'" class="h-3 w-3" />
                        {{ typeWithFormat(entry.type, entry.format) }}
                      </span>
                      <span v-for="platform in (entry.platforms || []).slice(0, 3)" :key="platform" class="rounded-full bg-btn px-2 py-0.5 text-xs text-btn-content">{{ platform }}</span>
                    </div>
                    <h3 class="line-clamp-2 text-lg font-bold text-title transition-colors group-hover:text-primary">{{ displayName(entry) }}</h3>
                    <p v-if="originalName(entry)" class="truncate text-sm text-meta">{{ originalName(entry) }}</p>
                    <p v-if="entry.description" class="mt-1 line-clamp-2 text-sm text-body">{{ entry.description }}</p>
                  </div>

                  <div class="flex flex-wrap items-center gap-4 text-sm text-body">
                    <span v-if="entry.release_date" class="flex items-center gap-1.5">
                      <Calendar :size="15" class="text-meta" />
                      {{ formatReleaseDate(entry.release_date, entry.release_date_precision) }}
                    </span>
                    <span class="flex items-center gap-1.5">
                      <Music2 :size="15" class="text-meta" />
                      {{ $t('catalog.albums_count', { count: entry.albums_count ?? 0 }) }}
                    </span>
                  </div>
                </div>
              </article>
            </NuxtLink>
          </div>

          <div v-if="!entries.length" class="flex min-h-72 items-center justify-center">
            <UiEmpty :title="$t('catalog.no_entries')" :icon="Film" />
          </div>

          <CommonPagination
            class="mt-6"
            :page="pagination.current_page"
            :total-pages="pagination.last_page"
            :disabled="refetching"
            @update:page="goToPage"
          />
        </div>
      </CollectionPageCard>
    </div>
  </div>
</template>
