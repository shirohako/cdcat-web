<script setup lang="ts">
import { Calendar, Film, Music2, Plus, Search } from '@lucide/vue'
import { ENTRY_FORMATS, ENTRY_TYPES, ENTRY_TYPE_ICONS, type EntrySummary, type EntryType, type Pagination } from '~/types/entry'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const { displayName, originalName, typeLabel, formatLabel, typeWithFormat, formatReleaseDate } = useEntryDisplay()

useHead({ title: computed(() => t('menu.entry')) })

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

const { data, pending, error } = useAPI<{ entries: EntrySummary[], pagination: Pagination }>('/v1/entries', {
  lazy: true,
  query: computed(() => ({
    page: currentPage.value,
    per_page: 20,
    type: selectedType.value === 'all' ? undefined : selectedType.value,
    format: selectedFormat.value || undefined,
    search: search.value.trim().length >= 2 ? search.value.trim() : undefined,
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
  <div class="min-h-screen bg-base-100">
    <div class="container mx-auto max-w-6xl px-4 py-8 md:px-8 2xl:max-w-7xl">
      <CollectionPageCard>
        <template #header>
          <CollectionPageHeader
            :model-value="selectedType"
            :title="$t('menu.entry')"
            :description="$t('content_display.entry_desc')"
            icon="lucide:panels-top-left"
            tone="rose"
            :filters="typeFilters"
            :filter-label="$t('catalog.type')"
            @update:model-value="selectType"
          >
            <template #action>
              <button
                class="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 p-0 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-slate-700 sm:h-9 sm:w-auto sm:gap-2 sm:px-3.5"
                @click="navigateTo('/contribute/entry')"
              >
                <Plus class="h-3.5 w-3.5" />
                <span class="hidden sm:inline">{{ $t('common.new') }}</span>
              </button>
            </template>
          </CollectionPageHeader>
          <div class="flex flex-col gap-2.5 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:px-6">
            <form class="flex min-w-0 flex-1 items-center gap-2" role="search" @submit.prevent="submitSearch">
              <label class="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-lg bg-white px-3 ring-1 ring-slate-200 focus-within:ring-rose-300">
                <Search class="h-4 w-4 shrink-0 text-slate-400" />
                <input v-model="searchInput" type="search" class="min-w-0 flex-1 bg-transparent text-sm outline-none" :placeholder="$t('catalog.search_placeholder')" :aria-label="$t('catalog.search')" >
              </label>
              <button type="submit" class="h-9 shrink-0 rounded-lg bg-slate-900 px-3 text-xs font-semibold text-white hover:bg-slate-700">{{ $t('catalog.search') }}</button>
            </form>
            <div v-if="formats.length" class="flex gap-1.5 overflow-x-auto">
              <button
                v-for="format in formats"
                :key="format"
                type="button"
                class="h-8 shrink-0 rounded-lg px-3 text-xs font-medium ring-1 ring-inset transition-colors"
                :class="selectedFormat === format ? 'bg-rose-600 text-white ring-rose-600' : 'bg-white text-slate-500 ring-slate-200 hover:text-slate-900'"
                :aria-pressed="selectedFormat === format"
                @click="selectFormat(format)"
              >
                {{ formatLabel(format) }}
              </button>
            </div>
          </div>
        </template>

        <CollectionLoadingSkeleton v-if="pending" variant="list" />

        <div v-else-if="error" class="flex min-h-72 items-center justify-center text-sm text-red-600">
          {{ $t('common.load_failed') }}
        </div>

        <div v-else class="collection-content-enter">
          <div class="space-y-3">
            <NuxtLink v-for="entry in entries" :key="entry.id" :to="`/entries/${entry.id}`" class="group block">
              <article class="flex gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-shadow duration-300 hover:shadow-lg">
                <div class="relative h-32 w-22 shrink-0 overflow-hidden rounded-lg bg-linear-to-br from-gray-50 to-gray-100">
                  <img v-if="entry.image_url" :src="entry.image_url" :alt="displayName(entry)" class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" >
                  <div v-else class="flex h-full items-center justify-center text-gray-300">
                    <Film :size="36" />
                  </div>
                </div>

                <div class="flex min-w-0 flex-1 flex-col justify-between gap-2">
                  <div>
                    <div class="mb-1 flex flex-wrap items-center gap-2">
                      <span class="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700">
                        <Icon :name="ENTRY_TYPE_ICONS[entry.type] || 'lucide:shapes'" class="h-3 w-3" />
                        {{ typeWithFormat(entry.type, entry.format) }}
                      </span>
                      <span v-for="platform in (entry.platforms || []).slice(0, 3)" :key="platform" class="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{{ platform }}</span>
                    </div>
                    <h3 class="line-clamp-2 text-lg font-bold transition-colors group-hover:text-rose-600">{{ displayName(entry) }}</h3>
                    <p v-if="originalName(entry)" class="truncate text-sm text-gray-500">{{ originalName(entry) }}</p>
                    <p v-if="entry.description" class="mt-1 line-clamp-2 text-sm text-gray-600">{{ entry.description }}</p>
                  </div>

                  <div class="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                    <span v-if="entry.release_date" class="flex items-center gap-1.5">
                      <Calendar :size="15" class="text-gray-400" />
                      {{ formatReleaseDate(entry.release_date, entry.release_date_precision) }}
                    </span>
                    <span class="flex items-center gap-1.5">
                      <Music2 :size="15" class="text-gray-400" />
                      {{ $t('catalog.works_count', { count: entry.works_count ?? 0 }) }}
                    </span>
                  </div>
                </div>
              </article>
            </NuxtLink>
          </div>

          <div v-if="!entries.length" class="flex min-h-72 flex-col items-center justify-center text-center">
            <Film :size="56" class="mx-auto mb-4 text-gray-300" />
            <p class="text-gray-500">{{ $t('catalog.no_entries') }}</p>
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
  </div>
</template>
