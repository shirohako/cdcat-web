<script setup lang="ts">
import type { AdminLyric, AdminPagination } from '~/types/admin'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const route = useRoute()
const router = useRouter()
const { $api } = useNuxtApp()
const { t } = useAdminI18n()
const { localizeError } = useLocalizedApiError((key, params) => params ? t(key, params) : t(key))

const filterKeys = ['search', 'language', 'format', 'is_ai_generated', 'is_translation', 'submitted_by', 'album_id', 'track_id'] as const
const filters = reactive(Object.fromEntries(filterKeys.map(key => [key, String(route.query[key] ?? '')])) as Record<typeof filterKeys[number], string>)
watch(() => route.query, (query) => { for (const key of filterKeys) filters[key] = String(query[key] ?? '') })
const page = computed({
  get: () => Math.max(1, Number.parseInt(String(route.query.page || '1')) || 1),
  set: value => { router.push({ query: { ...route.query, page: value > 1 ? value : undefined } }) },
})
const applyFilters = () => router.push({ query: Object.fromEntries(filterKeys.filter(key => filters[key].trim()).map(key => [key, filters[key].trim()])) })
const query = computed(() => ({ page: page.value, ...Object.fromEntries(filterKeys.map(key => [key, route.query[key] || undefined])) }))
const { data, pending, error, refresh } = await useAsyncData('admin-lyrics',
  () => $api<{ items: AdminLyric[], pagination: AdminPagination }>('/v1/admin/lyrics', { query: query.value }), { watch: [query] })

const empty = () => ({ id: 0, track_id: '', language: 'ja', format: 'plain', content: '', is_primary: false, is_translation: false, is_ai_generated: false, authorship: '', source: '', reason: '' })
const form = reactive(empty())
const formOpen = ref(false)
const busy = ref(false)
const message = ref('')
const notice = ref('')
const edit = async (lyric?: AdminLyric) => {
  message.value = ''
  if (!lyric) {
    Object.assign(form, empty(), { track_id: String(route.query.track_id ?? '') })
    formOpen.value = true
    return
  }
  try {
    const full = await $api<AdminLyric>(`/v1/admin/lyrics/${lyric.id}`)
    Object.assign(form, empty(), { ...full, track_id: String(full.track_id), authorship: full.authorship ?? '', source: full.source ?? '', content: full.content ?? '' })
    formOpen.value = true
  } catch (e) {
    message.value = localizeError(e)
  }
}
const save = async () => {
  busy.value = true
  message.value = ''
  try {
    const body = { language: form.language, format: form.format, content: form.content, is_primary: form.is_primary, is_translation: form.is_translation,
      is_ai_generated: form.is_ai_generated, authorship: form.authorship || null, source: form.source || null, reason: form.reason || null }
    await $api(form.id ? `/v1/admin/lyrics/${form.id}` : '/v1/admin/lyrics', { method: form.id ? 'PUT' : 'POST', body: form.id ? body : { ...body, track_id: Number(form.track_id) } })
    formOpen.value = false
    notice.value = t('admin_pages.saved')
    await refresh()
  } catch (e) {
    message.value = localizeError(e)
  } finally {
    busy.value = false
  }
}
const deleting = ref<AdminLyric | null>(null)
const deleteOpen = ref(false)
const remove = (lyric: AdminLyric) => { deleting.value = lyric; deleteOpen.value = true }
const confirmDelete = async (reason: string) => {
  if (!deleting.value) return
  busy.value = true
  try {
    await $api(`/v1/admin/lyrics/${deleting.value.id}`, { method: 'DELETE', body: { reason } })
    deleteOpen.value = false
    await refresh()
  } catch (e) {
    message.value = localizeError(e)
    deleteOpen.value = false
  } finally {
    busy.value = false
  }
}
const field = 'rounded-lg border border-slate-300 bg-white px-3 py-2'
const input = 'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2'
useHead({ title: computed(() => t('admin_pages.lyrics.title')) })
</script>

<template>
  <div class="mx-auto max-w-6xl space-y-5 p-4 sm:p-8">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold">{{ t('admin_pages.lyrics.title') }}</h1>
        <p class="mt-2 text-sm text-slate-600">{{ t('admin_pages.lyrics.description') }}</p>
      </div>
      <button type="button" class="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white" @click="edit()">{{ t('admin_pages.lyrics.create') }}</button>
    </header>
    <AdminFilterBar>
      <form class="flex flex-wrap items-end gap-2 text-sm" @submit.prevent="applyFilters">
        <input v-model="filters.search" type="search" maxlength="100" :placeholder="t('admin_pages.lyrics.search')" :aria-label="t('admin_pages.lyrics.search')" :class="[field, 'w-52']">
        <input v-model="filters.language" maxlength="10" :placeholder="t('admin_pages.lyrics.language')" :aria-label="t('admin_pages.lyrics.language')" :class="[field, 'w-24']">
        <select v-model="filters.format" :aria-label="t('admin_pages.lyrics.format')" :class="field"><option value="">{{ t('admin_pages.lyrics.format') }}</option><option v-for="format in ['plain', 'lrc', 'srt']" :key="format" :value="format">{{ format }}</option></select>
        <select v-model="filters.is_ai_generated" :aria-label="t('admin_pages.lyrics.ai')" :class="field"><option value="">{{ t('admin_pages.lyrics.ai') }}</option><option value="1">{{ t('admin_pages.lyrics.ai_yes') }}</option><option value="0">{{ t('admin_pages.lyrics.ai_no') }}</option></select>
        <select v-model="filters.is_translation" :aria-label="t('admin_pages.lyrics.translation')" :class="field"><option value="">{{ t('admin_pages.lyrics.translation') }}</option><option value="1">{{ t('admin_pages.lyrics.translation_yes') }}</option><option value="0">{{ t('admin_pages.lyrics.translation_no') }}</option></select>
        <input v-model="filters.submitted_by" inputmode="numeric" pattern="[0-9]*" :placeholder="t('admin_pages.lyrics.submitter_id')" :aria-label="t('admin_pages.lyrics.submitter_id')" :class="[field, 'w-28']">
        <input v-model="filters.album_id" inputmode="numeric" pattern="[0-9]*" :placeholder="t('admin_pages.content.album_id')" :aria-label="t('admin_pages.content.album_id')" :class="[field, 'w-24']">
        <button type="submit" class="rounded-lg bg-slate-900 px-3 py-2 text-white">{{ t('admin_pages.apply') }}</button>
      </form>
    </AdminFilterBar>
    <p v-if="notice" role="status" class="text-sm text-emerald-700">{{ notice }}</p>
    <p v-if="message && !formOpen" role="alert" class="text-sm text-red-700">{{ message }}</p>

    <section v-if="formOpen" class="rounded-xl border border-slate-200 bg-white p-5">
      <h2 class="font-semibold">{{ form.id ? t('admin_pages.lyrics.edit', { id: form.id }) : t('admin_pages.lyrics.create') }}</h2>
      <form class="mt-4 grid gap-4 text-sm sm:grid-cols-3" @submit.prevent="save">
        <label class="block">{{ t('admin_pages.lyrics.track_id') }}<input v-model="form.track_id" required :disabled="Boolean(form.id)" inputmode="numeric" pattern="[0-9]+" :class="input"></label>
        <label class="block">{{ t('admin_pages.lyrics.language') }}<input v-model="form.language" required maxlength="10" :class="input"></label>
        <label class="block">{{ t('admin_pages.lyrics.format') }}<select v-model="form.format" :class="input"><option v-for="format in ['plain', 'lrc', 'srt']" :key="format" :value="format">{{ format }}</option></select></label>
        <label class="block">{{ t('admin_pages.lyrics.authorship') }}<select v-model="form.authorship" :class="input"><option value="">—</option><option value="original">{{ t('admin_pages.lyrics.original') }}</option><option value="repost">{{ t('admin_pages.lyrics.repost') }}</option></select></label>
        <label class="block sm:col-span-2">{{ t('admin_pages.lyrics.source') }}<input v-model="form.source" maxlength="500" :class="input"></label>
        <div class="flex flex-wrap gap-4 sm:col-span-3">
          <label class="flex items-center gap-2"><input v-model="form.is_primary" type="checkbox">{{ t('admin_pages.lyrics.primary') }}</label>
          <label class="flex items-center gap-2"><input v-model="form.is_translation" type="checkbox">{{ t('admin_pages.lyrics.translation_yes') }}</label>
          <label class="flex items-center gap-2"><input v-model="form.is_ai_generated" type="checkbox">{{ t('admin_pages.lyrics.ai_yes') }}</label>
        </div>
        <label class="block sm:col-span-3">{{ t('admin_pages.lyrics.content') }}<textarea v-model="form.content" required rows="14" :class="[input, 'font-mono text-xs']" /></label>
        <label class="block sm:col-span-3">{{ t('admin_pages.optional_reason') }}<input v-model="form.reason" maxlength="2000" :class="input"></label>
        <div class="flex items-center justify-end gap-2 sm:col-span-3">
          <p v-if="message" role="alert" class="mr-auto text-red-700">{{ message }}</p>
          <button type="button" :disabled="busy" class="rounded-lg border px-3 py-2" @click="formOpen = false">{{ t('common.cancel') }}</button>
          <button type="submit" :disabled="busy" class="rounded-lg bg-slate-900 px-3 py-2 text-white disabled:opacity-50">{{ busy ? t('common.saving') : t('common.save') }}</button>
        </div>
      </form>
    </section>

    <section class="rounded-xl border border-slate-200 bg-white">
      <AdminListState :pending="pending" :error="error" :empty="!data?.items.length" @retry="refresh()">
        <div class="overflow-x-auto">
          <table class="w-full min-w-200 text-left text-sm">
            <thead class="border-b border-slate-100 bg-slate-50 text-xs text-slate-500"><tr><th class="px-4 py-3">ID</th><th class="px-4 py-3">{{ t('admin_pages.lyrics.track') }}</th><th class="px-4 py-3">{{ t('admin_pages.lyrics.language') }}</th><th class="px-4 py-3">{{ t('admin_pages.lyrics.excerpt') }}</th><th class="px-4 py-3">{{ t('admin_pages.lyrics.submitter') }}</th><th class="px-4 py-3" /></tr></thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="lyric in data?.items" :key="lyric.id">
                <td class="px-4 py-3 font-mono text-xs text-slate-500">{{ lyric.id }}</td>
                <td class="px-4 py-3"><p class="font-medium">{{ lyric.track?.title ?? `#${lyric.track_id}` }}</p><NuxtLink v-if="lyric.album" :to="`/albums/${lyric.album.id}`" target="_blank" class="text-xs text-slate-500 underline">{{ lyric.album.title }}</NuxtLink></td>
                <td class="px-4 py-3 text-xs">{{ lyric.language }} · {{ lyric.format }}<span v-if="lyric.is_translation"> · {{ t('admin_pages.lyrics.translation_yes') }}</span><span v-if="lyric.is_ai_generated" class="text-amber-700"> · AI</span></td>
                <td class="max-w-xs truncate px-4 py-3 text-xs text-slate-600">{{ lyric.excerpt }}</td>
                <td class="px-4 py-3 text-xs">{{ lyric.submitter?.nickname || lyric.submitter?.username || '—' }}</td>
                <td class="px-4 py-3"><div class="flex justify-end gap-3 text-xs"><button type="button" class="underline" @click="edit(lyric)">{{ t('common.edit') }}</button><button type="button" class="text-red-700" @click="remove(lyric)">{{ t('common.delete') }}</button></div></td>
              </tr>
            </tbody>
          </table>
        </div>
        <footer v-if="data" class="border-t border-slate-100 px-5 py-3"><CommonPagination v-model:page="page" :total-pages="data.pagination.last_page" :disabled="pending" /></footer>
      </AdminListState>
    </section>
    <AdminConfirmDialog v-model="deleteOpen" :busy="busy" reason-required :title="t('admin_pages.lyrics.delete_title')" :description="t('admin_pages.lyrics.delete_help')" @confirm="confirmDelete" />
  </div>
</template>
