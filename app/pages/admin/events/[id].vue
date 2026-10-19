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
  params: Record<string, unknown>
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
const { t } = useAdminI18n()
const { localizeError } = useLocalizedApiError((key, params) => params ? t(key, params) : t(key))

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
const { data: sources } = await useAsyncData(`admin-event-sources-${eventId}`,
  () => $api<{ key: string, defaults: Record<string, unknown> }[]>(`/v1/admin/events/${eventId}/import-sources`))
const sourceKey = ref('m3')
const params = reactive({ exhibition: '', map_pdf_url: '', map_profile: 'm3-trc', read_info_page: true })
watch(() => sources.value?.find(s => s.key === sourceKey.value)?.defaults, (defaults) => {
  if (defaults) Object.assign(params, defaults)
}, { immediate: true })

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
    notice.value = t('admin_pages.event_venue.applied')
    refreshCircles()
    refreshHalls()
  }
})
onBeforeUnmount(stopPolling)

const startImport = async () => {
  busy.value = true
  message.value = ''
  notice.value = ''
  try {
    await $api(`/v1/admin/events/${eventId}/imports`, { method: 'POST', body: { source: sourceKey.value, params: { ...params, map_pdf_url: params.map_pdf_url || null } } })
    await refreshImports()
  } catch (e) {
    message.value = localizeError(e)
  } finally {
    busy.value = false
  }
}
const applyImport = async (run: EventImportRun) => {
  const create = run.summary?.artists.create ?? 0
  if (create && !window.confirm(t('admin_pages.event_venue.confirm_create', { count: create }))) return
  busy.value = true
  message.value = ''
  try {
    await $api(`/v1/admin/event-imports/${run.id}/apply`, { method: 'POST' })
    await refreshImports()
  } catch (e) {
    message.value = localizeError(e)
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
    message.value = localizeError(e)
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
    notice.value = t('admin_pages.saved')
    await refreshHalls()
    previewMap.value = null
  } catch (e) {
    message.value = localizeError(e)
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

useHead({ title: computed(() => event.value ? `${event.value.name} · ${t('admin_pages.event_venue.title')}` : t('admin_pages.event_venue.title')) })
</script>

<template>
  <div class="mx-auto max-w-6xl space-y-5 p-4 sm:p-8">
    <NuxtLink to="/admin/events" class="text-sm text-slate-500 hover:text-slate-900">← {{ t('admin_pages.events.title') }}</NuxtLink>
    <p v-if="eventError" role="alert" class="text-sm text-red-700">{{ localizeError(eventError) }}</p>
    <header v-if="event" class="flex flex-wrap items-end justify-between gap-4">
      <div class="flex items-center gap-4">
        <img v-if="event.main_visual_url" :src="event.main_visual_url" alt="" class="h-20 w-auto rounded-lg border border-slate-200 object-contain">
        <div>
          <h1 class="text-3xl font-bold">{{ event.name }}</h1>
          <p class="mt-1 text-sm text-slate-600">{{ event.slug }} · {{ t('admin_pages.event_venue.counts', { circles: event.circles_count ?? 0, albums: event.released_albums_count ?? 0 }) }}</p>
        </div>
      </div>
      <NuxtLink :to="`/events/${eventId}`" target="_blank" class="rounded-lg border border-slate-300 px-4 py-2 text-sm">{{ t('admin_pages.event_venue.view_page') }}</NuxtLink>
    </header>

    <nav class="flex gap-1 border-b border-slate-200 text-sm">
      <button v-for="item in (['import', 'circles', 'venue'] as const)" :key="item" type="button" class="-mb-px border-b-2 px-4 py-2 font-medium" :class="tab === item ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-900'" @click="tab = item">
        {{ t(`admin_pages.event_venue.tabs.${item}`) }}
      </button>
    </nav>
    <p v-if="notice" role="status" class="text-sm text-emerald-700">{{ notice }}</p>
    <p v-if="message" role="alert" class="text-sm text-red-700">{{ message }}</p>

    <!-- Import -->
    <template v-if="tab === 'import'">
      <section class="rounded-xl border border-slate-200 bg-white p-5">
        <h2 class="font-semibold">{{ t('admin_pages.event_venue.import_title') }}</h2>
        <p class="mt-1 text-sm text-slate-600">{{ t('admin_pages.event_venue.import_help') }} <NuxtLink to="/admin/event-imports" class="underline">{{ t('admin_pages.event_venue.batch_link') }}</NuxtLink></p>
        <form class="mt-4 grid gap-4 text-sm sm:grid-cols-2" @submit.prevent="startImport">
          <label class="block">{{ t('admin_pages.event_venue.source') }}
            <select v-model="sourceKey" :class="input"><option v-for="source in sources" :key="source.key" :value="source.key">{{ t(`admin_pages.event_venue.sources.${source.key}`) }}</option></select>
          </label>
          <label class="block">{{ t('admin_pages.event_venue.exhibition') }}<input v-model="params.exhibition" required pattern="\d{4}[sf]" placeholder="2026f" :class="input"></label>
          <label class="block sm:col-span-2">{{ t('admin_pages.event_venue.map_pdf') }}<input v-model="params.map_pdf_url" type="url" placeholder="https://www.m3net.jp/m3_58/M3tuushin58map_web.pdf" :class="input"><span class="mt-1 block text-xs text-slate-500">{{ t('admin_pages.event_venue.map_pdf_help') }}</span></label>
          <label class="block">{{ t('admin_pages.event_venue.profile') }}<input v-model="params.map_profile" pattern="[a-z0-9-]+" :class="input"></label>
          <label class="flex items-center gap-2 self-end pb-2"><input v-model="params.read_info_page" type="checkbox">{{ t('admin_pages.event_venue.read_info') }}</label>
          <div class="sm:col-span-2">
            <button type="submit" class="rounded-lg bg-slate-900 px-4 py-2 text-white disabled:opacity-50" :disabled="busy || Boolean(working)">{{ t('admin_pages.event_venue.fetch') }}</button>
          </div>
        </form>
      </section>

      <section v-if="latest" class="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <h2 class="font-semibold">{{ t('admin_pages.event_venue.run', { id: latest.id }) }}</h2>
            <span class="rounded-full px-2.5 py-0.5 text-xs font-medium" :class="statusClass(latest.status)">{{ t(`admin_pages.event_venue.statuses.${latest.status}`) }}</span>
            <span class="text-xs text-slate-500">{{ new Date(latest.created_at).toLocaleString() }} · {{ latest.creator?.nickname || latest.creator?.username }}</span>
          </div>
          <button v-if="latest.status === 'ready'" type="button" class="rounded-lg bg-emerald-700 px-4 py-2 text-sm text-white disabled:opacity-50" :disabled="busy" @click="applyImport(latest)">{{ t('admin_pages.event_venue.apply') }}</button>
        </div>
        <p v-if="working" class="text-sm text-slate-500">{{ t('admin_pages.event_venue.working') }}</p>
        <p v-if="latest.error" role="alert" class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{{ latest.error }}</p>

        <template v-if="latest.summary">
          <div class="grid gap-3 sm:grid-cols-3">
            <div class="rounded-lg bg-slate-50 p-4">
              <p class="text-xs font-medium text-slate-500">{{ t('admin_pages.event_venue.summary.circles') }}</p>
              <p class="mt-1 text-2xl font-bold tabular-nums">{{ latest.summary.circles.total }}</p>
              <p class="mt-1 text-xs text-slate-600">{{ t('admin_pages.event_venue.summary.circles_detail', latest.summary.circles) }}</p>
            </div>
            <div class="rounded-lg bg-slate-50 p-4">
              <p class="text-xs font-medium text-slate-500">{{ t('admin_pages.event_venue.summary.map') }}</p>
              <template v-if="latest.summary.map">
                <p class="mt-1 text-2xl font-bold tabular-nums">{{ latest.summary.map.spaces }}</p>
                <p class="mt-1 text-xs text-slate-600">{{ latest.summary.map.halls.map(h => `${h.name} ${h.spaces}`).join(' · ') }}</p>
              </template>
              <p v-else class="mt-1 text-sm text-slate-500">{{ t('admin_pages.event_venue.summary.no_map') }}</p>
            </div>
            <div class="rounded-lg bg-slate-50 p-4">
              <p class="text-xs font-medium text-slate-500">{{ t('admin_pages.event_venue.summary.artists') }}</p>
              <p class="mt-1 text-2xl font-bold tabular-nums">{{ latest.summary.artists.create }}</p>
              <p class="mt-1 text-xs text-slate-600">{{ t('admin_pages.event_venue.summary.artists_detail', latest.summary.artists) }}</p>
            </div>
          </div>
          <div v-if="latest.summary.map && (latest.summary.map.circles_without_space_count || latest.summary.map.empty_spaces_count || latest.summary.map.warnings.length)" class="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <p v-if="latest.summary.map.circles_without_space_count">{{ t('admin_pages.event_venue.summary.without_space', { count: latest.summary.map.circles_without_space_count }) }} <span class="font-mono text-xs">{{ latest.summary.map.circles_without_space.join(', ') }}</span></p>
            <p v-if="latest.summary.map.empty_spaces_count">{{ t('admin_pages.event_venue.summary.empty_spaces', { count: latest.summary.map.empty_spaces_count }) }} <span class="font-mono text-xs">{{ latest.summary.map.empty_spaces.join(', ') }}</span></p>
            <p v-for="warning in latest.summary.map.warnings" :key="warning">{{ warning }}</p>
          </div>
          <p v-else-if="latest.summary.map" class="text-sm text-emerald-700">{{ t('admin_pages.event_venue.summary.all_placed') }}</p>
          <div v-if="Object.keys(latest.summary.event).length">
            <p class="text-xs font-medium text-slate-500">{{ t('admin_pages.event_venue.summary.event') }}</p>
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
        <h2 class="border-b border-slate-100 px-5 py-3 font-semibold">{{ t('admin_pages.event_venue.history') }}</h2>
        <ul class="divide-y divide-slate-100 text-sm">
          <li v-for="run in imports!.imports.slice(1)" :key="run.id" class="flex flex-wrap items-center gap-3 px-5 py-2.5">
            <span class="font-mono text-xs text-slate-500">#{{ run.id }}</span>
            <span class="rounded-full px-2 py-0.5 text-xs" :class="statusClass(run.status)">{{ t(`admin_pages.event_venue.statuses.${run.status}`) }}</span>
            <span class="text-slate-600">{{ new Date(run.created_at).toLocaleString() }}</span>
            <span v-if="run.summary" class="text-slate-500">{{ run.summary.circles.total }} / {{ run.summary.map?.spaces ?? 0 }}</span>
          </li>
        </ul>
      </section>
    </template>

    <!-- Circles -->
    <template v-else-if="tab === 'circles'">
      <form class="flex flex-wrap items-end gap-3 text-sm" @submit.prevent="searchCircles">
        <label class="block">{{ t('admin_pages.event_venue.search') }}<input v-model="circleQuery.search" type="search" class="mt-1 w-64 rounded-lg border border-slate-300 px-3 py-2"></label>
        <label class="block">{{ t('admin_pages.event_venue.link_filter') }}
          <select v-model="circleQuery.link" class="mt-1 rounded-lg border border-slate-300 px-3 py-2" @change="circleQuery.page = 1">
            <option value="">{{ t('admin_pages.event_venue.links.all') }}</option>
            <option v-for="link in ['none', 'auto', 'created', 'manual']" :key="link" :value="link">{{ t(`admin_pages.event_venue.links.${link}`) }}</option>
          </select>
        </label>
        <button type="submit" class="rounded-lg border border-slate-300 px-4 py-2">{{ t('admin_pages.event_venue.search') }}</button>
      </form>
      <AdminListState :pending="circlesPending && !circles" :error="circlesError" :empty="!circles?.circles.length" @retry="refreshCircles()">
        <div class="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table class="w-full text-left text-sm">
            <thead class="border-b border-slate-100 bg-slate-50 text-xs text-slate-500">
              <tr><th class="px-4 py-3">{{ t('admin_pages.event_venue.columns.circle') }}</th><th class="px-4 py-3">{{ t('admin_pages.event_venue.columns.space') }}</th><th class="px-4 py-3">X</th><th class="px-4 py-3">{{ t('admin_pages.event_venue.columns.artist') }}</th></tr>
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
                    <span v-else class="text-slate-400">{{ t('admin_pages.event_venue.links.none') }}</span>
                    <span v-if="circle.artist_link" class="rounded px-1.5 py-0.5 text-[11px]" :class="linkClass(circle.artist_link)">{{ t(`admin_pages.event_venue.links.${circle.artist_link}`) }}</span>
                    <button type="button" class="text-xs underline" @click="relinking === circle.id ? (relinking = null) : startRelink(circle)">{{ t('admin_pages.event_venue.relink') }}</button>
                  </div>
                  <div v-if="relinking === circle.id" class="mt-2 w-80 space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
                    <input v-model="artistQuery" type="search" class="w-full rounded border border-slate-300 px-2 py-1 text-sm" :placeholder="t('admin_pages.event_venue.artist_search')">
                    <button v-for="artist in artistResults" :key="artist.id" type="button" class="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm hover:bg-white" :disabled="busy" @click="setArtist(circle, artist.id)">
                      <span class="truncate">{{ artist.name }}</span><span class="text-xs text-slate-400">#{{ artist.id }} · {{ artist.type }}</span>
                    </button>
                    <button type="button" class="text-xs text-red-700 underline" :disabled="busy" @click="setArtist(circle, null)">{{ t('admin_pages.event_venue.unlink') }}</button>
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
        <h2 class="font-semibold">{{ t('admin_pages.event_venue.halls') }}</h2>
        <form v-for="hall in halls" :key="hall.id" class="mt-3 grid items-end gap-3 text-sm sm:grid-cols-[1fr_6rem_1fr_5rem_auto]" @submit.prevent="saveHall(hall)">
          <label class="block">{{ t('admin_pages.event_venue.building') }}<input v-model="hallForms[hall.id]!.building" required :class="input"></label>
          <label class="block">{{ t('admin_pages.event_venue.floor') }}<input v-model="hallForms[hall.id]!.floor" :class="input"></label>
          <label class="block">{{ t('admin_pages.event_venue.hall_name') }}<input v-model="hallForms[hall.id]!.name" required :class="input"></label>
          <label class="block">{{ t('admin_pages.event_venue.order') }}<input v-model.number="hallForms[hall.id]!.sort_order" type="number" min="0" :class="input"></label>
          <button type="submit" class="rounded-lg border border-slate-300 px-4 py-2" :disabled="busy">{{ t('common.save') }} <span class="text-xs text-slate-400">({{ hall.spaces_count }})</span></button>
        </form>
      </section>
      <p v-else class="text-sm text-slate-500">{{ t('admin_pages.event_venue.no_map') }}</p>
      <div v-if="previewMap" class="h-[560px] overflow-hidden rounded-xl border border-slate-200">
        <EventVenueMap class="h-full" :map="previewMap" :spaces="previewSpaces" :highlighted="emptyCircles" :checked="new Set()" :color-by-genre="false" :selected-circle-id="null" />
      </div>
      <p v-if="previewMap" class="text-xs text-slate-500">{{ t('admin_pages.event_venue.preview_help') }}</p>
    </template>
  </div>
</template>
