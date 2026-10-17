<script setup lang="ts">
import { adminContentRoutes, adminContentTypes } from '~/config/admin'
import type { AdminContentItem, AdminContentType, AdminPagination } from '~/types/admin'
import { ENTRY_TYPES } from '~/types/entry'

definePageMeta({
  layout: 'admin', middleware: 'admin',
  validate: route => (adminContentTypes as readonly string[]).includes(String(route.params.type)),
})

const route = useRoute()
const router = useRouter()
const { $api } = useNuxtApp()
const { t } = useAdminI18n()
const { typeLabel, typeWithFormat } = useEntryDisplay()
const { localizeError } = useLocalizedApiError((key, params) => params ? t(key, params) : t(key))

const type = computed(() => String(route.params.type) as AdminContentType)
const sorts: Record<AdminContentType, string[]> = {
  work: ['id', 'title', 'release_date', 'created_at', 'updated_at', 'reviews_count', 'views_count', 'rating'],
  artist: ['id', 'name', 'albums_count', 'followers_count', 'created_at', 'updated_at'],
  entry: ['id', 'name', 'release_date', 'created_at', 'updated_at'],
  franchise: ['id', 'name', 'entries_count', 'works_count', 'created_at', 'updated_at'],
  song: ['id', 'title', 'created_at'],
}
const filterKeys = ['search', 'type', 'classification', 'region', 'is_active', 'work_id', 'sort_by', 'sort_order'] as const
const filters = reactive(Object.fromEntries(filterKeys.map(key => [key, String(route.query[key] ?? '')])) as Record<typeof filterKeys[number], string>)
watch(() => route.query, (query) => { for (const key of filterKeys) filters[key] = String(query[key] ?? '') })
const page = computed({
  get: () => Math.max(1, Number.parseInt(String(route.query.page || '1')) || 1),
  set: value => { router.push({ query: { ...route.query, page: value > 1 ? value : undefined } }) },
})
const applyFilters = () => router.push({ query: Object.fromEntries(filterKeys.filter(key => filters[key].trim()).map(key => [key, filters[key].trim()])) })
const query = computed(() => ({ page: page.value, ...Object.fromEntries(filterKeys.map(key => [key, route.query[key] || undefined])) }))

const { data, pending, error, refresh } = await useAsyncData(() => `admin-content-${type.value}`,
  () => $api<{ items: AdminContentItem[], pagination: AdminPagination }>(`/v1/admin/content/${type.value}`, { query: query.value }), { watch: [query, type] })
const items = computed(() => data.value?.items ?? [])
const pagination = computed(() => data.value?.pagination ?? { total: 0, per_page: 15, current_page: 1, last_page: 1 })
const label = (item: AdminContentItem) => String(item.title ?? item.name ?? `#${item.id}`)
const editable = computed(() => type.value !== 'song')
const recountable = computed(() => ['work', 'artist'].includes(type.value))
const frontLink = (item: AdminContentItem) => type.value === 'song'
  ? `/works/${(item.work as { id: number } | null)?.id}` : `/${adminContentRoutes[type.value]?.front}/${item.id}`
const detail = (item: AdminContentItem) => [
  ...(type.value === 'work' ? [item.catalog_number, item.type, item.release_date] : []),
  ...(type.value === 'artist' ? [item.type && t(`admin_pages.content.artist_types.${item.type}`), item.region, item.is_active === false ? t('admin_pages.content.inactive') : null] : []),
  ...(type.value === 'entry' ? [typeWithFormat(item.type as string, item.format as string | null), item.release_date, t('admin_pages.content.works_count', { count: item.works_count })] : []),
  ...(type.value === 'franchise' ? [item.parent_id ? `↳ #${item.parent_id}` : null, t('admin_pages.content.entries_count', { count: item.entries_count }), t('admin_pages.content.works_count', { count: item.works_count })] : []),
  ...(type.value === 'song' ? [(item.work as { title: string } | null)?.title, `${item.disc_number}-${item.track_number}`, t('admin_pages.content.lyrics_count', { count: item.lyrics_count })] : []),
].filter(Boolean).join(' · ')

// ===== Recount =====
const selected = ref<number[]>([])
watch(items, () => { selected.value = [] })
const busy = ref(false)
const message = ref('')
const notice = ref('')
const recount = async (ids: number[]) => {
  if (busy.value || !ids.length) return
  busy.value = true
  message.value = ''
  try {
    const result = await $api<{ results: { id: number, changed: string[] }[] }>(`/v1/admin/content/${type.value}/recount`, { method: 'POST', body: { ids } })
    notice.value = t('admin_pages.content.recounted', { count: result.results.length, changed: result.results.filter(item => item.changed.length).length })
    await refresh()
  } catch (e) {
    message.value = localizeError(e)
  } finally {
    busy.value = false
  }
}
const time = (value: unknown) => value ? new Intl.DateTimeFormat('zh-CN', { dateStyle: 'short' }).format(new Date(String(value))) : '—'
useHead({ title: computed(() => t(`admin_pages.content.tabs.${type.value}`)) })
</script>

<template>
  <div class="mx-auto max-w-7xl space-y-5 p-4 sm:p-8">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="text-xs font-semibold text-slate-500">{{ t('admin_pages.content.title') }}</p>
        <h1 class="mt-1 text-3xl font-bold">{{ t(`admin_pages.content.tabs.${type}`) }}</h1>
        <p class="mt-2 text-sm text-slate-600">{{ t(`admin_pages.content.descriptions.${type}`) }}</p>
      </div>
      <NuxtLink v-if="editable" :to="`/admin/content/${type}/new`" class="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white">{{ t('admin_pages.content.create', { type: t(`admin_pages.content.tabs.${type}`) }) }}</NuxtLink>
    </header>

    <AdminFilterBar>
      <form class="flex flex-wrap items-end gap-2 text-sm" @submit.prevent="applyFilters">
        <input v-model="filters.search" type="search" maxlength="100" :placeholder="t('admin_pages.content.search')" :aria-label="t('admin_pages.content.search')" class="w-60 rounded-lg border border-slate-300 bg-white px-3 py-2">
        <input v-if="type === 'work'" v-model="filters.type" maxlength="100" :placeholder="t('admin_pages.content.type')" :aria-label="t('admin_pages.content.type')" class="w-32 rounded-lg border border-slate-300 bg-white px-3 py-2">
        <select v-if="type === 'entry'" v-model="filters.type" :aria-label="t('admin_pages.content.type')" class="rounded-lg border border-slate-300 bg-white px-3 py-2">
          <option value="">{{ t('admin_pages.content.type') }}</option>
          <option v-for="entryType in ENTRY_TYPES" :key="entryType" :value="entryType">{{ typeLabel(entryType) }}</option>
        </select>
        <input v-if="type === 'work'" v-model="filters.classification" maxlength="100" :placeholder="t('admin_pages.content.classification')" :aria-label="t('admin_pages.content.classification')" class="w-32 rounded-lg border border-slate-300 bg-white px-3 py-2">
        <template v-if="type === 'artist'">
          <select v-model="filters.type" :aria-label="t('admin_pages.content.type')" class="rounded-lg border border-slate-300 bg-white px-3 py-2">
            <option value="">{{ t('admin_pages.content.all_types') }}</option>
            <option v-for="value in ['person', 'group', 'company', 'virtual', 'circle']" :key="value" :value="value">{{ t(`admin_pages.content.artist_types.${value}`) }}</option>
          </select>
          <input v-model="filters.region" maxlength="100" :placeholder="t('admin_pages.content.region')" :aria-label="t('admin_pages.content.region')" class="w-28 rounded-lg border border-slate-300 bg-white px-3 py-2">
          <select v-model="filters.is_active" :aria-label="t('admin_pages.content.active')" class="rounded-lg border border-slate-300 bg-white px-3 py-2">
            <option value="">{{ t('admin_pages.all_statuses') }}</option><option value="1">{{ t('admin_pages.content.active') }}</option><option value="0">{{ t('admin_pages.content.inactive') }}</option>
          </select>
        </template>
        <input v-if="type === 'song'" v-model="filters.work_id" inputmode="numeric" pattern="[0-9]*" :placeholder="t('admin_pages.content.work_id')" :aria-label="t('admin_pages.content.work_id')" class="w-28 rounded-lg border border-slate-300 bg-white px-3 py-2">
        <select v-model="filters.sort_by" :aria-label="t('admin_pages.sort_by')" class="rounded-lg border border-slate-300 bg-white px-3 py-2">
          <option value="">{{ t('admin_pages.content.default_sort') }}</option>
          <option v-for="sort in sorts[type]" :key="sort" :value="sort">{{ t(`admin_pages.content.sorts.${sort}`) }}</option>
        </select>
        <select v-model="filters.sort_order" :aria-label="t('admin_pages.sort_order')" class="rounded-lg border border-slate-300 bg-white px-3 py-2"><option value="">{{ t('admin_pages.descending') }}</option><option value="asc">{{ t('admin_pages.ascending') }}</option></select>
        <button type="submit" class="rounded-lg bg-slate-900 px-3 py-2 text-white">{{ t('admin_pages.apply') }}</button>
      </form>
    </AdminFilterBar>

    <div class="flex flex-wrap items-center gap-3 text-sm">
      <span class="text-slate-500">{{ t('common.items_total', { count: pagination.total }) }}</span>
      <button v-if="recountable" type="button" :disabled="busy || !selected.length" class="ml-auto rounded-lg border bg-white px-3 py-1.5 disabled:opacity-40" @click="recount(selected)">{{ t('admin_pages.content.recount_selected', { count: selected.length }) }}</button>
    </div>
    <p v-if="notice" role="status" class="text-sm text-emerald-700">{{ notice }}</p>
    <p v-if="message" role="alert" class="text-sm text-red-700">{{ message }}</p>

    <section class="rounded-xl border border-slate-200 bg-white shadow-sm">
      <AdminListState :pending="pending" :error="error" :empty="!items.length" @retry="refresh()">
        <div class="overflow-x-auto">
          <table class="w-full min-w-200 text-left text-sm">
            <thead class="border-b border-slate-100 bg-slate-50 text-xs text-slate-500">
              <tr>
                <th v-if="recountable" class="w-10 px-4 py-3" />
                <th class="px-3 py-3">ID</th>
                <th class="px-3 py-3">{{ t('admin_pages.content.name') }}</th>
                <th v-if="editable" class="px-3 py-3">{{ t('admin_pages.content.pending') }}</th>
                <th class="px-3 py-3">{{ t('admin_pages.content.created_at') }}</th>
                <th class="px-3 py-3" />
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="item in items" :key="item.id" class="hover:bg-slate-50/70">
                <td v-if="recountable" class="px-4 py-3"><input v-model="selected" type="checkbox" :value="item.id" :aria-label="t('admin_pages.content.select', { name: label(item) })"></td>
                <td class="px-3 py-3 font-mono text-xs text-slate-500">{{ item.id }}</td>
                <td class="px-3 py-3">
                  <div class="flex items-center gap-3">
                    <img v-if="item.image_url" :src="String(item.image_url)" alt="" loading="lazy" class="size-9 shrink-0 rounded object-cover">
                    <div class="min-w-0">
                      <NuxtLink v-if="editable" :to="`/admin/content/${type}/${item.id}`" class="font-medium underline decoration-slate-200 underline-offset-4">{{ label(item) }}</NuxtLink>
                      <NuxtLink v-else :to="`/admin/content/work/${(item.work as { id: number } | null)?.id}?tab=edit`" class="font-medium underline decoration-slate-200 underline-offset-4">{{ label(item) }}</NuxtLink>
                      <p class="truncate text-xs text-slate-500">{{ detail(item) }}</p>
                    </div>
                  </div>
                </td>
                <td v-if="editable" class="px-3 py-3"><NuxtLink v-if="item.pending_revisions_count" :to="{ path: '/admin/revisions', query: { status: 'pending', type, resource_id: item.id } }" class="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-800">{{ item.pending_revisions_count }}</NuxtLink><span v-else class="text-slate-400">0</span></td>
                <td class="px-3 py-3 text-xs text-slate-500">{{ time(item.created_at) }}</td>
                <td class="px-3 py-3">
                  <div class="flex justify-end gap-3 whitespace-nowrap text-xs">
                    <NuxtLink :to="frontLink(item)" target="_blank" class="text-slate-500 underline">{{ t('admin_pages.preview_front') }}</NuxtLink>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <footer class="border-t border-slate-100 px-5 py-3"><CommonPagination v-model:page="page" :total-pages="pagination.last_page" :disabled="pending" /></footer>
      </AdminListState>
    </section>
  </div>
</template>
