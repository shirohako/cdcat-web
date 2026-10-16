<script setup lang="ts">
import type { AdminEventSeries } from '~/types/admin'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const { $api } = useNuxtApp()
const { t } = useAdminI18n()
const { localizeError } = useLocalizedApiError((key, params) => params ? t(key, params) : t(key))

const { data: series, pending, error, refresh } = await useAsyncData('admin-event-series',
  () => $api<AdminEventSeries[]>('/v1/admin/event-series'))

const busy = ref(false)
const message = ref('')
const notice = ref('')

// ===== Series form =====
const emptySeries = () => ({ id: 0, name: '', slug: '', location: '', website: '', banner_url: '' })
const seriesForm = reactive(emptySeries())
const seriesOpen = ref(false)
const editSeries = (item?: AdminEventSeries) => {
  Object.assign(seriesForm, emptySeries(), item ? { ...item, website: item.website ?? '', banner_url: item.banner_url ?? '' } : {})
  message.value = ''
  seriesOpen.value = true
}
const saveSeries = async () => {
  busy.value = true
  message.value = ''
  try {
    const body = { name: seriesForm.name, slug: seriesForm.slug, location: seriesForm.location, website: seriesForm.website || null, banner_url: seriesForm.banner_url || null }
    await $api(seriesForm.id ? `/v1/admin/event-series/${seriesForm.id}` : '/v1/admin/event-series', { method: seriesForm.id ? 'PUT' : 'POST', body })
    seriesOpen.value = false
    notice.value = t('admin_pages.saved')
    await refresh()
  } catch (e) {
    message.value = localizeError(e)
  } finally {
    busy.value = false
  }
}

// ===== Delete =====
const deleting = ref<AdminEventSeries | null>(null)
const deleteOpen = ref(false)
const startDelete = (item: AdminEventSeries) => {
  deleting.value = item
  message.value = ''
  deleteOpen.value = true
}
const confirmDelete = async (reason: string) => {
  if (!deleting.value || busy.value) return
  busy.value = true
  try {
    await $api(`/v1/admin/event-series/${deleting.value.id}`, { method: 'DELETE', body: { reason } })
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
useHead({ title: computed(() => `${t('admin_pages.event_series.title')} | CDCAT`) })
</script>

<template>
  <div class="mx-auto max-w-6xl space-y-5 p-4 sm:p-8">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold">{{ t('admin_pages.event_series.title') }}</h1>
        <p class="mt-2 text-sm text-slate-600">{{ t('admin_pages.event_series.description') }}</p>
      </div>
      <button type="button" class="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white" @click="editSeries()">{{ t('admin_pages.event_series.create') }}</button>
    </header>
    <p v-if="notice" role="status" class="text-sm text-emerald-700">{{ notice }}</p>
    <p v-if="message && !seriesOpen" role="alert" class="text-sm text-red-700">{{ message }}</p>

    <section v-if="seriesOpen" class="rounded-xl border border-slate-200 bg-white p-5">
      <h2 class="font-semibold">{{ seriesForm.id ? t('admin_pages.event_series.edit') : t('admin_pages.event_series.create') }}</h2>
      <form class="mt-4 grid gap-4 text-sm sm:grid-cols-2" @submit.prevent="saveSeries">
        <label class="block">{{ t('admin_pages.event_series.name') }}<input v-model="seriesForm.name" required maxlength="255" :class="input"></label>
        <label class="block">Slug<input v-model="seriesForm.slug" required maxlength="255" pattern="[A-Za-z0-9]+(-[A-Za-z0-9]+)*" :class="input"></label>
        <label class="block">{{ t('admin_pages.event_series.location') }}<input v-model="seriesForm.location" required maxlength="255" :class="input"></label>
        <label class="block">{{ t('admin_pages.event_series.website') }}<input v-model="seriesForm.website" type="url" maxlength="2048" :class="input"></label>
        <label class="block sm:col-span-2">{{ t('admin_pages.event_series.banner') }}<input v-model="seriesForm.banner_url" type="url" maxlength="2048" placeholder="https://" :class="input"><span class="mt-1 block text-xs text-slate-500">{{ t('admin_pages.event_series.banner_help') }}</span></label>
        <img v-if="seriesForm.banner_url" :src="seriesForm.banner_url" alt="" class="aspect-video w-full max-w-sm rounded-lg border border-slate-200 bg-slate-50 object-contain sm:col-span-2">
        <div class="flex items-end justify-end gap-2 sm:col-span-2">
          <p v-if="message" role="alert" class="mr-auto text-red-700">{{ message }}</p>
          <button type="button" :disabled="busy" class="rounded-lg border px-3 py-2" @click="seriesOpen = false">{{ t('common.cancel') }}</button>
          <button type="submit" :disabled="busy" class="rounded-lg bg-slate-900 px-3 py-2 text-white disabled:opacity-50">{{ busy ? t('common.saving') : t('common.save') }}</button>
        </div>
      </form>
    </section>

    <section class="rounded-xl border border-slate-200 bg-white">
      <AdminListState :pending="pending" :error="error" :empty="!series?.length" @retry="refresh()">
        <div class="overflow-x-auto">
          <table class="w-full min-w-150 text-left text-sm">
            <thead class="border-b border-slate-100 bg-slate-50 text-xs text-slate-500"><tr><th class="px-4 py-3">{{ t('admin_pages.event_series.name') }}</th><th class="px-4 py-3">{{ t('admin_pages.event_series.location') }}</th><th class="px-4 py-3">{{ t('admin_pages.event_series.events_count') }}</th><th class="px-4 py-3" /></tr></thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="item in series" :key="item.id">
                <td class="px-4 py-3 font-medium"><div class="flex items-center gap-3"><img v-if="item.banner_url" :src="item.banner_url" alt="" loading="lazy" class="aspect-video w-16 shrink-0 rounded bg-slate-50 object-contain"><div v-else class="aspect-video w-16 shrink-0 rounded bg-slate-100" /><div>{{ item.name }}<p class="text-xs font-normal text-slate-500">{{ item.slug }}</p></div></div></td>
                <td class="px-4 py-3">{{ item.location }}</td>
                <td class="px-4 py-3 tabular-nums"><NuxtLink v-if="item.events_count" :to="{ path: '/admin/events', query: { series_id: item.id } }" class="underline decoration-slate-300 underline-offset-4">{{ item.events_count }}</NuxtLink><span v-else class="text-slate-400">0</span></td>
                <td class="px-4 py-3"><div class="flex justify-end gap-3 text-xs"><button type="button" class="underline" @click="editSeries(item)">{{ t('common.edit') }}</button><button type="button" class="text-red-700" @click="startDelete(item)">{{ t('common.delete') }}</button></div></td>
              </tr>
            </tbody>
          </table>
        </div>
      </AdminListState>
    </section>

    <AdminConfirmDialog v-model="deleteOpen" :busy="busy" reason-required :title="t('admin_pages.content.delete_title', { name: deleting?.name ?? '' })" :description="t('admin_pages.event_series.delete_help')" @confirm="confirmDelete" />
  </div>
</template>
