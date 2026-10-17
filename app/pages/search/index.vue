<template>
  <div class="min-h-screen bg-base-100">
    <div class="container mx-auto max-w-5xl px-4 py-8 md:px-8">
      <form role="search" class="flex flex-wrap items-center gap-3" @submit.prevent="apply">
        <div class="relative min-w-0 flex-1">
          <Search :size="18" class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            v-model="input"
            type="search"
            maxlength="100"
            autofocus
            :placeholder="$t('search.placeholder')"
            :aria-label="$t('search.title')"
            class="input input-bordered h-11 w-full pl-11"
          >
        </div>
        <button type="submit" class="btn h-11 bg-slate-900 text-white hover:bg-slate-700">{{ $t('search.title') }}</button>
        <CatalogPendingToggle :model-value="includePending" @update:model-value="setPending" />
      </form>
      <p class="mt-2 text-xs text-gray-500">{{ $t('search.hint') }}</p>

      <template v-if="q">
        <h1 class="mt-6 text-xl font-bold text-gray-900">{{ $t('search.results_for', { q }) }}</h1>

        <nav class="mt-4 flex gap-1 overflow-x-auto border-b border-gray-200 text-sm">
          <NuxtLink
            v-for="tab in tabs"
            :key="tab.value"
            :to="{ query: { ...route.query, type: tab.value === 'all' ? undefined : tab.value, page: undefined } }"
            class="-mb-px shrink-0 whitespace-nowrap border-b-2 px-3 py-2"
            :class="(type ?? 'all') === tab.value ? 'border-gray-900 font-semibold text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-800'"
          >
            {{ tab.label }}<span v-if="tab.count !== null" class="ml-1 text-xs text-gray-400">{{ tab.count }}</span>
          </NuxtLink>
        </nav>

        <p v-if="!searchable(q)" class="py-12 text-center text-gray-500">{{ $t('search.too_short') }}</p>
        <CollectionLoadingSkeleton v-else-if="pending" variant="list" />
        <p v-else-if="error" class="py-12 text-center text-red-600">{{ localizeError(error) }}</p>

        <!-- 全部：每类前几条 -->
        <div v-else-if="!type" class="mt-4 space-y-6">
          <p v-if="!groups.length" class="py-12 text-center text-gray-500">{{ $t('search.no_results') }}</p>
          <section v-for="group in groups" :key="group.type">
            <h2 class="flex items-center justify-between text-sm font-semibold text-gray-700">
              <span>{{ $t(`search.types.${group.type}`) }} <span class="font-normal text-gray-400">{{ countText(group.total, group.total_is_capped) }}</span></span>
              <NuxtLink v-if="group.total > group.items.length" :to="{ query: { ...route.query, type: group.type } }" class="text-xs font-normal text-gray-500 hover:text-gray-900">
                {{ $t('search.more', { count: countText(group.total, group.total_is_capped) }) }}
              </NuxtLink>
            </h2>
            <ul class="mt-2 divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
              <li v-for="item in group.items" :key="item.id" class="hover:bg-gray-50"><SearchResultItem :result="item" /></li>
            </ul>
          </section>
        </div>

        <!-- 单一类型：分页 -->
        <div v-else class="mt-4">
          <p v-if="!results.length" class="py-12 text-center text-gray-500">{{ $t('search.no_results') }}</p>
          <ul v-else class="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
            <li v-for="item in results" :key="item.id" class="hover:bg-gray-50"><SearchResultItem :result="item" /></li>
          </ul>
          <CommonPagination
            v-if="paged"
            class="mt-6"
            :page="paged.pagination.current_page"
            :total-pages="paged.pagination.last_page"
            :disabled="pending"
            @update:page="goToPage"
          />
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

// The overview is kept while a type is open, so the tabs keep their counts.
const { data: overview, pending: overviewPending, error: overviewError } = await useAsyncData('search-overview',
  () => searchable(q.value)
    ? $api<SearchGroupsResponse>('/v1/search', { query: { q: q.value, limit: 5, include_pending: includePending.value ? 1 : 0 } })
    : Promise.resolve(null),
  { watch: [q, includePending] })
const { data: paged, pending: pagedPending, error: pagedError } = await useAsyncData('search-page',
  () => type.value && searchable(q.value)
    ? $api<SearchPageResponse>('/v1/search', { query: { q: q.value, type: type.value, page: page.value, include_pending: includePending.value ? 1 : 0 } })
    : Promise.resolve(null),
  { watch: [q, type, page, includePending] })

const pending = computed(() => type.value ? pagedPending.value : overviewPending.value)
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
