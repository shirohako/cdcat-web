<template>
  <div class="min-h-screen">
    <div class="container mx-auto max-w-6xl px-4 py-8 md:px-8 2xl:max-w-7xl">
      <header class="mb-6 flex flex-wrap items-end gap-3">
        <div>
          <h1 class="text-2xl font-bold text-title">{{ $t('labels.title') }}</h1>
          <p class="text-sm text-meta">{{ $t('labels.subtitle') }}</p>
        </div>
        <form class="ml-auto flex items-center gap-2" @submit.prevent="applySearch">
          <CatalogPendingToggle :model-value="includePending" @update:model-value="setIncludePending" />
          <input v-model="search" type="search" class="input input-sm w-56" :placeholder="$t('common.search')">
          <button class="btn btn-sm">{{ $t('common.search') }}</button>
        </form>
      </header>
      <CommonLoadError v-if="status === 'error'" class="mb-4" @retry="refresh()" />
      <CollectionLoadingSkeleton v-if="loading" variant="labels" />
      <CommonPagedList
        v-else-if="data"
        :page="page"
        :total-pages="lastPage"
        :total="data.pagination.total"
        :count="labels.length"
        :per-page="data.pagination.per_page"
        :top-after="12"
        :disabled="refetching"
        @update:page="page = $event"
      >
        <div
          :key="revealKey"
          class="grid grid-cols-1 gap-3 transition-opacity sm:grid-cols-2 lg:grid-cols-3"
          :class="[revealClass, { 'pointer-events-none opacity-60': refetching }]"
          :inert="refetching"
        >
          <NuxtLink v-for="label in labels" :key="label.id" :to="`/labels/${label.id}`" class="card group flex items-center gap-3 p-4 transition-colors duration-150 ease-out hover:bg-card-hover active:bg-card-active">
            <div class="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-sunken">
              <img v-if="label.image_url" :src="label.image_url" :alt="label.name" class="h-full w-full object-contain">
              <div v-else class="flex h-full w-full items-center justify-center text-faint"><Building2 :size="18" /></div>
            </div>
            <div class="min-w-0">
              <p class="flex min-w-0 items-center gap-1.5 text-sm font-semibold text-title transition-colors group-hover:text-primary"><span class="truncate">{{ label.name }}</span><CatalogPendingBadge v-if="label.is_pending" /></p>
              <p class="text-xs text-meta">{{ $t('artists.detail.albums', { count: label.albums_count }) }}</p>
            </div>
          </NuxtLink>
          <p v-if="!labels.length" class="col-span-full py-10 text-center text-sm text-meta">{{ $t('labels.no_results') }}</p>
        </div>
      </CommonPagedList>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Label } from '~/types/label'
import { Building2 } from '@lucide/vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
// Page, search and the pending switch live in the URL, so going back returns to the same list.
const page = useQueryPage()
const query = computed(() => String(route.query.search ?? '').trim())
const search = ref(query.value)
watch(query, (value) => { search.value = value })
const { includePending, setIncludePending } = usePendingToggle()
const { data, status, refresh, loading, refetching, revealKey, revealClass } = await usePageAPI<{ labels: Label[], pagination: { last_page: number, total: number, per_page: number } }>('/v1/labels', {
  query: computed(() => ({ page: page.value, ...(query.value ? { search: query.value } : {}), ...(includePending.value ? { include_pending: 1 } : {}) })),
})
const labels = computed(() => data.value?.labels ?? [])
const lastPage = computed(() => data.value?.pagination.last_page ?? 1)
const applySearch = () => router.push({ query: { ...route.query, search: search.value.trim() || undefined, page: undefined } })
usePageSeo({ title: () => t('labels.title'), description: () => t('seo.pages.labels') })
</script>
