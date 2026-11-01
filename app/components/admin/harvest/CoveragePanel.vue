<script setup lang="ts">
import type { HarvestCoverageBooth, HarvestCoverageSummary, HarvestEventSummary, HarvestPagination } from '~/types/harvest'

/** Booths of one event, how many candidates each has there and how the two met; the event is the page's event_id. */
const { $api } = useNuxtApp()
const harvestCoverageFilterLabels: Record<string, string> = { none: '没有候选的', mentioned: '简介提到新譜但没有候选的', covered: '有候选的', all: '全部社团' }
const route = useRoute()
const router = useRouter()

const eventId = computed({
  get: () => /^\d+$/.test(String(route.query.event_id ?? '')) ? String(route.query.event_id) : '',
  set: value => router.push({ query: { ...route.query, event_id: value || undefined } }),
})
const filter = ref<'none' | 'mentioned' | 'covered' | 'all'>('none')
const q = ref('')
const page = ref(1)
watch([filter, q, eventId], () => { page.value = 1 })
const query = computed(() => ({ event_id: eventId.value, filter: filter.value, q: q.value || undefined, page: page.value }))
const { data, pending, error, refresh } = await useAsyncData(
  () => `admin-harvest-coverage-${JSON.stringify(query.value)}`,
  () => eventId.value
    ? $api<{ booths: HarvestCoverageBooth[], pagination: HarvestPagination, event: HarvestEventSummary, summary: HarvestCoverageSummary }>('/v1/admin/harvest/coverage', { query: query.value })
    : Promise.resolve(null),
  { watch: [query] },
)
const linkLabel = (url: string) => url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')
const percent = (part: number, whole: number) => whole ? `${Math.round(part / whole * 100)}%` : '—'
/** The figures above the list, each with the list or the candidates it counts. */
const figures = computed(() => {
  const summary = data.value?.summary
  if (!summary) return []
  const candidates = (circle?: string) => ({ path: '/admin/harvest/candidates', query: { event_id: eventId.value, circle } })
  return [
    { label: '参展社团', value: summary.booths, note: '', to: null, filter: 'all' as const },
    { label: '有候选的社团', value: summary.covered, note: percent(summary.covered, summary.booths), to: null, filter: 'covered' as const },
    { label: '其中已有艺术家', value: summary.covered_with_artist, note: '其余在审核通过时新建', to: null, filter: null },
    { label: '其中像合摊', value: summary.covered_shared, note: '审核时逐个设置社团', to: null, filter: null },
    { label: '这届的待审候选', value: summary.candidates, note: '', to: candidates(), filter: null },
    { label: '对上摊位的候选', value: summary.candidates_with_booth, note: percent(summary.candidates_with_booth, summary.candidates), to: candidates('booth'), filter: null },
    { label: '没对上摊位的候选', value: summary.candidates - summary.candidates_with_booth, note: '', to: candidates('no_booth'), filter: null },
  ]
})
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center gap-2 text-sm">
      <AdminHarvestEventSelect v-model="eventId" :allow-all="false" search />
    </div>
    <p v-if="!eventId" class="max-w-3xl text-sm text-slate-600">选一届活动，查看它的参展社团里哪些还没有候选。没有候选的活动可以用「搜索其他活动」找到。</p>
    <template v-else>
      <p v-if="data" class="max-w-3xl text-sm text-slate-600">{{ data.event.name }} 的参展社团和候选对上了多少。下面默认列出还没有候选的社团，可以按它们的链接手动补录。</p>
      <dl v-if="data" class="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-7">
        <component
          :is="figure.to ? resolveComponent('NuxtLink') : figure.filter ? 'button' : 'div'"
          v-for="figure in figures" :key="figure.label"
          :to="figure.to ?? undefined" :type="figure.filter ? 'button' : undefined"
          class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-left"
          :class="{ 'transition-colors hover:bg-slate-50': figure.to || figure.filter, 'ring-2 ring-slate-900': figure.filter && filter === figure.filter }"
          @click="figure.filter && (filter = figure.filter)"
        >
          <dt class="text-xs text-slate-500">{{ figure.label }}</dt>
          <dd class="mt-0.5 text-lg font-semibold tabular-nums">{{ figure.value }}<span v-if="figure.note" class="ml-1.5 text-xs font-normal text-slate-500">{{ figure.note }}</span></dd>
        </component>
      </dl>
      <div class="flex flex-wrap items-center gap-2 text-sm">
        <button v-for="value in (['none', 'mentioned', 'covered', 'all'] as const)" :key="value" type="button" class="rounded-full px-3 py-1" :class="filter === value ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'" @click="filter = value">
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
                <p class="text-xs text-slate-500">
                  {{ circle.space_code ?? '—' }} ·
                  <NuxtLink v-if="circle.candidates" :to="{ path: '/admin/harvest/candidates', query: { event_id: eventId, booth_id: circle.id } }" class="text-sky-700 hover:underline">{{ circle.candidates }} 条候选</NuxtLink>
                  <template v-else>0 条候选</template>
                </p>
                <p v-if="circle.candidates" class="text-xs" :class="circle.artist_ids.length ? 'text-emerald-700' : 'text-slate-500'">
                  {{ circle.artist_ids.length ? '已有艺术家' : circle.shared ? '像合摊，审核时逐个设置' : '审核通过时新建艺术家' }}
                </p>
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
