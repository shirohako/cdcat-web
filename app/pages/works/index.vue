<template>
  <div class="min-h-screen bg-base-100">
    <div class="container mx-auto max-w-6xl px-4 py-8 md:px-8 2xl:max-w-7xl">
      <header class="mb-6 flex flex-wrap items-end gap-3">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">{{ $t('works.title') }}</h1>
          <p class="text-sm text-gray-500">{{ $t('works.subtitle') }}</p>
        </div>
        <NuxtLink v-if="isAuthenticated" to="/works/duplicates" class="ml-auto text-sm text-gray-500 hover:text-gray-900 hover:underline">{{ $t('works.duplicates.title') }}</NuxtLink>
        <form class="flex items-center gap-2" :class="{ 'ml-auto': !isAuthenticated }" @submit.prevent="applySearch">
          <CatalogPendingToggle :model-value="includePending" @update:model-value="setIncludePending" />
          <input v-model="search" type="search" class="input input-sm w-56" :placeholder="$t('common.search')">
          <button class="btn btn-sm">{{ $t('common.search') }}</button>
        </form>
      </header>
      <CommonLoadError v-if="status === 'error'" class="mb-4" @retry="refresh()" />
      <SkeletonRows v-if="loading" page :count="10" />
      <ul
        v-else-if="data"
        :key="revealKey"
        class="divide-y divide-gray-100 rounded-xl border border-gray-100 bg-white transition-opacity"
        :class="[revealClass, { 'pointer-events-none opacity-60': refetching }]"
        :inert="refetching"
      >
        <li v-for="work in works" :key="work.id">
          <NuxtLink :to="`/works/${work.id}`" class="flex items-center gap-3 px-5 py-3 hover:bg-gray-50">
            <Music :size="16" class="shrink-0 text-indigo-400" />
            <span class="min-w-0 flex-1 truncate text-sm font-medium text-gray-800">{{ work.title }}</span>
            <CatalogPendingBadge v-if="work.is_pending" />
            <span class="shrink-0 text-xs text-gray-400">{{ $t('works.recordings', { count: work.tracks_count }) }}</span>
            <span v-if="work.has_lyrics" class="shrink-0 rounded-full bg-sky-50 px-1.5 py-0.5 text-[10px] text-sky-600">{{ $t('album.tracklist.lyric') }}</span>
          </NuxtLink>
        </li>
        <li v-if="!works.length" class="px-5 py-10 text-center text-sm text-gray-400">{{ $t('works.no_results') }}</li>
      </ul>
      <CommonPagination class="mt-6" :page="page" :total-pages="lastPage" :disabled="refetching" @update:page="page = $event" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { WorkSimple } from '~/types/work'
import { Music } from '@lucide/vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const { isAuthenticated } = useAuth()
// Page, search and the pending switch live in the URL, so going back returns to the same list.
const page = useQueryPage()
const query = computed(() => String(route.query.search ?? '').trim())
const search = ref(query.value)
watch(query, (value) => { search.value = value })
const { includePending, setIncludePending } = usePendingToggle()
const { data, status, refresh, loading, refetching, revealKey, revealClass } = await usePageAPI<{ works: WorkSimple[], pagination: { last_page: number } }>('/v1/works', {
  query: computed(() => ({ page: page.value, per_page: 30, ...(query.value ? { search: query.value } : {}), ...(includePending.value ? { include_pending: 1 } : {}) })),
})
const works = computed(() => data.value?.works ?? [])
const lastPage = computed(() => data.value?.pagination.last_page ?? 1)
const applySearch = () => router.push({ query: { ...route.query, search: search.value.trim() || undefined, page: undefined } })
useHead({ title: computed(() => t('works.title')) })
</script>
