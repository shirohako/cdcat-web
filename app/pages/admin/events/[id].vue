<script setup lang="ts">
import type { AdminPagination } from '~/types/admin'
import type { EventCircle, EventDetail, VenueMapData } from '~/types/event'

definePageMeta({ layout: 'admin', middleware: 'admin' })

interface ImportSummary {
  circles: { total: number, on_site: number, catalog_only: number, new: number, updated: number, removed: number, with_cut: number }
  map: null | { halls: { name: string, spaces: number }[], spaces: number, circles_without_space: string[], circles_without_space_count: number, empty_spaces: string[], empty_spaces_count: number, warnings: string[] }
  artists: { handle: number, url: number, name: number, kept: number, manual: number, ambiguous: number, create: number, create_circles: number }
  event: Record<string, [string | null, string | null]>
  notes: string[]
}
interface EventImportRun {
  id: number
  source: string
  // What the bundle says about itself (docs/events/README.md#导入包).
  params: { file?: { name: string, bytes: number }, edition?: { key: string, name: string }, created_at?: string }
  status: 'queued' | 'running' | 'ready' | 'applying' | 'applied' | 'failed'
  summary: ImportSummary | null
  error: string | null
  creator: { username: string, nickname: string | null } | null
  applier: { username: string, nickname: string | null } | null
  applied_at: string | null
  created_at: string
}
interface AdminCircle {
  id: number
  space_code: string | null
  event_space_id: number | null
  name: string
  name_kana: string | null
  genre: string | null
  twitter_handle: string | null
  image_url: string | null
  artist_id: number | null
  artist_link: 'auto' | 'created' | 'manual' | null
  artist: { id: number, name: string, type: string, image_url: string | null } | null
}
interface AdminHall { id: number, building: string, floor: string | null, name: string, sort_order: number, spaces_count: number }

const route = useRoute()
const router = useRouter()
const eventId = Number(route.params.id)
const { $api } = useNuxtApp()
const eventVenueLinkLabels: Record<string, string> = { all: '全部', none: '未关联', auto: '自动匹配', created: '导入新建', manual: '手动' }
const eventVenueStatusLabels: Record<string, string> = { queued: '排队中', running: '检查中', ready: '待确认', applying: '应用中', applied: '已应用', failed: '失败' }
const eventVenueTabLabels: Record<string, string> = { import: '导入', circles: '社团', venue: '会场' }

const { data: event, error: eventError } = await useAsyncData(`admin-event-${eventId}`, () => $api<EventDetail>(`/v1/events/${eventId}`))

type Tab = 'import' | 'circles' | 'venue'
const tab = computed<Tab>({
  get: () => (['import', 'circles', 'venue'] as const).includes(route.query.tab as Tab) ? route.query.tab as Tab : 'import',
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
const latest = computed(() => imports.value?.imports[0] ?? null)
const working = computed(() => latest.value && ['queued', 'running', 'applying'].includes(latest.value.status))
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
watch(() => latest.value?.status, (status, before) => {
  if (status === 'applied' && before === 'applying') {
    notice.value = '导入已应用。'
    refreshCircles()
    refreshHalls()
  }
})
onBeforeUnmount(stopPolling)

// A bundle the harvester made for this event: checked, kept and previewed by the site.
const uploadBundle = async () => {
  const file = bundleInput.value?.files?.[0]
  if (!file || busy.value) return
  busy.value = true
  message.value = ''
  notice.value = ''
  try {
    const form = new FormData()
    form.append('bundle', file)
    await $api(`/v1/admin/events/${eventId}/imports`, { method: 'POST', body: form })
    await refreshImports()
  } catch (e) {
    message.value = (e as { statusCode?: number }).statusCode === 413 ? '导入包太大，超过了服务器的上传上限。' : bundleError(e)
  } finally {
    busy.value = false
    if (bundleInput.value) bundleInput.value.value = ''
  }
}
const bundleLine = (run: EventImportRun) => {
  const { file, edition, created_at: createdAt } = run.params
  if (!file) return ''
  return `导入包：${edition?.name ?? '—'} · ${file.name}（${`${(file.bytes / 1024 / 1024).toFixed(1)} MB`}）· ${createdAt ? new Date(createdAt).toLocaleString() : '—'} 生成`
}
const applyImport = async (run: EventImportRun) => {
  const create = run.summary?.artists.create ?? 0
  if (create && !window.confirm(`应用后会新建 ${create} 个社团艺术家（系统来源的已批准修订）。继续吗？`)) return
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
const statusClass = (status: EventImportRun['status']) => ({
  queued: 'bg-slate-100 text-slate-600', running: 'bg-sky-100 text-sky-700', ready: 'bg-amber-100 text-amber-800',
  applying: 'bg-sky-100 text-sky-700', applied: 'bg-emerald-100 text-emerald-700', failed: 'bg-red-100 text-red-700',
})[status]

// ===== Circles =====
const circleQuery = reactive({ search: '', link: '', page: 1 })
const { data: circles, pending: circlesPending, error: circlesError, refresh: refreshCircles } = await useAsyncData(`admin-event-circles-${eventId}`,
  () => $api<{ circles: AdminCircle[], pagination: AdminPagination }>(`/v1/admin/events/${eventId}/circles`, {
    query: { search: circleQuery.search || undefined, link: circleQuery.link || undefined, page: circleQuery.page, per_page: 50 },
  }), { watch: [() => circleQuery.link, () => circleQuery.page] })
const searchCircles = () => {
  circleQuery.page = 1
  refreshCircles()
}

const relinking = ref<number | null>(null)
const artistQuery = ref('')
const artistResults = ref<{ id: number, name: string, type: string | null, image_url: string | null }[]>([])
let searchToken = 0
watch(artistQuery, async (value) => {
  const token = ++searchToken
  if (!value.trim()) {
    artistResults.value = []
    return
  }
  try {
    const data = await $api<{ artists: { id: number, name: string, type: string | null, image_url: string | null }[] }>('/v1/artists', { query: { search: value.trim(), per_page: 8 }, progress: false })
    if (token === searchToken) artistResults.value = data.artists
  } catch {
    artistResults.value = []
  }
})
const startRelink = (circle: AdminCircle) => {
  relinking.value = circle.id
  artistQuery.value = circle.name
}
const setArtist = async (circle: AdminCircle, artistId: number | null) => {
  busy.value = true
  message.value = ''
  try {
    await $api(`/v1/admin/event-circles/${circle.id}`, { method: 'PUT', body: { artist_id: artistId } })
    relinking.value = null
    artistQuery.value = ''
    await refreshCircles()
  } catch (e) {
    message.value = adminError(e)
  } finally {
    busy.value = false
  }
}
const linkClass = (link: AdminCircle['artist_link']) => ({ auto: 'bg-sky-50 text-sky-700', created: 'bg-violet-50 text-violet-700', manual: 'bg-emerald-50 text-emerald-700' })[link ?? 'auto']

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
const previewCircles = ref<EventCircle[]>([])
const loadPreview = async () => {
  try {
    const [map, list] = await Promise.all([
      $api<VenueMapData>(`/v1/events/${eventId}/map`, { progress: false }),
      $api<{ circles: EventCircle[] }>(`/v1/events/${eventId}/circles`, { progress: false }),
    ])
    previewMap.value = map
    previewCircles.value = list.circles
  } catch {
    previewMap.value = null
  }
}
watch(tab, value => value === 'venue' && !previewMap.value && loadPreview(), { immediate: true })
const previewSpaces = computed(() => previewMap.value ? buildSpaces(previewMap.value, previewCircles.value) : [])
const emptyCircles = computed(() => new Set(previewCircles.value.filter(c => c.space_id !== null).map(c => c.id)))

useHead({ title: computed(() => event.value ? `${event.value.name} · ${'会场与社团'}` : '会场与社团') })
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
          <p class="mt-1 text-sm text-slate-600">{{ event.slug }} · {{ event.circles_count ?? 0 }} 个社团 · {{ event.released_albums_count ?? 0 }} 张专辑</p>
        </div>
      </div>
      <NuxtLink :to="`/events/${eventId}`" target="_blank" class="rounded-lg border border-slate-300 px-4 py-2 text-sm">查看活动页</NuxtLink>
    </header>

    <nav class="flex gap-1 border-b border-slate-200 text-sm">
      <button v-for="item in (['import', 'circles', 'venue'] as const)" :key="item" type="button" class="-mb-px border-b-2 px-4 py-2 font-medium" :class="tab === item ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-900'" @click="tab = item">
        {{ eventVenueTabLabels[item] }}
      </button>
    </nav>
    <p v-if="notice" role="status" class="text-sm text-emerald-700">{{ notice }}</p>
    <p v-if="message" role="alert" class="text-sm text-red-700">{{ message }}</p>

    <!-- Import -->
    <template v-if="tab === 'import'">
      <section class="rounded-xl border border-slate-200 bg-white p-5">
        <h2 class="font-semibold">导入</h2>
        <p class="mt-1 text-sm text-slate-600">上传采集器为这一届生成的活动导入包（.zip），先生成预览，确认后再应用。再次导入会更新现有社团，后台手动设置的艺术家关联会保留。导入包的生成方法见采集器说明里的「活动导入包」。</p>
        <label class="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm text-white" :class="busy || working ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'">
          <Icon name="lucide:upload" class="size-4" />
          {{ busy ? '正在上传…' : '上传导入包' }}
          <input ref="bundleInput" type="file" accept=".zip,application/zip" class="sr-only" :disabled="busy || Boolean(working)" @change="uploadBundle">
        </label>
      </section>

      <section v-if="latest" class="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <h2 class="font-semibold">导入 #{{ latest.id }}</h2>
            <span class="rounded-full px-2.5 py-0.5 text-xs font-medium" :class="statusClass(latest.status)">{{ eventVenueStatusLabels[latest.status] }}</span>
            <span class="text-xs text-slate-500">{{ new Date(latest.created_at).toLocaleString() }} · {{ latest.creator?.nickname || latest.creator?.username }}</span>
          </div>
          <button v-if="latest.status === 'ready'" type="button" class="rounded-lg bg-emerald-700 px-4 py-2 text-sm text-white disabled:opacity-50" :disabled="busy" @click="applyImport(latest)">应用导入</button>
        </div>
        <p v-if="bundleLine(latest)" class="text-xs text-slate-500">{{ bundleLine(latest) }}</p>
        <p v-if="working" class="text-sm text-slate-500">正在处理，页面会自动刷新…</p>
        <p v-if="latest.error" role="alert" class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{{ latest.error }}</p>

        <template v-if="latest.summary">
          <div class="grid gap-3 sm:grid-cols-3">
            <div class="rounded-lg bg-slate-50 p-4">
              <p class="text-xs font-medium text-slate-500">社团</p>
              <p class="mt-1 text-2xl font-bold tabular-nums">{{ latest.summary.circles.total }}</p>
              <p class="mt-1 text-xs text-slate-600">新增 {{ latest.summary.circles.new }} · 更新 {{ latest.summary.circles.updated }} · 移除 {{ latest.summary.circles.removed }} · 仅目录参加 {{ latest.summary.circles.catalog_only }} · 有 cut {{ latest.summary.circles.with_cut }}</p>
            </div>
            <div class="rounded-lg bg-slate-50 p-4">
              <p class="text-xs font-medium text-slate-500">会场摊位</p>
              <template v-if="latest.summary.map">
                <p class="mt-1 text-2xl font-bold tabular-nums">{{ latest.summary.map.spaces }}</p>
                <p class="mt-1 text-xs text-slate-600">{{ latest.summary.map.halls.map(h => `${h.name} ${h.spaces}`).join(' · ') }}</p>
              </template>
              <p v-else class="mt-1 text-sm text-slate-500">本次没有平面图</p>
            </div>
            <div class="rounded-lg bg-slate-50 p-4">
              <p class="text-xs font-medium text-slate-500">将新建艺术家</p>
              <p class="mt-1 text-2xl font-bold tabular-nums">{{ latest.summary.artists.create }}</p>
              <p class="mt-1 text-xs text-slate-600">按 X 匹配 {{ latest.summary.artists.handle }} · 按链接 {{ latest.summary.artists.url }} · 按名称 {{ latest.summary.artists.name }} · 沿用 {{ latest.summary.artists.kept }} · 手动 {{ latest.summary.artists.manual }} · 同名多个 {{ latest.summary.artists.ambiguous }}</p>
            </div>
          </div>
          <div v-if="latest.summary.map && (latest.summary.map.circles_without_space_count || latest.summary.map.empty_spaces_count || latest.summary.map.warnings.length)" class="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <p v-if="latest.summary.map.circles_without_space_count">{{ latest.summary.map.circles_without_space_count }} 个社团在平面图上找不到摊位： <span class="font-mono text-xs">{{ latest.summary.map.circles_without_space.join(', ') }}</span></p>
            <p v-if="latest.summary.map.empty_spaces_count">{{ latest.summary.map.empty_spaces_count }} 个摊位没有社团： <span class="font-mono text-xs">{{ latest.summary.map.empty_spaces.join(', ') }}</span></p>
            <p v-for="warning in latest.summary.map.warnings" :key="warning">{{ warning }}</p>
          </div>
          <p v-else-if="latest.summary.map" class="text-sm text-emerald-700">所有现场社团都对上了摊位。</p>
          <div v-if="Object.keys(latest.summary.event).length">
            <p class="text-xs font-medium text-slate-500">活动信息变更</p>
            <table class="mt-1 text-sm">
              <tbody>
                <tr v-for="(change, field) in latest.summary.event" :key="field">
                  <td class="pr-4 text-slate-500">{{ field }}</td>
                  <td class="pr-2 text-slate-400 line-through">{{ change[0] ?? '—' }}</td>
                  <td class="break-all">{{ change[1] }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <ul v-if="latest.summary.notes.length" class="list-disc pl-5 text-sm text-slate-600">
            <li v-for="note in latest.summary.notes" :key="note">{{ note }}</li>
          </ul>
        </template>
      </section>

      <section v-if="(imports?.imports.length ?? 0) > 1" class="rounded-xl border border-slate-200 bg-white">
        <h2 class="border-b border-slate-100 px-5 py-3 font-semibold">更早的导入</h2>
        <ul class="divide-y divide-slate-100 text-sm">
          <li v-for="run in imports!.imports.slice(1)" :key="run.id" class="flex flex-wrap items-center gap-3 px-5 py-2.5">
            <span class="font-mono text-xs text-slate-500">#{{ run.id }}</span>
            <span class="rounded-full px-2 py-0.5 text-xs" :class="statusClass(run.status)">{{ eventVenueStatusLabels[run.status] }}</span>
            <span class="text-slate-600">{{ new Date(run.created_at).toLocaleString() }}</span>
            <span v-if="run.params.edition" class="text-slate-500">{{ run.params.edition.name }}</span>
            <span v-if="run.summary" class="text-slate-500">{{ run.summary.circles.total }} / {{ run.summary.map?.spaces ?? 0 }}</span>
          </li>
        </ul>
      </section>
    </template>

    <!-- Circles -->
    <template v-else-if="tab === 'circles'">
      <form class="flex flex-wrap items-end gap-3 text-sm" @submit.prevent="searchCircles">
        <label class="block">搜索<input v-model="circleQuery.search" type="search" class="mt-1 w-64 rounded-lg border border-slate-300 px-3 py-2"></label>
        <label class="block">艺术家关联
          <select v-model="circleQuery.link" class="mt-1 rounded-lg border border-slate-300 px-3 py-2" @change="circleQuery.page = 1">
            <option value="">全部</option>
            <option v-for="link in ['none', 'auto', 'created', 'manual']" :key="link" :value="link">{{ eventVenueLinkLabels[link] }}</option>
          </select>
        </label>
        <button type="submit" class="rounded-lg border border-slate-300 px-4 py-2">搜索</button>
      </form>
      <AdminListState :pending="circlesPending && !circles" :error="circlesError" :empty="!circles?.circles.length" @retry="refreshCircles()">
        <div class="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table class="w-full text-left text-sm">
            <thead class="border-b border-slate-100 bg-slate-50 text-xs text-slate-500">
              <tr><th class="px-4 py-3">社团</th><th class="px-4 py-3">摊位</th><th class="px-4 py-3">X</th><th class="px-4 py-3">艺术家</th></tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="circle in circles?.circles" :key="circle.id" class="align-top">
                <td class="px-4 py-3">
                  <div class="flex items-center gap-3">
                    <img v-if="circle.image_url" :src="circle.image_url" alt="" loading="lazy" class="size-10 rounded object-cover">
                    <div><p class="font-medium">{{ circle.name }}</p><p class="text-xs text-slate-500">{{ circle.name_kana }}</p></div>
                  </div>
                </td>
                <td class="px-4 py-3 font-mono text-xs">{{ circle.space_code ?? '—' }}<span v-if="circle.space_code && !circle.event_space_id" class="ml-1 text-red-600">!</span></td>
                <td class="px-4 py-3 text-xs"><a v-if="circle.twitter_handle" :href="`https://x.com/${circle.twitter_handle}`" target="_blank" rel="noopener" class="underline">@{{ circle.twitter_handle }}</a></td>
                <td class="px-4 py-3">
                  <div class="flex flex-wrap items-center gap-2">
                    <NuxtLink v-if="circle.artist" :to="`/artists/${circle.artist.id}`" target="_blank" class="underline">{{ circle.artist.name }}</NuxtLink>
                    <span v-else class="text-slate-400">未关联</span>
                    <span v-if="circle.artist_link" class="rounded px-1.5 py-0.5 text-[11px]" :class="linkClass(circle.artist_link)">{{ eventVenueLinkLabels[circle.artist_link] }}</span>
                    <button type="button" class="text-xs underline" @click="relinking === circle.id ? (relinking = null) : startRelink(circle)">更改</button>
                  </div>
                  <div v-if="relinking === circle.id" class="mt-2 w-80 space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
                    <input v-model="artistQuery" type="search" class="w-full rounded border border-slate-300 px-2 py-1 text-sm" placeholder="搜索艺术家名">
                    <button v-for="artist in artistResults" :key="artist.id" type="button" class="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm hover:bg-white" :disabled="busy" @click="setArtist(circle, artist.id)">
                      <span class="truncate">{{ artist.name }}</span><span class="text-xs text-slate-400">#{{ artist.id }} · {{ artist.type }}</span>
                    </button>
                    <button type="button" class="text-xs text-red-700 underline" :disabled="busy" @click="setArtist(circle, null)">取消关联（之后导入也不再自动匹配）</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <CommonPagination v-if="circles" class="mt-4" :page="circleQuery.page" :total-pages="circles.pagination.last_page" @update:page="circleQuery.page = $event" />
      </AdminListState>
    </template>

    <!-- Venue -->
    <template v-else>
      <section v-if="halls?.length" class="rounded-xl border border-slate-200 bg-white p-5">
        <h2 class="font-semibold">展馆与楼层</h2>
        <form v-for="hall in halls" :key="hall.id" class="mt-3 grid items-end gap-3 text-sm sm:grid-cols-[1fr_6rem_1fr_5rem_auto]" @submit.prevent="saveHall(hall)">
          <label class="block">建筑<input v-model="hallForms[hall.id]!.building" required :class="input"></label>
          <label class="block">楼层<input v-model="hallForms[hall.id]!.floor" :class="input"></label>
          <label class="block">显示名称<input v-model="hallForms[hall.id]!.name" required :class="input"></label>
          <label class="block">顺序<input v-model.number="hallForms[hall.id]!.sort_order" type="number" min="0" :class="input"></label>
          <button type="submit" class="rounded-lg border border-slate-300 px-4 py-2" :disabled="busy">保存 <span class="text-xs text-slate-400">({{ hall.spaces_count }})</span></button>
        </form>
      </section>
      <p v-else class="text-sm text-slate-500">还没有导入会场图。</p>
      <div v-if="previewMap" class="h-[560px] overflow-hidden rounded-xl border border-slate-200">
        <EventVenueMap class="h-full" :map="previewMap" :spaces="previewSpaces" :highlighted="emptyCircles" :checked="new Set()" :color-by-genre="false" :selected-circle-id="null" />
      </div>
      <p v-if="previewMap" class="text-xs text-slate-500">预览中变淡的是没有社团的摊位。</p>
    </template>
  </div>
</template>
