<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })

interface Edition {
  key: string
  name: string
  active: boolean
  event_id: number | null
  event: null | {
    id: number
    name: string
    slug: string
    start_date: string | null
    circles_count: number
    has_map: boolean
    last_import: { id: number, status: BatchImport['status'], batch: string | null } | null
  }
}
interface BatchSummary {
  circles: { total: number, new: number, updated: number, removed: number, catalog_only: number }
  map: null | { spaces: number, circles_without_space: string[], circles_without_space_count: number, empty_spaces: string[], empty_spaces_count: number, off_map_areas?: Record<string, number>, warnings: string[] }
  artists: { handle: number, url: number, name: number, kept: number, create: number }
  notes: string[]
}
interface BatchImport {
  id: number
  status: 'queued' | 'running' | 'ready' | 'applying' | 'applied' | 'failed'
  clean: boolean
  summary: BatchSummary | null
  error: string | null
  event: { id: number, name: string, slug: string, start_date: string | null } | null
}

const route = useRoute()
const router = useRouter()
const { $api } = useNuxtApp()
const { t } = useAdminI18n()
const { localizeError } = useLocalizedApiError((key, params) => params ? t(key, params) : t(key))

const source = ref('m3')
const message = ref('')
const busy = ref(false)

// ===== Editions =====
const { data: editions, pending: editionsPending, error: editionsError, refresh: refreshEditions } = await useAsyncData('admin-import-editions',
  () => $api<{ editions: Edition[] }>(`/v1/admin/import-sources/${source.value}/editions`), { watch: [source] })
const selected = ref(new Set<number>())
watch(editions, (value) => {
  // Editions not imported yet start selected.
  selected.value = new Set((value?.editions ?? []).filter(e => e.event && !e.event.circles_count).map(e => e.event!.id))
}, { immediate: true })
const toggle = (id: number) => {
  const next = new Set(selected.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  selected.value = next
}
const selectAll = (onlyMissing: boolean) => {
  selected.value = new Set((editions.value?.editions ?? []).filter(e => e.event && (!onlyMissing || !e.event.circles_count)).map(e => e.event!.id))
}

const start = async () => {
  busy.value = true
  message.value = ''
  try {
    const data = await $api<{ batch: string }>('/v1/admin/event-imports/batches', { method: 'POST', body: { source: source.value, event_ids: [...selected.value] } })
    await router.replace({ query: { ...route.query, batch: data.batch } })
  } catch (e) {
    message.value = localizeError(e)
  } finally {
    busy.value = false
  }
}

// ===== Batch =====
const batchId = computed(() => typeof route.query.batch === 'string' ? route.query.batch : '')
const { data: batch, error: batchError, refresh: refreshBatch } = await useAsyncData('admin-import-batch',
  () => batchId.value ? $api<{ batch: string, imports: BatchImport[] }>(`/v1/admin/event-imports/batches/${batchId.value}`) : Promise.resolve(null),
  { watch: [batchId] })
const imports = computed(() => batch.value?.imports ?? [])
const working = computed(() => imports.value.some(i => ['queued', 'running', 'applying'].includes(i.status)))
let poll: ReturnType<typeof setInterval> | null = null
watch(working, (value) => {
  if (poll) clearInterval(poll)
  poll = value && import.meta.client ? setInterval(() => refreshBatch(), 3000) : null
  if (!value) refreshEditions()
}, { immediate: true })
onBeforeUnmount(() => poll && clearInterval(poll))

const ready = computed(() => imports.value.filter(i => i.status === 'ready'))
const cleanReady = computed(() => ready.value.filter(i => i.clean))
const picked = ref(new Set<number>())
watch(ready, (value) => {
  picked.value = new Set([...picked.value].filter(id => value.some(i => i.id === id)))
})
const togglePicked = (id: number) => {
  const next = new Set(picked.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  picked.value = next
}
const apply = async (ids: number[] | null) => {
  const runs = ids ? ready.value.filter(i => ids.includes(i.id)) : cleanReady.value
  if (!runs.length) return
  const artists = runs.reduce((n, i) => n + (i.summary?.artists.create ?? 0), 0)
  if (!window.confirm(t('admin_pages.event_imports.confirm', { count: runs.length, artists }))) return
  busy.value = true
  message.value = ''
  try {
    await $api(`/v1/admin/event-imports/batches/${batchId.value}/apply`, { method: 'POST', body: ids ? { import_ids: ids } : {} })
    picked.value = new Set()
    await refreshBatch()
  } catch (e) {
    message.value = localizeError(e)
  } finally {
    busy.value = false
  }
}

const statusClass = (status: BatchImport['status']) => ({
  queued: 'bg-slate-100 text-slate-600', running: 'bg-sky-100 text-sky-700', ready: 'bg-amber-100 text-amber-800',
  applying: 'bg-sky-100 text-sky-700', applied: 'bg-emerald-100 text-emerald-700', failed: 'bg-red-100 text-red-700',
})[status]
const issues = (run: BatchImport) => {
  const map = run.summary?.map
  if (!run.summary) return []
  if (!map) return [t('admin_pages.event_imports.no_map')]
  return [
    map.circles_without_space_count ? t('admin_pages.event_imports.unplaced', { count: map.circles_without_space_count, list: map.circles_without_space.slice(0, 6).join(' ') }) : '',
    map.empty_spaces_count ? t('admin_pages.event_imports.empty', { count: map.empty_spaces_count, list: map.empty_spaces.slice(0, 6).join(' ') }) : '',
    ...map.warnings,
  ].filter(Boolean)
}
const offMap = (run: BatchImport) => Object.entries(run.summary?.map?.off_map_areas ?? {}).map(([area, count]) => `${area} ${count}`).join(' · ')

useHead({ title: computed(() => t('admin_pages.event_imports.title')) })
</script>

<template>
  <div class="mx-auto max-w-6xl space-y-5 p-4 sm:p-8">
    <header>
      <h1 class="text-3xl font-bold">{{ t('admin_pages.event_imports.title') }}</h1>
      <p class="mt-2 text-sm text-slate-600">{{ t('admin_pages.event_imports.description') }}</p>
    </header>
    <p v-if="message" role="alert" class="text-sm text-red-700">{{ message }}</p>

    <!-- Editions -->
    <section class="rounded-xl border border-slate-200 bg-white">
      <div class="flex flex-wrap items-center gap-3 border-b border-slate-100 px-5 py-3">
        <h2 class="font-semibold">{{ t('admin_pages.event_imports.editions') }}</h2>
        <select v-model="source" class="rounded-lg border border-slate-300 px-2 py-1 text-sm">
          <option value="m3">{{ t('admin_pages.event_venue.sources.m3') }}</option>
        </select>
        <div class="ml-auto flex gap-3 text-xs">
          <button type="button" class="underline" @click="selectAll(true)">{{ t('admin_pages.event_imports.select_missing') }}</button>
          <button type="button" class="underline" @click="selectAll(false)">{{ t('admin_pages.event_imports.select_all') }}</button>
          <button type="button" class="underline" @click="selected = new Set()">{{ t('admin_pages.event_imports.select_none') }}</button>
        </div>
      </div>
      <AdminListState :pending="editionsPending && !editions" :error="editionsError" :empty="!editions?.editions.length" @retry="refreshEditions()">
        <table class="w-full text-left text-sm">
          <thead class="border-b border-slate-100 bg-slate-50 text-xs text-slate-500">
            <tr>
              <th class="w-10 px-4 py-2" />
              <th class="px-4 py-2">{{ t('admin_pages.event_imports.edition') }}</th>
              <th class="px-4 py-2">{{ t('admin_pages.event_imports.event') }}</th>
              <th class="px-4 py-2">{{ t('admin_pages.event_imports.current') }}</th>
              <th class="px-4 py-2">{{ t('admin_pages.event_imports.last_import') }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="edition in editions?.editions" :key="edition.key" :class="{ 'text-slate-400': !edition.event }">
              <td class="px-4 py-2">
                <input v-if="edition.event" type="checkbox" :checked="selected.has(edition.event.id)" :aria-label="edition.name" @change="toggle(edition.event.id)">
              </td>
              <td class="px-4 py-2 font-medium">{{ edition.name }} <span class="font-mono text-xs text-slate-400">{{ edition.key }}</span></td>
              <td class="px-4 py-2">
                <NuxtLink v-if="edition.event" :to="`/admin/events/${edition.event.id}`" class="underline">{{ edition.event.name }}</NuxtLink>
                <span v-else>{{ t('admin_pages.event_imports.no_event') }}</span>
              </td>
              <td class="px-4 py-2 text-xs text-slate-600">
                <template v-if="edition.event">{{ t('admin_pages.event_imports.circles', { count: edition.event.circles_count }) }} · {{ edition.event.has_map ? t('admin_pages.event_imports.has_map') : t('admin_pages.event_imports.no_map_yet') }}</template>
              </td>
              <td class="px-4 py-2">
                <span v-if="edition.event?.last_import" class="rounded-full px-2 py-0.5 text-xs" :class="statusClass(edition.event.last_import.status)">{{ t(`admin_pages.event_venue.statuses.${edition.event.last_import.status}`) }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </AdminListState>
      <div class="flex items-center gap-3 border-t border-slate-100 px-5 py-3">
        <button type="button" class="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-50" :disabled="busy || !selected.size || working" @click="start">
          {{ t('admin_pages.event_imports.fetch', { count: selected.size }) }}
        </button>
        <span class="text-xs text-slate-500">{{ t('admin_pages.event_imports.fetch_help') }}</span>
      </div>
    </section>

    <!-- Batch -->
    <section v-if="batchId" class="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
      <div class="flex flex-wrap items-center gap-3">
        <h2 class="font-semibold">{{ t('admin_pages.event_imports.batch') }}</h2>
        <span class="font-mono text-xs text-slate-400">{{ batchId.slice(0, 8) }}</span>
        <span v-if="working" class="text-xs text-slate-500">{{ t('admin_pages.event_venue.working') }}</span>
        <div class="ml-auto flex gap-2">
          <button type="button" class="rounded-lg bg-emerald-700 px-3 py-1.5 text-sm text-white disabled:opacity-50" :disabled="busy || !cleanReady.length" @click="apply(null)">
            {{ t('admin_pages.event_imports.apply_clean', { count: cleanReady.length }) }}
          </button>
          <button type="button" class="rounded-lg border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-50" :disabled="busy || !picked.size" @click="apply([...picked])">
            {{ t('admin_pages.event_imports.apply_picked', { count: picked.size }) }}
          </button>
        </div>
      </div>
      <p class="text-xs text-slate-500">{{ t('admin_pages.event_imports.apply_help') }}</p>
      <p v-if="batchError" role="alert" class="text-sm text-red-700">{{ localizeError(batchError) }}</p>
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="border-b border-slate-100 text-xs text-slate-500">
            <tr>
              <th class="w-10 py-2" />
              <th class="py-2 pr-4">{{ t('admin_pages.event_imports.event') }}</th>
              <th class="py-2 pr-4">{{ t('admin_pages.event_imports.status') }}</th>
              <th class="py-2 pr-4">{{ t('admin_pages.event_venue.summary.circles') }}</th>
              <th class="py-2 pr-4">{{ t('admin_pages.event_venue.summary.map') }}</th>
              <th class="py-2 pr-4">{{ t('admin_pages.event_venue.summary.artists') }}</th>
              <th class="py-2">{{ t('admin_pages.event_imports.check') }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 align-top">
            <tr v-for="run in imports" :key="run.id">
              <td class="py-2.5"><input v-if="run.status === 'ready'" type="checkbox" :checked="picked.has(run.id)" :aria-label="run.event?.name" @change="togglePicked(run.id)"></td>
              <td class="py-2.5 pr-4">
                <NuxtLink v-if="run.event" :to="`/admin/events/${run.event.id}`" class="font-medium underline">{{ run.event.name }}</NuxtLink>
                <p class="text-xs text-slate-400">{{ run.event?.start_date }}</p>
              </td>
              <td class="py-2.5 pr-4"><span class="rounded-full px-2 py-0.5 text-xs" :class="statusClass(run.status)">{{ t(`admin_pages.event_venue.statuses.${run.status}`) }}</span></td>
              <td class="py-2.5 pr-4 tabular-nums">
                <template v-if="run.summary">{{ run.summary.circles.total }}<p class="text-xs text-slate-500">{{ t('admin_pages.event_imports.circle_changes', run.summary.circles) }}</p></template>
              </td>
              <td class="py-2.5 pr-4 tabular-nums">
                <template v-if="run.summary?.map">{{ run.summary.map.spaces }}<p v-if="offMap(run)" class="text-xs text-slate-500">{{ t('admin_pages.event_imports.off_map', { list: offMap(run) }) }}</p></template>
                <span v-else-if="run.summary" class="text-slate-400">—</span>
              </td>
              <td class="py-2.5 pr-4 tabular-nums">
                <template v-if="run.summary">{{ run.summary.artists.create }}<p class="text-xs text-slate-500">{{ t('admin_pages.event_imports.matched', { count: run.summary.artists.handle + run.summary.artists.url + run.summary.artists.name + run.summary.artists.kept }) }}</p></template>
              </td>
              <td class="py-2.5 text-xs">
                <p v-if="run.error" class="text-red-700">{{ run.error }}</p>
                <span v-else-if="run.clean" class="text-emerald-700">✓ {{ t('admin_pages.event_imports.clean') }}</span>
                <ul v-else class="space-y-0.5 text-amber-800">
                  <li v-for="issue in issues(run)" :key="issue">{{ issue }}</li>
                </ul>
                <ul v-if="run.summary?.notes.length" class="mt-1 space-y-0.5 text-slate-500">
                  <li v-for="note in run.summary.notes" :key="note">{{ note }}</li>
                </ul>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>
