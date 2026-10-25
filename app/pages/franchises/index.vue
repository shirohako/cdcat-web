<script setup lang="ts">
import { Boxes, Disc3, Film, Layers } from '@lucide/vue'
import type { FranchiseSummary } from '~/types/entry'
import type { Pagination } from '~/types/api'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const { displayName, originalName } = useEntryDisplay()

usePageSeo({ title: () => t('content_display.series'), description: () => t('seo.pages.franchises') })

const currentPage = computed(() => Math.max(1, Number.parseInt(route.query.page as string || '1') || 1))
const search = computed(() => (route.query.search as string) || '')
const searchInput = ref(search.value)
watch(search, (value) => { searchInput.value = value })

// Top-level series only, unless searching (then sub-series match too).
const { includePending, setIncludePending } = usePendingToggle()
const { data, status, refresh, loading, refetching, revealKey, revealClass } = usePageAPI<{ franchises: FranchiseSummary[], pagination: Pagination }>('/v1/franchises', {
  query: computed(() => ({
    page: currentPage.value,
    per_page: 24,
    search: search.value.trim().length >= 2 ? search.value.trim() : undefined,
    include_pending: includePending.value ? 1 : undefined,
  })),
})

const seriesList = computed(() => data.value?.franchises || [])
const pagination = computed(() => data.value?.pagination || { total: 0, per_page: 24, current_page: 1, last_page: 1 })

const submitSearch = () => router.push({ query: { search: searchInput.value.trim() || undefined, pending: route.query.pending } })
const goToPage = (page: number) => {
  if (page < 1 || page > pagination.value.last_page) return
  router.push({ query: { ...route.query, page: page === 1 ? undefined : page } })
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <div class="container mx-auto max-w-6xl px-4 py-8 md:px-8 2xl:max-w-7xl">
    <CollectionPageCard>
      <template #header>
        <CollectionPageHeader
          v-model:search="searchInput"
          :title="$t('content_display.series')"
          :description="$t('content_display.series_desc')"
          icon="lucide:library"
          :create="{ to: '/contribute?type=franchise', label: $t('common.new') }"
          :search-placeholder="$t('catalog.search_placeholder')"
          @search="submitSearch"
        >
          <template #search-end>
            <CatalogPendingToggle :model-value="includePending" @update:model-value="setIncludePending" />
          </template>
        </CollectionPageHeader>
      </template>

      <CommonLoadError v-if="status === 'error' && data" class="mb-4" @retry="refresh()" />

      <CollectionLoadingSkeleton v-if="loading" variant="wide" />

      <div v-else-if="status === 'error' && !data" class="flex min-h-72 items-center justify-center text-sm text-danger">
        {{ $t('common.load_failed') }}
      </div>

      <div v-else :key="revealKey" class="transition-opacity" :class="[revealClass, { 'pointer-events-none opacity-60': refetching }]" :inert="refetching">
        <div class="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
          <NuxtLink
            v-for="series in seriesList"
            :key="series.id"
            :to="`/franchises/${series.id}`"
            class="group block overflow-hidden rounded-xl bg-sunken transition-colors duration-150 ease-out hover:bg-card-hover active:bg-card-active"
          >
            <div class="relative aspect-video overflow-hidden">
              <img v-if="series.image_url" v-img-fade :src="series.image_url" :alt="displayName(series)" class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110" loading="lazy" >
              <div v-else class="flex h-full w-full items-center justify-center bg-linear-to-br from-primary/10 to-transparent">
                <Boxes class="h-12 w-12 text-primary/40" />
              </div>
            </div>

            <div class="p-4">
              <p v-if="series.parent" class="mb-0.5 truncate text-xs text-primary">{{ series.parent.name }} ›</p>
              <h3 class="truncate font-bold text-title transition-colors group-hover:text-primary">{{ displayName(series) }}</h3>
              <p v-if="originalName(series)" class="truncate text-xs text-meta">{{ originalName(series) }}</p>
              <div class="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-body">
                <span v-if="series.children_count" class="flex items-center gap-1"><Layers class="h-3.5 w-3.5 text-meta" />{{ $t('catalog.children_count', { count: series.children_count }) }}</span>
                <span class="flex items-center gap-1"><Film class="h-3.5 w-3.5 text-meta" />{{ $t('catalog.entries_count', { count: series.entries_count ?? 0 }) }}</span>
                <span class="flex items-center gap-1"><Disc3 class="h-3.5 w-3.5 text-meta" />{{ $t('catalog.albums_count', { count: series.albums_count ?? 0 }) }}</span>
              </div>
            </div>
          </NuxtLink>
        </div>

        <div v-if="!seriesList.length" class="flex min-h-72 items-center justify-center">
          <UiEmpty :title="$t('catalog.no_series')" :icon="Boxes" />
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
</template>
