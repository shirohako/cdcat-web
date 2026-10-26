<script setup lang="ts">
import type { AdminPagination, AdminReview } from '~/types/admin'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const route = useRoute()
const router = useRouter()
const { $api } = useNuxtApp()
const ratingLabels: Record<number, string> = { '5': '非常喜欢', '4': '喜欢', '3': '还行', '2': '不太喜欢', '1': '不喜欢' }
const reviewActionLabels: Record<Action['kind'], string> = { hide: '隐藏评价', unhide: '取消隐藏', delete: '删除评价' }
const reviewDoneLabels: Record<Action['kind'], string> = { hide: '已隐藏', unhide: '已取消隐藏', delete: '已删除' }
const reviewHelpLabels: Record<Action['kind'], string> = { hide: '隐藏后只有作者自己能看到，评分不再计入专辑。', unhide: '评价会重新显示，评分重新计入专辑。', delete: '永久删除评价及其反应和举报，完整内容写入操作日志。' }

const filterKeys = ['search', 'is_hidden', 'album_id', 'user_id', 'rating', 'has_rating', 'sort_by', 'sort_order'] as const
const filters = reactive(Object.fromEntries(filterKeys.map(key => [key, String(route.query[key] ?? '')])) as Record<typeof filterKeys[number], string>)
watch(() => route.query, (query) => { for (const key of filterKeys) filters[key] = String(query[key] ?? '') })
const page = computed({
  get: () => Math.max(1, Number.parseInt(String(route.query.page || '1')) || 1),
  set: value => { router.push({ query: { ...route.query, page: value > 1 ? value : undefined } }) },
})
const applyFilters = () => router.push({ query: Object.fromEntries(filterKeys.filter(key => filters[key].trim()).map(key => [key, filters[key].trim()])) })
const query = computed(() => ({ page: page.value, ...Object.fromEntries(filterKeys.map(key => [key, route.query[key] || undefined])) }))
const { data, pending, error, refresh } = await useAsyncData('admin-reviews',
  () => $api<{ items: AdminReview[], pagination: AdminPagination }>('/v1/admin/reviews', { query: query.value }), { watch: [query] })

type Action = { review: AdminReview, kind: 'hide' | 'unhide' | 'delete' }
const action = ref<Action | null>(null)
const actionOpen = computed({ get: () => action.value !== null, set: (value) => { if (!value) action.value = null } })
const busy = ref(false)
const message = ref('')
const notice = ref('')
const run = async (reason: string) => {
  const current = action.value
  if (!current || busy.value) return
  busy.value = true
  message.value = ''
  try {
    if (current.kind === 'delete') await $api(`/v1/admin/reviews/${current.review.id}`, { method: 'DELETE', body: { reason } })
    else await $api(`/v1/admin/reviews/${current.review.id}/hidden`, { method: 'PUT', body: { hidden: current.kind === 'hide', reason } })
    notice.value = reviewDoneLabels[current.kind]
    await refresh()
  } catch (e) {
    message.value = adminError(e, '操作失败，请重试。')
  } finally {
    action.value = null
    busy.value = false
  }
}
const time = (value: string) => new Intl.DateTimeFormat('zh-CN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
const field = 'rounded-lg border border-slate-300 bg-white px-3 py-2'
useHead({ title: '评价管理' })
</script>

<template>
  <div class="mx-auto max-w-6xl space-y-5 p-4 sm:p-8">
    <header>
      <h1 class="text-3xl font-bold">评价管理</h1>
      <p class="mt-2 text-sm text-slate-600">全站检索专辑评价。可以隐藏或删除违规评价，隐藏和删除都会同步更新专辑评分和作者的评价数；举报在「举报处理」里处理。</p>
    </header>
    <AdminFilterBar>
      <form class="flex flex-wrap items-end gap-2 text-sm" @submit.prevent="applyFilters">
        <input v-model="filters.search" type="search" maxlength="100" placeholder="搜索评价内容" aria-label="搜索评价内容" :class="[field, 'w-56']">
        <input v-model="filters.album_id" inputmode="numeric" pattern="[0-9]*" placeholder="专辑 ID" aria-label="专辑 ID" :class="[field, 'w-28']">
        <input v-model="filters.user_id" inputmode="numeric" pattern="[0-9]*" placeholder="用户 ID" aria-label="用户 ID" :class="[field, 'w-28']">
        <select v-model="filters.is_hidden" aria-label="显示状态" :class="field">
          <option value="">全部状态</option>
          <option value="0">显示中</option>
          <option value="1">已隐藏</option>
        </select>
        <select v-model="filters.rating" aria-label="评分" :class="field">
          <option value="">全部评分</option>
          <option v-for="value in REVIEW_RATINGS" :key="value" :value="String(value)">{{ ratingLabels[value] }}</option>
        </select>
        <select v-model="filters.has_rating" aria-label="是否评分" :class="field">
          <option value="">是否评分</option><option value="1">有评分</option><option value="0">无评分</option>
        </select>
        <select v-model="filters.sort_by" aria-label="排序字段" :class="field">
          <option value="">默认排序</option>
          <option value="rating">评分</option><option value="useful_count">有用数</option>
        </select>
        <button type="submit" class="rounded-lg bg-slate-900 px-3 py-2 text-white">应用</button>
      </form>
    </AdminFilterBar>
    <p v-if="notice" role="status" class="text-sm text-emerald-700">{{ notice }}</p>
    <p v-if="message" role="alert" class="text-sm text-red-700">{{ message }}</p>
    <AdminListState :pending="pending" :error="error" :empty="!data?.items.length" @retry="refresh()">
      <p class="mb-3 text-sm text-slate-500">共 {{ data?.pagination.total ?? 0 }} 条</p>
      <ul class="space-y-3">
        <li v-for="review in data?.items" :key="review.id" class="rounded-xl border border-slate-200 p-4" :class="review.is_hidden ? 'bg-slate-50 text-slate-500' : 'bg-white'">
          <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <NuxtLink :to="`/albums/${review.album_id}`" target="_blank" class="font-medium underline decoration-slate-200 underline-offset-4">{{ review.album?.title ?? `#${review.album_id}` }}</NuxtLink>
            <NuxtLink v-if="review.user" :to="`/admin/users/${review.user.id}`" class="text-slate-600">{{ review.user.nickname || review.user.username }}</NuxtLink>
            <span v-if="review.rating" class="rounded-full px-2 py-0.5 text-xs ring-1" :class="reviewRatingTone(review.rating)">{{ ratingLabels[review.rating] }}</span>
            <span v-if="review.is_hidden" class="rounded bg-amber-100 px-1.5 text-xs text-amber-800">已隐藏</span>
            <span class="text-xs text-slate-500">{{ time(review.created_at) }}</span>
            <span class="ml-auto flex gap-2 text-xs">
              <button v-if="!review.is_hidden" type="button" class="rounded-lg border border-amber-300 px-2.5 py-1 text-amber-700" @click="action = { review, kind: 'hide' }">隐藏评价</button>
              <button v-else type="button" class="rounded-lg border px-2.5 py-1" @click="action = { review, kind: 'unhide' }">取消隐藏</button>
              <button type="button" class="rounded-lg border border-red-300 px-2.5 py-1 text-red-700" @click="action = { review, kind: 'delete' }">删除</button>
            </span>
          </div>
          <p class="mt-2 line-clamp-6 whitespace-pre-wrap text-sm text-slate-700">{{ review.content }}</p>
          <p class="mt-2 text-xs text-slate-500">有用 {{ review.useful_count }} · 不赞同 {{ review.dislike_count }} · 有趣 {{ review.fun_count }}</p>
        </li>
      </ul>
      <CommonPagination v-if="data" v-model:page="page" class="mt-4" :total-pages="data.pagination.last_page" :disabled="pending" />
    </AdminListState>
    <AdminConfirmDialog v-model="actionOpen" :busy="busy" reason-required :title="action ? reviewActionLabels[action.kind] : ''" :description="action ? reviewHelpLabels[action.kind] : ''" @confirm="run" />
  </div>
</template>
