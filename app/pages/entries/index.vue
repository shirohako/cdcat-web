<script setup lang="ts">
import { Calendar, Film, Music2 } from '@lucide/vue'
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
            v-model:search="searchInput"
            :model-value="selectedType"
            :title="$t('menu.entry')"
            :description="$t('content_display.entry_desc')"
            icon="lucide:film"
            :create="{ to: '/contribute?type=entry', label: $t('common.new') }"
            :filters="typeFilters"
            :filter-label="$t('catalog.type')"
            :search-placeholder="$t('catalog.search_placeholder')"
            @update:model-value="selectType"
            @search="submitSearch"
          >
            <template #search-end>
              <CatalogPendingToggle :model-value="includePending" @update:model-value="setIncludePending" />
            </template>
            <template v-if="formats.length" #filters="{ activeClass, idleClass }">
              <button
                v-for="format in formats"
                :key="format"
                type="button"
                class="h-8 shrink-0 rounded-lg px-3 text-xs font-medium ring-1 ring-inset transition-colors duration-150 ease-out"
                :class="selectedFormat === format ? activeClass : idleClass"
                :aria-pressed="selectedFormat === format"
                @click="selectFormat(format)"
              >
                {{ formatLabel(format) }}
              </button>
            </template>
          </CollectionPageHeader>
        </template>

        <CommonLoadError v-if="status === 'error' && data" class="mb-4" @retry="refresh()" />

        <CollectionLoadingSkeleton v-if="loading" variant="list" />

        <div v-else-if="status === 'error' && !data" class="flex min-h-72 items-center justify-center text-sm text-danger">
          {{ $t('common.load_failed') }}
        </div>

        <div v-else :key="revealKey" class="transition-opacity" :class="[revealClass, { 'pointer-events-none opacity-60': refetching }]" :inert="refetching">
          <CommonPagedList
            :page="pagination.current_page"
            :total-pages="pagination.last_page"
            :total="pagination.total"
            :count="entries.length"
            :per-page="pagination.per_page"
            :top-after="4"
            :disabled="refetching"
            @update:page="goToPage"
          >
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
          </CommonPagedList>
        </div>
      </CollectionPageCard>
    </div>
  </div>
</template>
