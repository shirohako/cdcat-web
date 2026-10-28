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
const contentCategoryLabels: Record<string, string> = {
  game: '游戏',
  animation: '动画',
  publication: '出版物',
  audio_drama: '广播剧',
  tokusatsu: '特摄',
  live_action: '影视舞台',
  doujin: '同人创作',
  event: '活动',
}
const contentDescriptionLabels: Record<string, string> = {
  album: '检索和维护专辑，包括碟片、曲目、制作人员、版本、特典、图片和外部链接。编辑在编辑器里进行，有自动通过权限时立即生效。',
  artist: '检索和维护艺术家，包括作为厂牌、发行方的公司和社团（品番前缀），可以按类型、地区和是否活跃筛选，也可以合并重复的艺术家。',
  entry: '检索和维护条目（动画、游戏等），以及它们与专辑、其他条目的关联。',
  franchise: '检索和维护系列，包括分组以及系列下的条目和专辑。',
  track: '跨专辑检索曲目。曲目随专辑一起编辑，点击曲名进入所属专辑的编辑器。',
  lyric: '跨曲目检索歌词。歌词在曲目页编辑，日常巡查见「歌词巡查」。',
}
const contentSortLabels: Record<string, string> = {
  id: 'ID',
  title: '标题',
  name: '名称',
  release_date: '发行日期',
  created_at: '创建时间',
  updated_at: '更新时间',
  reviews_count: '评论数',
  views_count: '浏览量',
  rating: '评分',
  albums_count: '专辑数',
  followers_count: '关注数',
  entries_count: '条目数',
  tracks_count: '曲目数',
  lyrics_count: '歌词数',
  language: '语言',
  track_count: '曲目数',
}
const contentTabsLabels: Record<string, string> = { album: '专辑', artist: '艺术家', entry: '条目', franchise: '系列', track: '曲目', lyric: '歌词' }
const { typeLabel, typeWithFormat } = useEntryDisplay()

const type = computed(() => adminContentTypeOf(route.params.type)!)
const segment = computed(() => adminContentRoutes[type.value].api)
const sorts: Record<AdminContentType, string[]> = {
  album: ['id', 'title', 'release_date', 'created_at', 'updated_at', 'reviews_count', 'views_count', 'rating', 'track_count'],
  artist: ['id', 'name', 'albums_count', 'followers_count', 'created_at', 'updated_at'],
  entry: ['id', 'name', 'release_date', 'created_at', 'updated_at'],
  franchise: ['id', 'name', 'entries_count', 'albums_count', 'created_at', 'updated_at'],
  track: ['id', 'title', 'created_at'],
  lyric: ['id', 'language', 'created_at', 'updated_at'],
}
const ALBUM_CATEGORIES = ['game', 'animation', 'publication', 'audio_drama', 'tokusatsu', 'live_action', 'doujin', 'event']
const DISC_FORMATS = ['cd', 'sacd', 'dvd', 'bd', 'vinyl', 'cassette', 'digital', 'other']
const filterKeys = ['search', 'type', 'category', 'format', 'is_active', 'has_lyrics', 'album_id', 'track_id', 'language', 'kind', 'sort_by', 'sort_order'] as const
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
const label = (item: AdminContentItem) => String(item.title ?? item.name ?? (type.value === 'lyric' ? (item.track as { title?: string } | null)?.title : null) ?? `#${item.id}`)
const editable = computed(() => type.value !== 'track')
const creatable = computed(() => !!adminEditorPath(type.value))
const recountable = computed(() => ['album', 'artist'].includes(type.value))
const frontLink = (item: AdminContentItem) => type.value === 'track' ? `/tracks/${item.id}`
  : type.value === 'lyric' ? `/tracks/${item.track_id}` : `/${adminContentRoutes[type.value]?.front}/${item.id}`
const detail = (item: AdminContentItem) => [
  ...(type.value === 'album' ? [item.catalog_number, item.type, item.release_date, item.track_count ? `${item.track_count} 曲` : null] : []),
  ...(type.value === 'lyric' ? [(item.track as { album?: { title: string } } | null)?.album?.title, item.kind, item.language, item.excerpt] : []),
  ...(type.value === 'artist' ? [item.type && artistTypeLabels[item.type], ((item.catalog_prefixes as string[] | undefined) ?? []).join(', '), item.is_active === false ? '已停止活动' : null] : []),
  ...(type.value === 'entry' ? [typeWithFormat(item.type as string, item.format as string | null), item.release_date, `${item.albums_count} 张专辑`] : []),
  ...(type.value === 'franchise' ? [item.parent_id ? `↳ #${item.parent_id}` : null, `${item.entries_count} 个条目`, `${item.albums_count} 张专辑`] : []),
  ...(type.value === 'track' ? [(item.album as { title: string } | null)?.title, `${item.disc_number}-${item.track_number}`, item.lyrics_count ? `${item.lyrics_count} 份歌词` : null] : []),
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
    notice.value = `已重算 ${result.results.length} 项，其中 ${result.results.filter(item => item.changed.length).length} 项有变化。`
    await refresh()
  } catch (e) {
    message.value = adminError(e)
  } finally {
    busy.value = false
  }
}
const time = (value: unknown) => value ? new Intl.DateTimeFormat('zh-CN', { dateStyle: 'short' }).format(new Date(String(value))) : '—'
useHead({ title: computed(() => contentTabsLabels[type.value]) })
</script>

<template>
  <div class="mx-auto max-w-7xl space-y-5 p-4 sm:p-8">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="text-xs font-semibold text-slate-500">内容管理</p>
        <h1 class="mt-1 text-3xl font-bold">{{ contentTabsLabels[type] }}</h1>
        <p class="mt-2 text-sm text-slate-600">{{ contentDescriptionLabels[type] }}</p>
      </div>
      <UiButton v-if="creatable" :to="adminEditorPath(type)!" variant="primary">新建{{ contentTabsLabels[type] }}</UiButton>
    </header>

    <AdminFilterBar>
      <form class="flex flex-wrap items-end gap-2 text-sm" @submit.prevent="applyFilters">
        <input v-model="filters.search" type="search" maxlength="100" placeholder="搜索名称" aria-label="搜索名称" class="w-60 rounded-lg border border-slate-300 bg-white px-3 py-2">
        <template v-if="type === 'album'">
          <select v-model="filters.type" aria-label="类型" class="rounded-lg border border-slate-300 bg-white px-3 py-2">
            <option value="">全部类型</option>
            <option v-for="value in ['album', 'ep', 'single', 'compilation', 'drama', 'radio']" :key="value" :value="value">{{ value }}</option>
          </select>
          <select v-model="filters.category" aria-label="类别" class="rounded-lg border border-slate-300 bg-white px-3 py-2">
            <option value="">类别</option>
            <option v-for="value in ALBUM_CATEGORIES" :key="value" :value="value">{{ contentCategoryLabels[value] }}</option>
          </select>
          <select v-model="filters.format" aria-label="介质" class="rounded-lg border border-slate-300 bg-white px-3 py-2">
            <option value="">介质</option>
            <option v-for="value in DISC_FORMATS" :key="value" :value="value">{{ value.toUpperCase() }}</option>
          </select>
        </template>
        <select v-if="type === 'track'" v-model="filters.has_lyrics" aria-label="是否有歌词" class="rounded-lg border border-slate-300 bg-white px-3 py-2">
          <option value="">是否有歌词</option><option value="1">有原文歌词</option><option value="0">没有歌词</option>
        </select>
        <template v-if="type === 'lyric'">
          <input v-model="filters.track_id" inputmode="numeric" pattern="[0-9]*" placeholder="曲目 ID" aria-label="曲目 ID" class="w-28 rounded-lg border border-slate-300 bg-white px-3 py-2">
          <input v-model="filters.language" maxlength="20" placeholder="语言" aria-label="语言" class="w-28 rounded-lg border border-slate-300 bg-white px-3 py-2">
          <select v-model="filters.kind" aria-label="歌词类别" class="rounded-lg border border-slate-300 bg-white px-3 py-2">
            <option value="">歌词类别</option>
            <option v-for="value in ['original', 'translation', 'transliteration']" :key="value" :value="value">{{ lyricKindLabels[value] }}</option>
          </select>
        </template>
        <select v-if="type === 'entry'" v-model="filters.type" aria-label="类型" class="rounded-lg border border-slate-300 bg-white px-3 py-2">
          <option value="">类型</option>
          <option v-for="entryType in ENTRY_TYPES" :key="entryType" :value="entryType">{{ typeLabel(entryType) }}</option>
        </select>
        <template v-if="type === 'artist'">
          <select v-model="filters.type" aria-label="类型" class="rounded-lg border border-slate-300 bg-white px-3 py-2">
            <option value="">全部类型</option>
            <option v-for="value in ['person', 'group', 'company', 'virtual', 'circle', 'character']" :key="value" :value="value">{{ artistTypeLabels[value] }}</option>
          </select>
          <select v-model="filters.is_active" aria-label="活跃" class="rounded-lg border border-slate-300 bg-white px-3 py-2">
            <option value="">全部状态</option><option value="1">活跃</option><option value="0">已停止活动</option>
          </select>
        </template>
        <input v-if="type === 'track'" v-model="filters.album_id" inputmode="numeric" pattern="[0-9]*" placeholder="专辑 ID" aria-label="专辑 ID" class="w-28 rounded-lg border border-slate-300 bg-white px-3 py-2">
        <select v-model="filters.sort_by" aria-label="排序字段" class="rounded-lg border border-slate-300 bg-white px-3 py-2">
          <option value="">默认排序</option>
          <option v-for="sort in sorts[type]" :key="sort" :value="sort">{{ contentSortLabels[sort] }}</option>
        </select>
        <select v-model="filters.sort_order" aria-label="排序方向" class="rounded-lg border border-slate-300 bg-white px-3 py-2"><option value="">降序</option><option value="asc">升序</option></select>
        <UiButton type="submit" variant="primary">应用</UiButton>
      </form>
    </AdminFilterBar>

    <div class="flex flex-wrap items-center gap-3 text-sm">
      <span class="text-slate-500">共 {{ pagination.total }} 条</span>
      <UiButton v-if="recountable" size="sm" class="ml-auto" :disabled="busy || !selected.length" @click="recount(selected)">重算选中的 {{ selected.length }} 项</UiButton>
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
                <th class="px-3 py-3">名称</th>
                <th v-if="editable" class="px-3 py-3">待审</th>
                <th class="px-3 py-3">创建时间</th>
                <th class="px-3 py-3" />
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="item in items" :key="item.id" class="hover:bg-slate-50/70">
                <td v-if="recountable" class="px-4 py-3"><input v-model="selected" type="checkbox" :value="item.id" :aria-label="`选择 ${label(item)}`"></td>
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
                    <UiButton :to="frontLink(item)" target="_blank" size="xs">前台预览</UiButton>
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
