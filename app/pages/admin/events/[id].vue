<script setup lang="ts">
import type { EventBooth, EventDetail, VenueMapData } from '~/types/event'
import type { EventImportRun } from '~/types/eventImport'

definePageMeta({ layout: 'admin', middleware: 'admin' })

interface AdminHall { id: number, building: string, floor: string | null, name: string, sort_order: number, spaces_count: number }

const route = useRoute()
const router = useRouter()
const eventId = Number(route.params.id)
const { $api } = useNuxtApp()
const eventVenueTabLabels: Record<string, string> = { import: '导入', booths: '摊位', venue: '会场' }

const { data: event, error: eventError } = await useAsyncData(`admin-event-${eventId}`, () => $api<EventDetail>(`/v1/events/${eventId}`))

type Tab = 'import' | 'booths' | 'venue'
const tab = computed<Tab>({
  get: () => (['import', 'booths', 'venue'] as const).includes(route.query.tab as Tab) ? route.query.tab as Tab : 'import',
  set: value => router.replace({ query: { ...route.query, tab: value === 'import' ? undefined : value } }),
})
const message = ref('')
const notice = ref('')
const input = 'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2'

// ===== Import =====
const bundleError = useHarvestError()
const bundleInput = useTemplateRef<HTMLInputElement>('bundleInput')
const { data: imports, refresh: refreshImports } = await useAsyncData(`admin-event-imports-${eventId}`,
  () => $api<{ imports: EventImportRun[] }>(`/v1/admin/events/${eventId}/imports`))
// The latest floor plan and the latest booths have a card each; the rest (and imports from before the split) are listed under them.
const latestMap = computed(() => imports.value?.imports.find(run => run.kind === 'map') ?? null)
const latestBooths = computed(() => imports.value?.imports.find(run => run.kind === 'booths') ?? null)
const earlier = computed(() => (imports.value?.imports ?? []).filter(run => run !== latestMap.value && run !== latestBooths.value))
const working = computed(() => (imports.value?.imports ?? []).some(run => ['queued', 'running', 'applying'].includes(run.status)))
const busy = ref(false)

let poll: ReturnType<typeof setInterval> | null = null
const stopPolling = () => {
  if (poll) clearInterval(poll)
  poll = null
}
watch(working, (value) => {
  stopPolling()
  if (value && import.meta.client) poll = setInterval(() => refreshImports(), 2000)
}, { immediate: true })
watch(() => [latestMap.value?.status, latestBooths.value?.status], (statuses, before) => {
  if (statuses.some((status, n) => status === 'applied' && before?.[n] === 'applying')) {
    notice.value = '导入已应用。'
    boothPanel.value?.refresh()
    refreshHalls()
  }
})
onBeforeUnmount(stopPolling)

// A bundle the harvester made for this event: checked, kept and previewed by the site. A bundle in several
// volumes can be picked at once (or a few at a time); the site previews it once every volume is in.
const uploadBundle = async () => {
  const files = [...(bundleInput.value?.files ?? [])]
  if (!files.length || busy.value) return
  busy.value = true
  message.value = ''
  notice.value = ''
  try {
    for (const file of files) {
      const form = new FormData()
      form.append('bundle', file)
      await $api(`/v1/admin/events/${eventId}/imports`, { method: 'POST', body: form })
    }
    await refreshImports()
  } catch (e) {
    message.value = (e as { statusCode?: number }).statusCode === 413 ? '导入包太大，超过了服务器的上传上限。' : bundleError(e)
    await refreshImports()
  } finally {
    busy.value = false
    if (bundleInput.value) bundleInput.value.value = ''
  }
}
const applyImport = async (run: EventImportRun) => {
  busy.value = true
  message.value = ''
  try {
    await $api(`/v1/admin/event-imports/${run.id}/apply`, { method: 'POST' })
    await refreshImports()
  } catch (e) {
    message.value = adminError(e)
  } finally {
    busy.value = false
  }
}
// ===== Booths =====
const boothPanel = useTemplateRef<{ refresh: () => Promise<void> }>('boothPanel')

// ===== Venue =====
const { data: halls, refresh: refreshHalls } = await useAsyncData(`admin-event-halls-${eventId}`, () => $api<AdminHall[]>(`/v1/admin/events/${eventId}/halls`))
const hallForms = reactive<Record<number, { building: string, floor: string, name: string, sort_order: number }>>({})
watch(halls, (value) => {
  for (const hall of value ?? []) hallForms[hall.id] = { building: hall.building, floor: hall.floor ?? '', name: hall.name, sort_order: hall.sort_order }
}, { immediate: true })
const saveHall = async (hall: AdminHall) => {
  busy.value = true
  message.value = ''
  try {
    const form = hallForms[hall.id]!
    await $api(`/v1/admin/event-halls/${hall.id}`, { method: 'PUT', body: { ...form, floor: form.floor || null } })
    notice.value = '已保存'
    await refreshHalls()
    previewMap.value = null
  } catch (e) {
    message.value = adminError(e)
  } finally {
    busy.value = false
  }
}
// The public map, to check the result
const previewMap = ref<VenueMapData | null>(null)
const previewCircles = ref<EventBooth[]>([])
const loadPreview = async () => {
  try {
    const [map, list] = await Promise.all([
      $api<VenueMapData>(`/v1/events/${eventId}/map`, { progress: false }),
      $api<{ booths: EventBooth[] }>(`/v1/events/${eventId}/booths`, { progress: false }),
    ])
    previewMap.value = map
    previewCircles.value = list.booths
  } catch {
    previewMap.value = null
  }
}
watch(tab, value => value === 'venue' && !previewMap.value && loadPreview(), { immediate: true })
const previewSpaces = computed(() => previewMap.value ? buildSpaces(previewMap.value, previewCircles.value) : [])
const emptyCircles = computed(() => new Set(previewCircles.value.filter(c => c.space_id !== null).map(c => c.id)))

useHead({ title: computed(() => event.value ? `${event.value.name} · 会场与摊位` : '会场与摊位') })
</script>

<template>
  <div class="mx-auto max-w-6xl space-y-5 p-4 sm:p-8">
    <NuxtLink to="/admin/events" class="text-sm text-slate-500 hover:text-slate-900">← 活动</NuxtLink>
    <p v-if="eventError" role="alert" class="text-sm text-red-700">{{ adminError(eventError) }}</p>
    <header v-if="event" class="flex flex-wrap items-end justify-between gap-4">
      <div class="flex items-center gap-4">
        <img v-if="event.main_visual_url" :src="event.main_visual_url" alt="" class="h-20 w-auto rounded-lg border border-slate-200 object-contain">
        <div>
          <h1 class="text-3xl font-bold">{{ event.name }}</h1>
          <p class="mt-1 text-sm text-slate-600">{{ event.slug }} · {{ event.booths_count ?? 0 }} 个摊位 · {{ event.released_albums_count ?? 0 }} 张专辑</p>
        </div>
      </div>
      <UiButton :to="`/events/${eventId}`" target="_blank">查看活动页</UiButton>
    </header>

    <nav class="flex gap-1 border-b border-slate-200 text-sm">
      <button v-for="item in (['import', 'booths', 'venue'] as const)" :key="item" type="button" class="-mb-px border-b-2 px-4 py-2 font-medium" :class="tab === item ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-900'" @click="tab = item">
        {{ eventVenueTabLabels[item] }}
      </button>
    </nav>
    <p v-if="notice" role="status" class="text-sm text-emerald-700">{{ notice }}</p>
    <p v-if="message" role="alert" class="text-sm text-red-700">{{ message }}</p>

    <!-- Import -->
    <template v-if="tab === 'import'">
      <section class="rounded-xl border border-slate-200 bg-white p-5">
        <h2 class="font-semibold">导入</h2>
        <p class="mt-1 text-sm text-slate-600">平面图和摊位分开导入，先后不限：上传采集器为这一届生成的平面图包或摊位包（.zip），先生成预览，确认后再应用；采集器也能用令牌直接上传，预览无问题时自动应用。导入平面图会按摊位号把已有的摊位放到桌子上；没有平面图时摊位照样导入，以后补上平面图再放。超过 50 MB 的摊位包分成几卷（…-1of3.zip），一起选上传，收齐后才预览。导入只把有把握的摊位关联到已有的艺术家，不会新建艺术家；其余的在「摊位」页核对。再次导入会更新现有摊位，核对过的和手动设置的关联会保留。导入包的生成方法见采集器说明里的「活动导入」。</p>
        <UiButton variant="primary" icon="lucide:upload" class="mt-4" :disabled="busy || Boolean(working)" @click="bundleInput?.click()">{{ busy ? '正在上传…' : '上传导入包' }}</UiButton>
        <input ref="bundleInput" type="file" accept=".zip,application/zip" multiple class="hidden" :disabled="busy || Boolean(working)" @change="uploadBundle">
      </section>

      <AdminEventImportCard kind="booths" :run="latestBooths" :busy="busy" @apply="applyImport" />
      <AdminEventImportCard kind="map" :run="latestMap" :busy="busy" @apply="applyImport" />

      <section v-if="earlier.length" class="rounded-xl border border-slate-200 bg-white">
        <h2 class="border-b border-slate-100 px-5 py-3 font-semibold">更早的导入</h2>
        <ul class="divide-y divide-slate-100 text-sm">
          <li v-for="run in earlier" :key="run.id" class="flex flex-wrap items-center gap-3 px-5 py-2.5">
            <span class="font-mono text-xs text-slate-500">#{{ run.id }}</span>
            <span class="text-slate-600">{{ eventImportKindLabels[run.kind] }}</span>
            <span class="rounded-full px-2 py-0.5 text-xs" :class="eventImportStatusClass(run.status)">{{ eventImportStatusLabels[run.status] }}</span>
            <span class="text-slate-600">{{ new Date(run.created_at).toLocaleString() }}</span>
            <span v-if="run.params.edition" class="text-slate-500">{{ run.params.edition.name }}</span>
            <span v-if="run.summary" class="text-slate-500">{{ [run.summary.circles && `${run.summary.circles.total} 个摊位`, run.summary.map && `${run.summary.map.spaces} 张桌子`].filter(Boolean).join(' / ') }}</span>
          </li>
        </ul>
      </section>
    </template>

    <!-- Booths -->
    <AdminEventBoothPanel v-else-if="tab === 'booths'" ref="boothPanel" :event-id="eventId" />

    <!-- Venue -->
    <template v-else>
      <section v-if="halls?.length" class="rounded-xl border border-slate-200 bg-white p-5">
        <h2 class="font-semibold">展馆与楼层</h2>
        <form v-for="hall in halls" :key="hall.id" class="mt-3 grid items-end gap-3 text-sm sm:grid-cols-[1fr_6rem_1fr_5rem_auto]" @submit.prevent="saveHall(hall)">
          <label class="block">建筑<input v-model="hallForms[hall.id]!.building" required :class="input"></label>
          <label class="block">楼层<input v-model="hallForms[hall.id]!.floor" :class="input"></label>
          <label class="block">显示名称<input v-model="hallForms[hall.id]!.name" required :class="input"></label>
          <label class="block">顺序<input v-model.number="hallForms[hall.id]!.sort_order" type="number" min="0" :class="input"></label>
          <UiButton type="submit" :disabled="busy">保存 <span class="text-xs text-slate-400">({{ hall.spaces_count }})</span></UiButton>
        </form>
      </section>
      <p v-else class="text-sm text-slate-500">还没有导入会场图。</p>
      <div v-if="previewMap" class="h-[560px] overflow-hidden rounded-xl border border-slate-200">
        <EventVenueMap class="h-full" :map="previewMap" :spaces="previewSpaces" :highlighted="emptyCircles" :checked="new Set()" :color-by-genre="false" :selected-circle-id="null" />
      </div>
      <p v-if="previewMap" class="text-xs text-slate-500">预览中变淡的是没有摊位的桌子。</p>
    </template>
  </div>
</template>
