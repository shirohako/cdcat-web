<script setup lang="ts">
import type { AdminEvent, AdminEventSeries, AdminPagination } from '~/types/admin'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const route = useRoute()
const router = useRouter()
const { $api } = useNuxtApp()
const { t } = useAdminI18n()
const { localizeError } = useLocalizedApiError((key, params) => params ? t(key, params) : t(key))

const search = ref(String(route.query.search ?? ''))
const seriesFilter = ref(String(route.query.series_id ?? ''))
const page = computed({
  get: () => Math.max(1, Number.parseInt(String(route.query.page || '1')) || 1),
  set: value => { router.push({ query: { ...route.query, page: value > 1 ? value : undefined } }) },
})
const applyFilters = () => router.push({ query: { search: search.value.trim() || undefined, series_id: seriesFilter.value || undefined } })
const query = computed(() => ({ page: page.value, search: route.query.search || undefined, series_id: route.query.series_id || undefined }))

const { data: events, pending, error, refresh } = await useAsyncData('admin-events',
  () => $api<{ events: AdminEvent[], pagination: AdminPagination }>('/v1/admin/events', { query: query.value }), { watch: [query] })
const { data: series } = await useAsyncData('admin-event-series',
  () => $api<AdminEventSeries[]>('/v1/admin/event-series'))

const busy = ref(false)
const message = ref('')
const notice = ref('')

// ===== Event form =====
const emptyEvent = () => ({ id: 0, event_series_id: '', name: '', slug: '', start_date: '', end_date: '', venue: '', location: '', main_visual_url: '' })
const eventForm = reactive(emptyEvent())
const eventOpen = ref(false)
const editEvent = (event?: AdminEvent) => {
  Object.assign(eventForm, emptyEvent(), event ? {
    ...event, event_series_id: event.event_series_id ? String(event.event_series_id) : '', end_date: event.end_date ?? '', venue: event.venue ?? '',
    location: event.location ?? '', main_visual_url: event.main_visual_url ?? '',
  } : {})
  message.value = ''
  eventOpen.value = true
}
const saveEvent = async () => {
  busy.value = true
  message.value = ''
  try {
    const body = {
      event_series_id: eventForm.event_series_id ? Number(eventForm.event_series_id) : null, name: eventForm.name, slug: eventForm.slug, start_date: eventForm.start_date,
      end_date: eventForm.end_date || null, venue: eventForm.venue || null, location: eventForm.location || null, main_visual_url: eventForm.main_visual_url || null,
    }
    await $api(eventForm.id ? `/v1/admin/events/${eventForm.id}` : '/v1/admin/events', { method: eventForm.id ? 'PUT' : 'POST', body })
    eventOpen.value = false
    notice.value = t('admin_pages.saved')
    await refresh()
  } catch (e) {
    message.value = localizeError(e)
  } finally {
    busy.value = false
  }
}

// ===== Delete =====
const deleting = ref<AdminEvent | null>(null)
const deleteOpen = ref(false)
const startDelete = (event: AdminEvent) => {
  deleting.value = event
  message.value = ''
  deleteOpen.value = true
}
const confirmDelete = async (reason: string) => {
  if (!deleting.value || busy.value) return
  busy.value = true
  try {
    await $api(`/v1/admin/events/${deleting.value.id}`, { method: 'DELETE', body: { reason } })
    deleteOpen.value = false
    await refresh()
  } catch (e) {
    const blockers = (e as { details?: { details?: { blockers?: string[] } } }).details?.details?.blockers
    message.value = blockers?.length ? blockers.join(' ') : localizeError(e)
    deleteOpen.value = false
  } finally {
    busy.value = false
  }
}
const input = 'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2'
useHead({ title: computed(() => `${t('admin_pages.events.title')} | CDCAT`) })
</script>

<template>
  <div class="mx-auto max-w-6xl space-y-5 p-4 sm:p-8">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold">{{ t('admin_pages.events.title') }}</h1>
        <p class="mt-2 text-sm text-slate-600">{{ t('admin_pages.events.description') }}</p>
      </div>
      <button type="button" class="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white" @click="editEvent()">{{ t('admin_pages.events.create') }}</button>
    </header>
    <p v-if="notice" role="status" class="text-sm text-emerald-700">{{ notice }}</p>
    <p v-if="message && !eventOpen" role="alert" class="text-sm text-red-700">{{ message }}</p>

    <section v-if="eventOpen" class="rounded-xl border border-slate-200 bg-white p-5">
      <h2 class="font-semibold">{{ eventForm.id ? t('admin_pages.events.edit') : t('admin_pages.events.create') }}</h2>
      <form class="mt-4 grid gap-4 text-sm sm:grid-cols-2" @submit.prevent="saveEvent">
        <label class="block">{{ t('admin_pages.events.series') }}<select v-model="eventForm.event_series_id" :class="input"><option value="">{{ t('admin_pages.events.no_series') }}</option><option v-for="item in series" :key="item.id" :value="String(item.id)">{{ item.name }}</option></select></label>
        <label class="block">{{ t('admin_pages.events.name') }}<input v-model="eventForm.name" required maxlength="255" :class="input"></label>
        <label class="block">Slug<input v-model="eventForm.slug" required maxlength="255" pattern="[A-Za-z0-9]+(-[A-Za-z0-9]+)*" :class="input"></label>
        <label class="block">{{ t('admin_pages.events.start_date') }}<input v-model="eventForm.start_date" required type="date" :class="input"></label>
        <label class="block">{{ t('admin_pages.events.end_date') }}<input v-model="eventForm.end_date" type="date" :min="eventForm.start_date" :class="input"></label>
        <label class="block">{{ t('admin_pages.events.venue') }}<input v-model="eventForm.venue" maxlength="255" :class="input"></label>
        <label class="block">{{ t('admin_pages.events.location') }}<input v-model="eventForm.location" maxlength="255" :class="input"></label>
        <label class="block">{{ t('admin_pages.events.visual') }}<input v-model="eventForm.main_visual_url" type="url" maxlength="500" :class="input"></label>
        <div class="flex items-end justify-end gap-2 sm:col-span-2">
          <p v-if="message" role="alert" class="mr-auto text-red-700">{{ message }}</p>
          <button type="button" :disabled="busy" class="rounded-lg border px-3 py-2" @click="eventOpen = false">{{ t('common.cancel') }}</button>
          <button type="submit" :disabled="busy" class="rounded-lg bg-slate-900 px-3 py-2 text-white disabled:opacity-50">{{ busy ? t('common.saving') : t('common.save') }}</button>
        </div>
      </form>
    </section>

    <AdminFilterBar>
      <form class="flex flex-wrap items-end gap-2 text-sm" @submit.prevent="applyFilters">
        <input v-model="search" type="search" maxlength="100" :placeholder="t('admin_pages.events.search')" :aria-label="t('admin_pages.events.search')" class="w-56 rounded-lg border border-slate-300 bg-white px-3 py-2">
        <select v-model="seriesFilter" :aria-label="t('admin_pages.events.series')" class="rounded-lg border border-slate-300 bg-white px-3 py-2"><option value="">{{ t('admin_pages.events.all_series') }}</option><option value="none">{{ t('admin_pages.events.no_series') }}</option><option v-for="item in series" :key="item.id" :value="String(item.id)">{{ item.name }}</option></select>
        <button type="submit" class="rounded-lg bg-slate-900 px-3 py-2 text-white">{{ t('admin_pages.apply') }}</button>
      </form>
    </AdminFilterBar>
    <section class="rounded-xl border border-slate-200 bg-white">
      <AdminListState :pending="pending" :error="error" :empty="!events?.events.length" @retry="refresh()">
        <div class="overflow-x-auto">
          <table class="w-full min-w-175 text-left text-sm">
            <thead class="border-b border-slate-100 bg-slate-50 text-xs text-slate-500"><tr><th class="px-4 py-3">{{ t('admin_pages.events.name') }}</th><th class="px-4 py-3">{{ t('admin_pages.events.series') }}</th><th class="px-4 py-3">{{ t('admin_pages.events.start_date') }}</th><th class="px-4 py-3">{{ t('admin_pages.events.released_works') }}</th><th class="px-4 py-3" /></tr></thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="event in events?.events" :key="event.id">
                <td class="px-4 py-3 font-medium">{{ event.name }}<p class="text-xs font-normal text-slate-500">{{ event.slug }}<template v-if="event.venue"> · {{ event.venue }}</template></p></td>
                <td class="px-4 py-3">{{ event.series?.name ?? '—' }}</td>
                <td class="px-4 py-3 tabular-nums">{{ event.start_date }}<template v-if="event.end_date && event.end_date !== event.start_date"> ~ {{ event.end_date }}</template></td>
                <td class="px-4 py-3 tabular-nums">{{ event.released_works_count }}</td>
                <td class="px-4 py-3"><div class="flex justify-end gap-3 text-xs"><button type="button" class="underline" @click="editEvent(event)">{{ t('common.edit') }}</button><button type="button" class="text-red-700" @click="startDelete(event)">{{ t('common.delete') }}</button></div></td>
              </tr>
            </tbody>
          </table>
        </div>
        <footer v-if="events" class="border-t border-slate-100 px-5 py-3"><CommonPagination v-model:page="page" :total-pages="events.pagination.last_page" :disabled="pending" /></footer>
      </AdminListState>
    </section>
    <AdminConfirmDialog v-model="deleteOpen" :busy="busy" reason-required :title="t('admin_pages.content.delete_title', { name: deleting?.name ?? '' })" :description="t('admin_pages.events.delete_help')" @confirm="confirmDelete" />
  </div>
</template>
