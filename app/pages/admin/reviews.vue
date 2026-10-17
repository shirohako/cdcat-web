<script setup lang="ts">
import type { AdminPagination, AdminReview } from '~/types/admin'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const route = useRoute()
const router = useRouter()
const { $api } = useNuxtApp()
const { t } = useAdminI18n()
const { localizeError } = useLocalizedApiError((key, params) => params ? t(key, params) : t(key))

const filterKeys = ['search', 'work_id', 'user_id', 'rating', 'has_rating', 'sort_by', 'sort_order'] as const
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

const deleting = ref<AdminReview | null>(null)
const open = ref(false)
const busy = ref(false)
const message = ref('')
const remove = (review: AdminReview) => { deleting.value = review; message.value = ''; open.value = true }
const confirm = async (reason: string) => {
  if (!deleting.value || busy.value) return
  busy.value = true
  try {
    await $api(`/v1/admin/reviews/${deleting.value.id}`, { method: 'DELETE', body: { reason } })
    open.value = false
    await refresh()
  } catch (e) {
    message.value = localizeError(e)
    open.value = false
  } finally {
    busy.value = false
  }
}
const time = (value: string) => new Intl.DateTimeFormat('zh-CN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
const field = 'rounded-lg border border-slate-300 bg-white px-3 py-2'
useHead({ title: computed(() => t('admin_pages.reviews.title')) })
</script>

<template>
  <div class="mx-auto max-w-6xl space-y-5 p-4 sm:p-8">
    <header>
      <h1 class="text-3xl font-bold">{{ t('admin_pages.reviews.title') }}</h1>
      <p class="mt-2 text-sm text-slate-600">{{ t('admin_pages.reviews.description') }}</p>
    </header>
    <AdminFilterBar>
      <form class="flex flex-wrap items-end gap-2 text-sm" @submit.prevent="applyFilters">
        <input v-model="filters.search" type="search" maxlength="100" :placeholder="t('admin_pages.reviews.search')" :aria-label="t('admin_pages.reviews.search')" :class="[field, 'w-56']">
        <input v-model="filters.work_id" inputmode="numeric" pattern="[0-9]*" :placeholder="t('admin_pages.content.work_id')" :aria-label="t('admin_pages.content.work_id')" :class="[field, 'w-28']">
        <input v-model="filters.user_id" inputmode="numeric" pattern="[0-9]*" :placeholder="t('admin_pages.user_id')" :aria-label="t('admin_pages.user_id')" :class="[field, 'w-28']">
        <select v-model="filters.rating" :aria-label="t('admin_pages.reviews.rating')" :class="field">
          <option value="">{{ t('admin_pages.reviews.any_rating') }}</option>
          <option v-for="score in 11" :key="score" :value="String(score - 1)">{{ score - 1 }}</option>
        </select>
        <select v-model="filters.has_rating" :aria-label="t('admin_pages.reviews.has_rating')" :class="field">
          <option value="">{{ t('admin_pages.reviews.has_rating') }}</option><option value="1">{{ t('admin_pages.reviews.rated') }}</option><option value="0">{{ t('admin_pages.reviews.unrated') }}</option>
        </select>
        <select v-model="filters.sort_by" :aria-label="t('admin_pages.sort_by')" :class="field">
          <option value="">{{ t('admin_pages.content.default_sort') }}</option>
          <option value="rating">{{ t('admin_pages.reviews.rating') }}</option><option value="useful_count">{{ t('admin_pages.reviews.useful') }}</option>
        </select>
        <button type="submit" class="rounded-lg bg-slate-900 px-3 py-2 text-white">{{ t('admin_pages.apply') }}</button>
      </form>
    </AdminFilterBar>
    <p v-if="message" role="alert" class="text-sm text-red-700">{{ message }}</p>
    <AdminListState :pending="pending" :error="error" :empty="!data?.items.length" @retry="refresh()">
      <p class="mb-3 text-sm text-slate-500">{{ t('common.items_total', { count: data?.pagination.total ?? 0 }) }}</p>
      <ul class="space-y-3">
        <li v-for="review in data?.items" :key="review.id" class="rounded-xl border border-slate-200 bg-white p-4">
          <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <NuxtLink :to="`/works/${review.work_id}`" target="_blank" class="font-medium underline decoration-slate-200 underline-offset-4">{{ review.work?.title ?? `#${review.work_id}` }}</NuxtLink>
            <NuxtLink v-if="review.user" :to="`/admin/users/${review.user.id}`" class="text-slate-600">{{ review.user.nickname || review.user.username }}</NuxtLink>
            <span v-if="review.rating !== null" class="rounded bg-amber-50 px-2 py-0.5 text-xs text-amber-800">{{ t('admin_pages.reviews.score', { score: review.rating }) }}</span>
            <span class="text-xs text-slate-500">{{ time(review.created_at) }}</span>
            <button type="button" class="ml-auto text-xs text-red-700" @click="remove(review)">{{ t('common.delete') }}</button>
          </div>
          <p class="mt-2 line-clamp-6 whitespace-pre-wrap text-sm text-slate-700">{{ review.content }}</p>
          <p class="mt-2 text-xs text-slate-500">{{ t('admin_pages.reviews.reactions', { useful: review.useful_count, dislike: review.dislike_count, fun: review.fun_count }) }}</p>
        </li>
      </ul>
      <CommonPagination v-if="data" v-model:page="page" class="mt-4" :total-pages="data.pagination.last_page" :disabled="pending" />
    </AdminListState>
    <AdminConfirmDialog v-model="open" :busy="busy" reason-required :title="t('admin_pages.reviews.delete_title')" :description="t('admin_pages.reviews.delete_help')" @confirm="confirm" />
  </div>
</template>
