<template>
  <div class="min-h-screen bg-base-100">
    <div class="container mx-auto max-w-6xl px-4 py-8 md:px-8 2xl:max-w-7xl">
      <header class="mb-6 flex flex-wrap items-end gap-3">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">{{ $t('labels.title') }}</h1>
          <p class="text-sm text-gray-500">{{ $t('labels.subtitle') }}</p>
        </div>
        <form class="ml-auto flex items-center gap-2" @submit.prevent="applySearch">
          <CatalogPendingToggle v-model="includePending" />
          <input v-model="search" type="search" class="input input-sm w-56" :placeholder="$t('common.search')">
          <button class="btn btn-sm">{{ $t('common.search') }}</button>
        </form>
      </header>
      <div v-if="pending" class="flex justify-center py-10"><span class="loading loading-spinner" /></div>
      <div v-else class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <NuxtLink v-for="label in labels" :key="label.id" :to="`/labels/${label.id}`" class="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-4 hover:shadow-md">
          <div class="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-gray-50">
            <img v-if="label.image_url" :src="label.image_url" :alt="label.name" class="h-full w-full object-contain">
            <div v-else class="flex h-full w-full items-center justify-center text-gray-300"><Building2 :size="18" /></div>
          </div>
          <div class="min-w-0">
            <p class="flex min-w-0 items-center gap-1.5 text-sm font-semibold text-gray-800"><span class="truncate">{{ label.name }}</span><CatalogPendingBadge v-if="label.is_pending" /></p>
            <p class="text-xs text-gray-400">{{ $t('artists.detail.albums', { count: label.albums_count }) }}</p>
          </div>
        </NuxtLink>
        <p v-if="!labels.length" class="col-span-full py-10 text-center text-sm text-gray-400">{{ $t('labels.no_results') }}</p>
      </div>
      <CommonPagination class="mt-6" :page="page" :total-pages="lastPage" :disabled="pending" @update:page="page = $event" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Label } from '~/types/label'
import { Building2 } from '@lucide/vue'

const { t } = useI18n()
const search = ref('')
const query = ref('')
const page = ref(1)
const includePending = ref(false)
watch(includePending, () => { page.value = 1 })
const { data, pending } = await useAPI<{ labels: Label[], pagination: { last_page: number } }>('/v1/labels', {
  query: computed(() => ({ page: page.value, ...(query.value ? { search: query.value } : {}), ...(includePending.value ? { include_pending: 1 } : {}) })),
})
const labels = computed(() => data.value?.labels ?? [])
const lastPage = computed(() => data.value?.pagination.last_page ?? 1)
const applySearch = () => {
  query.value = search.value.trim()
  page.value = 1
}
useHead({ title: computed(() => t('labels.title')) })
</script>
