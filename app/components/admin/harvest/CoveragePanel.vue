<script setup lang="ts">
import type { HarvestCoverageCircle, HarvestPagination } from '~/types/harvest'

const props = defineProps<{ eventId: number }>()
const { $api } = useNuxtApp()
const { t } = useAdminI18n()

const filter = ref<'none' | 'mentioned' | 'all'>('none')
const q = ref('')
const page = ref(1)
watch([filter, q], () => { page.value = 1 })
const query = computed(() => ({ filter: filter.value, q: q.value || undefined, page: page.value }))
const { data, pending, error, refresh } = await useAsyncData(
  () => `admin-harvest-coverage-${props.eventId}-${JSON.stringify(query.value)}`,
  () => $api<{ circles: HarvestCoverageCircle[], pagination: HarvestPagination, summary: { circles: number, covered: number } }>(`/v1/admin/harvest/events/${props.eventId}/coverage`, { query: query.value }),
  { watch: [query] },
)
const linkLabel = (url: string) => url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')
</script>

<template>
  <div class="space-y-4">
    <p v-if="data" class="max-w-3xl text-sm text-slate-600">{{ t('admin_pages.harvest.coverage.description', { covered: data.summary.covered, total: data.summary.circles }) }}</p>
    <div class="flex flex-wrap items-center gap-2 text-sm">
      <button v-for="value in (['none', 'mentioned', 'all'] as const)" :key="value" type="button" class="rounded-full px-3 py-1" :class="filter === value ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'" @click="filter = value">
        {{ t(`admin_pages.harvest.coverage.filter.${value}`) }}
      </button>
      <input v-model.lazy="q" type="search" :placeholder="t('admin_pages.harvest.coverage.search')" class="w-56 rounded-lg border border-slate-300 px-2 py-1.5">
      <span class="text-slate-500">{{ data?.pagination.total ?? 0 }}</span>
    </div>
    <section class="rounded-xl border border-slate-200 bg-white">
      <AdminListState :pending="pending" :error="error" :empty="!data?.circles.length" @retry="refresh()">
        <ul class="divide-y divide-slate-100">
          <li v-for="circle in data?.circles" :key="circle.id" class="grid gap-2 px-4 py-3 text-sm sm:grid-cols-[10rem_1fr]">
            <div>
              <p class="font-medium">{{ circle.name }}</p>
              <p class="text-xs text-slate-500">{{ circle.space_code ?? '—' }} · {{ t('admin_pages.harvest.coverage.candidates', { count: circle.candidates }) }}</p>
            </div>
            <div class="min-w-0 space-y-1">
              <p v-if="circle.description" class="line-clamp-3 whitespace-pre-line text-xs text-slate-600">{{ circle.description }}</p>
              <p class="flex flex-wrap gap-x-3 gap-y-1 text-xs">
                <a v-for="link in circle.links" :key="link.url" :href="link.url" target="_blank" rel="noopener noreferrer" class="max-w-64 truncate text-sky-700 hover:underline">{{ linkLabel(link.url) }}</a>
                <a v-for="embed in circle.embeds.filter(e => e.type === 'youtube')" :key="embed.id" :href="`https://www.youtube.com/watch?v=${embed.id}`" target="_blank" rel="noopener noreferrer" class="text-rose-700 hover:underline">{{ t('admin_pages.harvest.coverage.xfd') }}</a>
              </p>
            </div>
          </li>
        </ul>
      </AdminListState>
    </section>
    <CommonPagination v-if="(data?.pagination.last_page ?? 1) > 1" v-model:page="page" :total-pages="data!.pagination.last_page" />
  </div>
</template>
