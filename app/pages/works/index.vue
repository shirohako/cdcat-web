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
          <CatalogPendingToggle v-model="includePending" />
          <input v-model="search" type="search" class="input input-sm w-56" :placeholder="$t('common.search')">
          <button class="btn btn-sm">{{ $t('common.search') }}</button>
        </form>
      </header>
      <div v-if="pending" class="flex justify-center py-10"><span class="loading loading-spinner" /></div>
      <ul v-else class="divide-y divide-gray-100 rounded-xl border border-gray-100 bg-white">
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
      <CommonPagination class="mt-6" :page="page" :total-pages="lastPage" :disabled="pending" @update:page="page = $event" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { WorkSimple } from '~/types/work'
import { Music } from '@lucide/vue'

const { t } = useI18n()
const route = useRoute()
const { isAuthenticated } = useAuth()
const search = ref(String(route.query.search ?? ''))
const query = ref(search.value)
const page = ref(1)
const includePending = ref(false)
watch(includePending, () => { page.value = 1 })
const { data, pending } = await useAPI<{ works: WorkSimple[], pagination: { last_page: number } }>('/v1/works', {
  query: computed(() => ({ page: page.value, per_page: 30, ...(query.value ? { search: query.value } : {}), ...(includePending.value ? { include_pending: 1 } : {}) })),
})
const works = computed(() => data.value?.works ?? [])
const lastPage = computed(() => data.value?.pagination.last_page ?? 1)
const applySearch = () => {
  query.value = search.value.trim()
  page.value = 1
}
useHead({ title: computed(() => t('works.title')) })
</script>
