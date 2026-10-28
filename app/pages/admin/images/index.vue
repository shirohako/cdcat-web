<script setup lang="ts">
import type { AdminImage, AdminImageSummary, AdminPagination } from '~/types/admin'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const route = useRoute()
const router = useRouter()
const { $api } = useNuxtApp()
const { hasPermission } = useAuth()

const filterKeys = ['search', 'status', 'mime', 'uploaded_by', 'album_id', 'from', 'to', 'sort'] as const
const filters = reactive(Object.fromEntries(filterKeys.map(key => [key, String(route.query[key] ?? '')])) as Record<typeof filterKeys[number], string>)
watch(() => route.query, (query) => { for (const key of filterKeys) filters[key] = String(query[key] ?? '') })
const page = computed({
  get: () => Math.max(1, Number.parseInt(String(route.query.page || '1')) || 1),
  set: value => { router.push({ query: { ...route.query, page: value > 1 ? value : undefined } }) },
})
const applyFilters = () => router.push({ query: Object.fromEntries(filterKeys.filter(key => filters[key].trim()).map(key => [key, filters[key].trim()])) })
const resetFilters = () => router.push({ query: {} })
const query = computed(() => ({ page: page.value, ...Object.fromEntries(filterKeys.map(key => [key, route.query[key] || undefined])) }))

const { data, pending, error, refresh } = await useAsyncData('admin-images',
  () => $api<{ items: AdminImage[], pagination: AdminPagination, summary: AdminImageSummary }>('/v1/admin/images', { query: query.value }), { watch: [query] })
const images = computed(() => data.value?.items ?? [])
const pagination = computed(() => data.value?.pagination ?? { total: 0, per_page: 40, current_page: 1, last_page: 1 })
const summary = computed(() => data.value?.summary)

const mimes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']
const date = (value: string | null) => value ? new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium' }).format(new Date(value)) : '—'
const time = (value: string | null) => value ? new Intl.DateTimeFormat('zh-CN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : '—'
const field = 'rounded-lg border border-slate-300 bg-white px-3 py-2'
useHead({ title: '图片' })
</script>

<template>
  <div class="mx-auto max-w-6xl space-y-5 p-4 sm:p-8">
    <header>
      <h1 class="text-3xl font-bold">图片</h1>
      <p class="mt-2 text-sm text-slate-600">上传到本站的图片。当前没有内容在用的图片，未使用超过保留天数后，会在每天的清理中删除。</p>
    </header>

    <dl v-if="summary" class="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
      <div class="rounded-xl border border-slate-200 bg-white p-4">
        <dt class="text-slate-500">全部图片</dt>
        <dd class="mt-1 text-lg font-semibold">{{ summary.total }} 张 · {{ formatBytes(summary.total_size) }}</dd>
      </div>
      <div class="rounded-xl border border-slate-200 bg-white p-4">
        <dt class="text-slate-500">未使用</dt>
        <dd class="mt-1 text-lg font-semibold">{{ summary.unused }} 张 · {{ formatBytes(summary.unused_size) }}</dd>
        <dd class="mt-1 text-xs text-slate-500">下次清理将删除 {{ summary.due }}</dd>
      </div>
      <div class="rounded-xl border border-slate-200 bg-white p-4">
        <dt class="text-slate-500">保留天数</dt>
        <dd class="mt-1 text-lg font-semibold">
          {{ summary.retention_days }} 天
          <UiButton v-if="hasPermission('system.settings')" to="/admin/settings" size="xs" class="ml-1 align-middle">修改</UiButton>
        </dd>
      </div>
      <div class="rounded-xl border border-slate-200 bg-white p-4">
        <dt class="text-slate-500">上次清理</dt>
        <dd class="mt-1 text-slate-700">
          <template v-if="summary.last_cleanup">{{ time(summary.last_cleanup.ran_at) }}，删除 {{ summary.last_cleanup.removed }} 张，原图共 {{ formatBytes(summary.last_cleanup.removed_bytes) }}</template>
          <template v-else>还没有运行过</template>
        </dd>
      </div>
    </dl>

    <AdminFilterBar>
      <form class="flex flex-wrap items-end gap-2 text-sm" @submit.prevent="applyFilters">
        <input v-model="filters.search" type="search" maxlength="200" placeholder="ID、sha256 开头或来源链接" aria-label="ID、sha256 开头或来源链接" class="w-60" :class="field">
        <select v-model="filters.status" aria-label="状态" :class="field">
          <option value="">全部状态</option>
          <option value="in_use">在用</option>
          <option value="unused">未使用</option>
        </select>
        <select v-model="filters.mime" aria-label="格式" :class="field">
          <option value="">全部格式</option>
          <option v-for="mime in mimes" :key="mime" :value="mime">{{ mime.replace('image/', '').toUpperCase() }}</option>
        </select>
        <input v-model="filters.uploaded_by" inputmode="numeric" pattern="[0-9]*" placeholder="上传人 ID" aria-label="上传人 ID" class="w-28" :class="field">
        <input v-model="filters.album_id" inputmode="numeric" pattern="[0-9]*" placeholder="专辑 ID" aria-label="专辑 ID" class="w-28" :class="field">
        <label class="flex flex-col text-xs text-slate-500">从<input v-model="filters.from" type="date" :class="field"></label>
        <label class="flex flex-col text-xs text-slate-500">至<input v-model="filters.to" type="date" :class="field"></label>
        <select v-model="filters.sort" aria-label="排序字段" :class="field">
          <option value="">上传时间</option>
          <option value="size">文件大小</option>
          <option value="unused_since">最先清理</option>
        </select>
        <UiButton type="submit" variant="primary">应用</UiButton>
        <UiButton @click="resetFilters">重置</UiButton>
      </form>
    </AdminFilterBar>

    <p class="text-sm text-slate-500">共 {{ pagination.total }} 条</p>

    <section class="rounded-xl border border-slate-200 bg-white shadow-sm">
      <AdminListState :pending="pending" :error="error" :empty="!images.length" @retry="refresh()">
        <ul class="grid grid-cols-2 gap-4 p-4 sm:grid-cols-3 lg:grid-cols-5">
          <li v-for="image in images" :key="image.id">
            <NuxtLink :to="`/admin/images/${image.id}`" class="group block text-xs">
              <div class="aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                <img :src="image.thumbnail_url" alt="" loading="lazy" class="h-full w-full object-contain transition group-hover:scale-105">
              </div>
              <div class="mt-2 flex items-center justify-between gap-2">
                <span class="font-medium text-slate-800">#{{ image.id }}</span>
                <span v-if="image.unused_since" class="rounded bg-amber-100 px-1.5 text-amber-800">未使用</span>
                <span v-else class="rounded bg-emerald-100 px-1.5 text-emerald-800">在用</span>
              </div>
              <p class="mt-1 text-slate-500">{{ image.width }} × {{ image.height }} · {{ formatBytes(image.size) }}</p>
              <p v-if="image.conversion" :class="image.conversion === 'failed' ? 'text-red-700' : 'text-slate-500'">{{ imageConversionLabels[image.conversion] }}</p>
              <p v-if="image.cleanup_at" class="text-amber-700">{{ date(image.cleanup_at) }} 后清理</p>
              <p v-else-if="image.album_images_count" class="text-slate-500">{{ image.album_images_count }} 处专辑图片</p>
              <p class="truncate text-slate-400">{{ image.uploader ? (image.uploader.nickname || image.uploader.username) : '—' }} · {{ date(image.created_at) }}</p>
            </NuxtLink>
          </li>
        </ul>
        <footer class="border-t border-slate-100 px-5 py-3"><CommonPagination v-model:page="page" :total-pages="pagination.last_page" :disabled="pending" /></footer>
      </AdminListState>
    </section>
  </div>
</template>
