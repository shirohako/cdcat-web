<script setup lang="ts">
import { Boxes, Disc3, Film, Layers, Plus, Search } from '@lucide/vue'
import type { FranchiseSummary, Pagination } from '~/types/entry'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const { displayName, originalName } = useEntryDisplay()

useHead({ title: computed(() => t('content_display.series')) })

const currentPage = computed(() => Math.max(1, Number.parseInt(route.query.page as string || '1') || 1))
const search = computed(() => (route.query.search as string) || '')
const searchInput = ref(search.value)
watch(search, (value) => { searchInput.value = value })

// Top-level series only, unless searching (then sub-series match too).
const { includePending, setIncludePending } = usePendingToggle()
const { data, pending, error } = useAPI<{ franchises: FranchiseSummary[], pagination: Pagination }>('/v1/franchises', {
  lazy: true,
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
          :title="$t('content_display.series')"
          :description="$t('content_display.series_desc')"
          icon="lucide:boxes"
          tone="emerald"
        >
          <template #action>
            <button
              class="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 p-0 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-slate-700 sm:h-9 sm:w-auto sm:gap-2 sm:px-3.5"
              @click="navigateTo('/contribute/franchise')"
            >
              <Plus class="h-3.5 w-3.5" />
              <span class="hidden sm:inline">{{ $t('common.new') }}</span>
            </button>
          </template>
        </CollectionPageHeader>
        <form class="flex items-center gap-2 border-b border-slate-100 px-4 py-3 sm:px-6" role="search" @submit.prevent="submitSearch">
          <label class="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-lg bg-white px-3 ring-1 ring-slate-200 focus-within:ring-emerald-300">
            <Search class="h-4 w-4 shrink-0 text-slate-400" />
            <input v-model="searchInput" type="search" class="min-w-0 flex-1 bg-transparent text-sm outline-none" :placeholder="$t('catalog.search_placeholder')" :aria-label="$t('catalog.search')" >
          </label>
          <button type="submit" class="h-9 shrink-0 rounded-lg bg-slate-900 px-3 text-xs font-semibold text-white hover:bg-slate-700">{{ $t('catalog.search') }}</button>
          <CatalogPendingToggle :model-value="includePending" @update:model-value="setIncludePending" />
        </form>
      </template>

      <CollectionLoadingSkeleton v-if="pending" variant="wide" />

      <div v-else-if="error" class="flex min-h-72 items-center justify-center text-sm text-red-600">
        {{ $t('common.load_failed') }}
      </div>

      <div v-else class="collection-content-enter">
        <div class="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
          <NuxtLink
            v-for="series in seriesList"
            :key="series.id"
            :to="`/franchises/${series.id}`"
            class="group block overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
          >
            <div class="relative aspect-video overflow-hidden bg-gray-100">
              <img v-if="series.image_url" :src="series.image_url" :alt="displayName(series)" class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110" loading="lazy" >
              <div v-else class="flex h-full w-full items-center justify-center bg-linear-to-br from-emerald-50 to-gray-100">
                <Boxes class="h-12 w-12 text-emerald-300" />
              </div>
            </div>

            <div class="p-4">
              <p v-if="series.parent" class="mb-0.5 truncate text-xs text-emerald-700">{{ series.parent.name }} ›</p>
              <h3 class="truncate font-bold text-gray-800 transition-colors group-hover:text-emerald-700">{{ displayName(series) }}</h3>
              <p v-if="originalName(series)" class="truncate text-xs text-gray-500">{{ originalName(series) }}</p>
              <div class="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-600">
                <span v-if="series.children_count" class="flex items-center gap-1"><Layers class="h-3.5 w-3.5 text-gray-400" />{{ $t('catalog.children_count', { count: series.children_count }) }}</span>
                <span class="flex items-center gap-1"><Film class="h-3.5 w-3.5 text-gray-400" />{{ $t('catalog.entries_count', { count: series.entries_count ?? 0 }) }}</span>
                <span class="flex items-center gap-1"><Disc3 class="h-3.5 w-3.5 text-gray-400" />{{ $t('catalog.albums_count', { count: series.albums_count ?? 0 }) }}</span>
              </div>
            </div>
          </NuxtLink>
        </div>

        <div v-if="!seriesList.length" class="flex min-h-72 flex-col items-center justify-center text-center">
          <Boxes :size="56" class="mx-auto mb-4 text-gray-300" />
          <p class="text-gray-500">{{ $t('catalog.no_series') }}</p>
        </div>

        <CommonPagination
          class="mt-6"
          :page="pagination.current_page"
          :total-pages="pagination.last_page"
          :disabled="pending"
          @update:page="goToPage"
        />
      </div>
    </CollectionPageCard>
  </div>
</template>
