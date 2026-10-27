<template>
  <div class="min-h-screen">
    <div class="container mx-auto max-w-5xl px-4 py-8 md:px-8">
      <form role="search" class="flex flex-wrap items-center gap-3" @submit.prevent="apply">
        <div class="relative min-w-0 flex-1">
          <Search :size="18" class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
          <input
            v-model="input"
            type="search"
            maxlength="100"
            autofocus
            :placeholder="$t('search.placeholder')"
            :aria-label="$t('search.title')"
            class="input h-11 w-full pl-11"
          >
        </div>
        <button type="submit" class="btn btn-primary h-11">{{ $t('search.title') }}</button>
        <CatalogPendingToggle :model-value="includePending" @update:model-value="setPending" />
      </form>
      <p class="mt-2 text-xs text-meta">{{ $t('search.hint') }}</p>

      <template v-if="q">
        <h1 class="mt-6 text-xl font-bold text-title">{{ $t('search.results_for', { q }) }}</h1>

        <nav class="mt-4 flex gap-1 overflow-x-auto border-b border-line text-sm">
          <NuxtLink
            v-for="tab in tabs"
            :key="tab.value"
            :to="{ query: { ...route.query, type: tab.value === 'all' ? undefined : tab.value, page: undefined } }"
            class="-mb-px shrink-0 whitespace-nowrap border-b-2 px-3 py-2 transition-colors duration-150 ease-out"
            :class="(type ?? 'all') === tab.value ? 'border-primary font-semibold text-primary' : 'border-transparent text-meta hover:text-title'"
          >
            {{ tab.label }}<span v-if="tab.count !== null" class="ml-1 text-xs text-meta">{{ tab.count }}</span>
            <span v-else-if="overviewLoading && tab.value !== 'all'" class="skeleton ml-1 inline-block h-2.5 w-4 rounded-full align-middle" aria-hidden="true" />
          </NuxtLink>
        </nav>

        <p v-if="!searchable(q)" class="py-12 text-center text-meta">{{ $t('search.too_short') }}</p>
        <SkeletonRows v-else-if="loading" page class="mt-4" :count="6" thumb="square" />
        <p v-else-if="failed && !shown" class="py-12 text-center text-danger">{{ localizeError(error) }}</p>

        <!-- 全部：每类前几条 -->
        <div
          v-else-if="!type"
          class="mt-4 space-y-6 transition-opacity"
          :class="[overviewRevealClass, { 'pointer-events-none opacity-60': refetching }]"
          :inert="refetching"
        >
          <p v-if="!groups.length" class="py-12 text-center text-meta">{{ $t('search.no_results') }}</p>
          <section v-for="group in groups" :key="group.type">
            <h2 class="flex items-center justify-between text-sm font-semibold text-body">
              <span>{{ $t(`search.types.${group.type}`) }} <span class="font-normal text-meta">{{ countText(group.total, group.total_is_capped) }}</span></span>
              <NuxtLink v-if="group.total > group.items.length" :to="{ query: { ...route.query, type: group.type } }" class="text-xs font-normal text-meta transition-colors duration-150 ease-out hover:text-primary">
                {{ $t('search.more', { count: countText(group.total, group.total_is_capped) }) }}
              </NuxtLink>
            </h2>
            <ul class="card mt-2 divide-y divide-line overflow-hidden">
              <li v-for="item in group.items" :key="item.id" class="transition-colors duration-150 ease-out hover:bg-card-hover active:bg-card-active"><SearchResultItem :result="item" /></li>
            </ul>
          </section>
        </div>

        <!-- 单一类型：分页 -->
        <div v-else class="mt-4">
          <CommonLoadError v-if="failed" class="mb-4" @retry="refreshPaged()" />
          <CommonPagedList
            :page="paged?.pagination.current_page ?? 1"
            :total-pages="paged?.pagination.last_page ?? 1"
            :total="paged?.pagination.total ?? 0"
            :count="results.length"
            :per-page="paged?.pagination.per_page ?? 1"
            :disabled="refetching"
            @update:page="goToPage"
          >
            <p v-if="!results.length" class="py-12 text-center text-meta">{{ $t('search.no_results') }}</p>
            <ul
              v-else
              :key="pagedRevealKey"
              class="card divide-y divide-line overflow-hidden transition-opacity"
              :class="[pagedRevealClass, { 'pointer-events-none opacity-60': refetching }]"
              :inert="refetching"
            >
              <li v-for="item in results" :key="item.id" class="transition-colors duration-150 ease-out hover:bg-card-hover active:bg-card-active"><SearchResultItem :result="item" /></li>
            </ul>
          </CommonPagedList>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
// Site search (docs/api/search.md): every type at a glance, or one type page by page.
// Content awaiting review is included unless ?pending=0.
import type { SearchGroupsResponse, SearchPageResponse, SearchType } from '~/types/search'
import { Search } from '@lucide/vue'
import { SEARCH_TYPES } from '~/types/search'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const { $api } = useNuxtApp()
const { localizeError } = useLocalizedApiError()

const q = computed(() => String(route.query.q ?? '').trim())
const type = computed(() => SEARCH_TYPES.includes(route.query.type as SearchType) ? route.query.type as SearchType : null)
const page = computed(() => Math.max(1, Number.parseInt(String(route.query.page || '1')) || 1))
const includePending = computed(() => route.query.pending !== '0')
const setPending = (on: boolean) => router.push({ query: { ...route.query, pending: on ? undefined : '0', page: undefined } })

const input = ref(q.value)
watch(q, value => { input.value = value })
const apply = () => {
  const text = input.value.trim()
  if (text) router.push({ query: { ...route.query, q: text, page: undefined } })
}
const goToPage = (value: number) => router.push({ query: { ...route.query, page: value > 1 ? value : undefined } })

// The overview is kept while a type is open, so the tabs keep their counts. The type page isn't awaited:
// the server loads both at once.
const {
  data: overview, status: overviewStatus, error: overviewError, loading: overviewLoading,
  refetching: overviewRefetching, revealClass: overviewRevealClass,
} = await usePageData(() => `search-overview-${JSON.stringify([q.value, includePending.value])}`,
  ({ signal, background }) => searchable(q.value)
    ? $api<SearchGroupsResponse>('/v1/search', { query: { q: q.value, limit: 5, include_pending: includePending.value ? 1 : 0 }, signal, progress: !background })
    : Promise.resolve(null))
const {
  data: paged, status: pagedStatus, error: pagedError, refresh: refreshPaged, loading: pagedLoading,
  refetching: pagedRefetching, revealKey: pagedRevealKey, revealClass: pagedRevealClass,
} = usePageData(() => `search-page-${JSON.stringify([q.value, type.value, page.value, includePending.value])}`,
  ({ signal, background }) => type.value && searchable(q.value)
    ? $api<SearchPageResponse>('/v1/search', { query: { q: q.value, type: type.value, page: page.value, include_pending: includePending.value ? 1 : 0 }, signal, progress: !background })
    : Promise.resolve(null))

/** The part on screen: the overview, or one type's page. */
const shown = computed(() => type.value ? paged.value : overview.value)
const loading = computed(() => type.value ? pagedLoading.value : overviewLoading.value)
const refetching = computed(() => type.value ? pagedRefetching.value : overviewRefetching.value)
const failed = computed(() => (type.value ? pagedStatus.value : overviewStatus.value) === 'error')
const error = computed(() => type.value ? pagedError.value : overviewError.value)
const groups = computed(() => (overview.value?.groups ?? []).filter(group => group.items.length))
const results = computed(() => paged.value?.results ?? [])

const countText = (total: number, capped: boolean) => capped ? t('search.capped', { count: total }) : String(total)
const tabs = computed(() => [
  { value: 'all', label: t('search.all'), count: null as string | null },
  ...SEARCH_TYPES.map((value) => {
    const group = overview.value?.groups.find(entry => entry.type === value)
    return { value, label: t(`search.types.${value}`), count: group ? countText(group.total, group.total_is_capped) : null }
  }),
])

useHead({ title: computed(() => q.value ? t('search.results_for', { q: q.value }) : t('search.title')) })
useSeoMeta({ robots: 'noindex' })
</script>
