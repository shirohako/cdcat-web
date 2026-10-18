<script setup lang="ts">
import { adminContentRoutes, adminContentTypeOf, adminEditorPath } from '~/config/admin'
import type { AdminContentItem, AdminContentType, AdminPagination } from '~/types/admin'
import { ENTRY_TYPES } from '~/types/entry'

definePageMeta({
  layout: 'admin', middleware: 'admin',
  validate: route => Boolean(adminContentTypeOf(route.params.type)),
})

const route = useRoute()
const router = useRouter()
const { $api } = useNuxtApp()
const { t } = useAdminI18n()
const { typeLabel, typeWithFormat } = useEntryDisplay()
const { localizeError } = useLocalizedApiError((key, params) => params ? t(key, params) : t(key))

const type = computed(() => adminContentTypeOf(route.params.type)!)
const segment = computed(() => adminContentRoutes[type.value].api)
const sorts: Record<AdminContentType, string[]> = {
  album: ['id', 'title', 'release_date', 'created_at', 'updated_at', 'reviews_count', 'views_count', 'rating', 'track_count'],
  artist: ['id', 'name', 'albums_count', 'followers_count', 'created_at', 'updated_at'],
  label: ['id', 'name', 'albums_count', 'created_at', 'updated_at'],
  work: ['id', 'title', 'tracks_count', 'lyrics_count', 'created_at', 'updated_at'],
  entry: ['id', 'name', 'release_date', 'created_at', 'updated_at'],
  franchise: ['id', 'name', 'entries_count', 'albums_count', 'created_at', 'updated_at'],
  track: ['id', 'title', 'created_at'],
  lyric: ['id', 'language', 'created_at', 'updated_at'],
}
const ALBUM_CATEGORIES = ['game', 'animation', 'publication', 'audio_drama', 'tokusatsu', 'live_action', 'multimedia_franchise', 'game_adjacent', 'event']
const DISC_FORMATS = ['cd', 'sacd', 'dvd', 'bd', 'vinyl', 'cassette', 'digital', 'other']
const filterKeys = ['search', 'type', 'category', 'format', 'is_active', 'has_lyrics', 'album_id', 'work_id', 'language', 'kind', 'sort_by', 'sort_order'] as const
const filters = reactive(Object.fromEntries(filterKeys.map(key => [key, String(route.query[key] ?? '')])) as Record<typeof filterKeys[number], string>)
watch(() => route.query, (query) => { for (const key of filterKeys) filters[key] = String(query[key] ?? '') })
const page = computed({
  get: () => Math.max(1, Number.parseInt(String(route.query.page || '1')) || 1),
  set: value => { router.push({ query: { ...route.query, page: value > 1 ? value : undefined } }) },
})
const applyFilters = () => router.push({ query: Object.fromEntries(filterKeys.filter(key => filters[key].trim()).map(key => [key, filters[key].trim()])) })
const query = computed(() => ({ page: page.value, ...Object.fromEntries(filterKeys.map(key => [key, route.query[key] || undefined])) }))

const { data, pending, error, refresh } = await useAsyncData(() => `admin-content-${type.value}`,
  () => $api<{ items: AdminContentItem[], pagination: AdminPagination }>(`/v1/admin/content/${segment.value}`, { query: query.value }), { watch: [query, type] })
const items = computed(() => data.value?.items ?? [])
const pagination = computed(() => data.value?.pagination ?? { total: 0, per_page: 15, current_page: 1, last_page: 1 })
const label = (item: AdminContentItem) => String(item.title ?? item.name ?? (type.value === 'lyric' ? (item.work as { title?: string } | null)?.title : null) ?? `#${item.id}`)
const editable = computed(() => type.value !== 'track')
const creatable = computed(() => !!adminEditorPath(type.value))
const recountable = computed(() => ['album', 'artist', 'label', 'work'].includes(type.value))
const frontLink = (item: AdminContentItem) => type.value === 'track' ? `/tracks/${item.id}`
  : type.value === 'lyric' ? `/works/${(item.work as { id: number } | null)?.id}` : `/${adminContentRoutes[type.value]?.front}/${item.id}`
const detail = (item: AdminContentItem) => [
  ...(type.value === 'album' ? [item.catalog_number, item.type, item.release_date, item.track_count ? `${item.track_count} 曲` : null] : []),
  ...(type.value === 'label' ? [((item.catalog_prefixes as string[] | undefined) ?? []).join(', '), t('admin_pages.content.albums_count', { count: item.albums_count })] : []),
  ...(type.value === 'work' ? [t('admin_pages.content.tracks_count', { count: item.tracks_count }), t('admin_pages.content.lyrics_count', { count: item.lyrics_count })] : []),
  ...(type.value === 'lyric' ? [item.kind, item.language, item.excerpt] : []),
  ...(type.value === 'artist' ? [item.type && t(`admin_pages.content.artist_types.${item.type}`), item.is_active === false ? t('admin_pages.content.inactive') : null] : []),
  ...(type.value === 'entry' ? [typeWithFormat(item.type as string, item.format as string | null), item.release_date, t('admin_pages.content.albums_count', { count: item.albums_count })] : []),
  ...(type.value === 'franchise' ? [item.parent_id ? `↳ #${item.parent_id}` : null, t('admin_pages.content.entries_count', { count: item.entries_count }), t('admin_pages.content.albums_count', { count: item.albums_count })] : []),
  ...(type.value === 'track' ? [(item.album as { title: string } | null)?.title, `${item.disc_number}-${item.track_number}`, (item.work as { title?: string } | null)?.title] : []),
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
    const result = await $api<{ results: { id: number, changed: string[] }[] }>(`/v1/admin/content/${segment.value}/recount`, { method: 'POST', body: { ids } })
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
      <NuxtLink v-if="creatable" :to="adminEditorPath(type)!" class="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white">{{ t('admin_pages.content.create', { type: t(`admin_pages.content.tabs.${type}`) }) }}</NuxtLink>
    </header>

    <AdminFilterBar>
      <form class="flex flex-wrap items-end gap-2 text-sm" @submit.prevent="applyFilters">
        <input v-model="filters.search" type="search" maxlength="100" :placeholder="t('admin_pages.content.search')" :aria-label="t('admin_pages.content.search')" class="w-60 rounded-lg border border-slate-300 bg-white px-3 py-2">
        <template v-if="type === 'album'">
          <select v-model="filters.type" :aria-label="t('admin_pages.content.type')" class="rounded-lg border border-slate-300 bg-white px-3 py-2">
            <option value="">{{ t('admin_pages.content.all_types') }}</option>
            <option v-for="value in ['album', 'ep', 'single', 'compilation', 'drama', 'radio']" :key="value" :value="value">{{ value }}</option>
          </select>
          <select v-model="filters.category" :aria-label="t('admin_pages.content.category')" class="rounded-lg border border-slate-300 bg-white px-3 py-2">
            <option value="">{{ t('admin_pages.content.category') }}</option>
            <option v-for="value in ALBUM_CATEGORIES" :key="value" :value="value">{{ t(`admin_pages.content.categories.${value}`) }}</option>
          </select>
          <select v-model="filters.format" :aria-label="t('admin_pages.content.format')" class="rounded-lg border border-slate-300 bg-white px-3 py-2">
            <option value="">{{ t('admin_pages.content.format') }}</option>
            <option v-for="value in DISC_FORMATS" :key="value" :value="value">{{ value.toUpperCase() }}</option>
          </select>
        </template>
        <select v-if="type === 'work'" v-model="filters.has_lyrics" :aria-label="t('admin_pages.content.has_lyrics')" class="rounded-lg border border-slate-300 bg-white px-3 py-2">
          <option value="">{{ t('admin_pages.content.has_lyrics') }}</option><option value="1">{{ t('admin_pages.content.with_lyrics') }}</option><option value="0">{{ t('admin_pages.content.without_lyrics') }}</option>
        </select>
        <template v-if="type === 'lyric'">
          <input v-model="filters.work_id" inputmode="numeric" pattern="[0-9]*" :placeholder="t('admin_pages.content.work_id')" :aria-label="t('admin_pages.content.work_id')" class="w-28 rounded-lg border border-slate-300 bg-white px-3 py-2">
          <input v-model="filters.language" maxlength="20" :placeholder="t('admin_pages.lyrics.language')" :aria-label="t('admin_pages.lyrics.language')" class="w-28 rounded-lg border border-slate-300 bg-white px-3 py-2">
          <select v-model="filters.kind" :aria-label="t('admin_pages.content.lyric_kind')" class="rounded-lg border border-slate-300 bg-white px-3 py-2">
            <option value="">{{ t('admin_pages.content.lyric_kind') }}</option>
            <option v-for="value in ['original', 'translation', 'transliteration']" :key="value" :value="value">{{ t(`admin_pages.content.lyric_kinds.${value}`) }}</option>
          </select>
        </template>
        <select v-if="type === 'entry'" v-model="filters.type" :aria-label="t('admin_pages.content.type')" class="rounded-lg border border-slate-300 bg-white px-3 py-2">
          <option value="">{{ t('admin_pages.content.type') }}</option>
          <option v-for="entryType in ENTRY_TYPES" :key="entryType" :value="entryType">{{ typeLabel(entryType) }}</option>
        </select>
        <template v-if="type === 'artist'">
          <select v-model="filters.type" :aria-label="t('admin_pages.content.type')" class="rounded-lg border border-slate-300 bg-white px-3 py-2">
            <option value="">{{ t('admin_pages.content.all_types') }}</option>
            <option v-for="value in ['person', 'group', 'company', 'virtual', 'circle', 'character']" :key="value" :value="value">{{ t(`admin_pages.content.artist_types.${value}`) }}</option>
          </select>
          <select v-model="filters.is_active" :aria-label="t('admin_pages.content.active')" class="rounded-lg border border-slate-300 bg-white px-3 py-2">
            <option value="">{{ t('admin_pages.all_statuses') }}</option><option value="1">{{ t('admin_pages.content.active') }}</option><option value="0">{{ t('admin_pages.content.inactive') }}</option>
          </select>
        </template>
        <input v-if="type === 'track'" v-model="filters.album_id" inputmode="numeric" pattern="[0-9]*" :placeholder="t('admin_pages.content.album_id')" :aria-label="t('admin_pages.content.album_id')" class="w-28 rounded-lg border border-slate-300 bg-white px-3 py-2">
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
                      <NuxtLink v-if="editable" :to="`/admin/content/${segment}/${item.id}`" class="font-medium underline decoration-slate-200 underline-offset-4">{{ label(item) }}</NuxtLink>
                      <NuxtLink v-else :to="`/admin/content/albums/${(item.album as { id: number } | null)?.id}`" class="font-medium underline decoration-slate-200 underline-offset-4">{{ label(item) }}</NuxtLink>
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
