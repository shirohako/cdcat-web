<script setup lang="ts">
import type { HarvestCoverageBooth, HarvestEventSummary, HarvestPagination } from '~/types/harvest'

/** Booths of one event and how many candidates each has there; the event is the page's event_id. */
const { $api } = useNuxtApp()
const harvestCoverageFilterLabels: Record<string, string> = { none: '没有候选的', mentioned: '简介提到新譜但没有候选的', all: '全部社团' }
const route = useRoute()
const router = useRouter()

const eventId = computed({
  get: () => /^\d+$/.test(String(route.query.event_id ?? '')) ? String(route.query.event_id) : '',
  set: value => router.push({ query: { ...route.query, event_id: value || undefined } }),
})
const filter = ref<'none' | 'mentioned' | 'all'>('none')
const q = ref('')
const page = ref(1)
watch([filter, q, eventId], () => { page.value = 1 })
const query = computed(() => ({ event_id: eventId.value, filter: filter.value, q: q.value || undefined, page: page.value }))
const { data, pending, error, refresh } = await useAsyncData(
  () => `admin-harvest-coverage-${JSON.stringify(query.value)}`,
  () => eventId.value
    ? $api<{ booths: HarvestCoverageBooth[], pagination: HarvestPagination, event: HarvestEventSummary, summary: { booths: number, covered: number } }>('/v1/admin/harvest/coverage', { query: query.value })
    : Promise.resolve(null),
  { watch: [query] },
)
const linkLabel = (url: string) => url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center gap-2 text-sm">
      <AdminHarvestEventSelect v-model="eventId" :allow-all="false" search />
    </div>
    <p v-if="!eventId" class="max-w-3xl text-sm text-slate-600">选一届活动，查看它的参展社团里哪些还没有候选。没有候选的活动可以用「搜索其他活动」找到。</p>
    <template v-else>
      <p v-if="data" class="max-w-3xl text-sm text-slate-600">{{ data.event.name }} 的参展社团中，有 {{ data.summary.covered }} / {{ data.summary.booths }} 个已有候选。下面列出还没有候选的社团，可以按它们的链接手动补录。</p>
      <div class="flex flex-wrap items-center gap-2 text-sm">
        <button v-for="value in (['none', 'mentioned', 'all'] as const)" :key="value" type="button" class="rounded-full px-3 py-1" :class="filter === value ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'" @click="filter = value">
          {{ harvestCoverageFilterLabels[value] }}
        </button>
        <input v-model.lazy="q" type="search" placeholder="社团名" class="w-56 rounded-lg border border-slate-300 px-2 py-1.5">
        <span class="text-slate-500">{{ data?.pagination.total ?? 0 }}</span>
      </div>
      <section class="rounded-xl border border-slate-200 bg-white">
        <AdminListState :pending="pending" :error="error" :empty="!data?.booths.length" @retry="refresh()">
          <ul class="divide-y divide-slate-100">
            <li v-for="circle in data?.booths" :key="circle.id" class="grid gap-2 px-4 py-3 text-sm sm:grid-cols-[10rem_1fr]">
              <div>
                <p class="font-medium">{{ circle.name }}</p>
                <p class="text-xs text-slate-500">{{ circle.space_code ?? '—' }} · {{ circle.candidates }} 条候选</p>
              </div>
              <div class="min-w-0 space-y-1">
                <p v-if="circle.description" class="line-clamp-3 whitespace-pre-line text-xs text-slate-600">{{ circle.description }}</p>
                <p class="flex flex-wrap gap-x-3 gap-y-1 text-xs">
                  <a v-for="link in circle.links" :key="link.url" :href="link.url" target="_blank" rel="noopener noreferrer" class="max-w-64 truncate text-sky-700 hover:underline">{{ linkLabel(link.url) }}</a>
                  <a v-for="embed in circle.embeds.filter(e => e.type === 'youtube')" :key="embed.id" :href="`https://www.youtube.com/watch?v=${embed.id}`" target="_blank" rel="noopener noreferrer" class="text-rose-700 hover:underline">试听视频</a>
                </p>
              </div>
            </li>
          </ul>
        </AdminListState>
      </section>
      <CommonPagination v-if="(data?.pagination.last_page ?? 1) > 1" v-model:page="page" :total-pages="data!.pagination.last_page" />
    </template>
  </div>
</template>
