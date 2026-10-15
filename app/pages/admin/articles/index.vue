<script setup lang="ts">
import type { AdminArticleItem, AdminPagination } from '~/types/admin'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const route = useRoute()
const router = useRouter()
const { $api } = useNuxtApp()
const { t } = useAdminI18n()

const filterKeys = ['search', 'status', 'user_id', 'work_id', 'sort_by', 'sort_order'] as const
const filters = reactive(Object.fromEntries(filterKeys.map(key => [key, String(route.query[key] ?? '')])) as Record<typeof filterKeys[number], string>)
watch(() => route.query, (query) => { for (const key of filterKeys) filters[key] = String(query[key] ?? '') })
const page = computed({
  get: () => Math.max(1, Number.parseInt(String(route.query.page || '1')) || 1),
  set: value => { router.push({ query: { ...route.query, page: value > 1 ? value : undefined } }) },
})
const applyFilters = () => router.push({ query: Object.fromEntries(filterKeys.filter(key => filters[key].trim()).map(key => [key, filters[key].trim()])) })
const query = computed(() => ({ page: page.value, ...Object.fromEntries(filterKeys.map(key => [key, route.query[key] || undefined])) }))
const { data, pending, error, refresh } = await useAsyncData('admin-articles',
  () => $api<{ items: AdminArticleItem[], pagination: AdminPagination }>('/v1/admin/articles', { query: query.value }), { watch: [query] })
const time = (value: string | null) => value ? new Intl.DateTimeFormat('zh-CN', { dateStyle: 'short' }).format(new Date(value)) : '—'
const field = 'rounded-lg border border-slate-300 bg-white px-3 py-2'
useHead({ title: computed(() => `${t('admin_pages.articles.title')} | CDCAT`) })
</script>

<template>
  <div class="mx-auto max-w-6xl space-y-5 p-4 sm:p-8">
    <header>
      <h1 class="text-3xl font-bold">{{ t('admin_pages.articles.title') }}</h1>
      <p class="mt-2 text-sm text-slate-600">{{ t('admin_pages.articles.description') }}</p>
    </header>
    <AdminFilterBar>
      <form class="flex flex-wrap items-end gap-2 text-sm" @submit.prevent="applyFilters">
        <input v-model="filters.search" type="search" maxlength="100" :placeholder="t('admin_pages.articles.search')" :aria-label="t('admin_pages.articles.search')" :class="[field, 'w-56']">
        <select v-model="filters.status" :aria-label="t('admin_pages.articles.status')" :class="field">
          <option value="">{{ t('admin_pages.all_statuses') }}</option><option value="published">{{ t('admin_pages.user_detail.published') }}</option><option value="draft">{{ t('admin_pages.user_detail.draft') }}</option>
        </select>
        <input v-model="filters.user_id" inputmode="numeric" pattern="[0-9]*" :placeholder="t('admin_pages.user_id')" :aria-label="t('admin_pages.user_id')" :class="[field, 'w-28']">
        <input v-model="filters.work_id" inputmode="numeric" pattern="[0-9]*" :placeholder="t('admin_pages.content.work_id')" :aria-label="t('admin_pages.content.work_id')" :class="[field, 'w-28']">
        <select v-model="filters.sort_by" :aria-label="t('admin_pages.sort_by')" :class="field">
          <option value="">{{ t('admin_pages.content.default_sort') }}</option><option value="updated_at">{{ t('admin_pages.content.sorts.updated_at') }}</option><option value="published_at">{{ t('admin_pages.articles.published_at') }}</option>
        </select>
        <button type="submit" class="rounded-lg bg-slate-900 px-3 py-2 text-white">{{ t('admin_pages.apply') }}</button>
      </form>
    </AdminFilterBar>
    <section class="rounded-xl border border-slate-200 bg-white">
      <AdminListState :pending="pending" :error="error" :empty="!data?.items.length" @retry="refresh()">
        <div class="overflow-x-auto">
          <table class="w-full min-w-175 text-left text-sm">
            <thead class="border-b border-slate-100 bg-slate-50 text-xs text-slate-500"><tr><th class="px-4 py-3">{{ t('admin_pages.articles.article') }}</th><th class="px-4 py-3">{{ t('admin_pages.articles.author') }}</th><th class="px-4 py-3">{{ t('admin_pages.articles.status') }}</th><th class="px-4 py-3">{{ t('admin_pages.articles.works') }}</th><th class="px-4 py-3">{{ t('admin_pages.content.sorts.updated_at') }}</th></tr></thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="article in data?.items" :key="article.id">
                <td class="max-w-md px-4 py-3"><NuxtLink :to="`/admin/articles/${article.id}`" class="font-medium underline decoration-slate-200 underline-offset-4">{{ article.title }}</NuxtLink><p class="truncate text-xs text-slate-500">{{ article.excerpt }}</p></td>
                <td class="px-4 py-3">{{ article.author?.nickname || article.author?.username || '—' }}</td>
                <td class="px-4 py-3"><span class="rounded-full border px-2 py-0.5 text-xs" :class="article.status === 'published' ? 'border-emerald-200 text-emerald-700' : 'border-slate-200 text-slate-500'">{{ t(`admin_pages.user_detail.${article.status}`) }}</span></td>
                <td class="px-4 py-3 tabular-nums">{{ article.works_count }}</td>
                <td class="px-4 py-3 text-xs text-slate-500">{{ time(article.updated_at) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <footer v-if="data" class="border-t border-slate-100 px-5 py-3"><CommonPagination v-model:page="page" :total-pages="data.pagination.last_page" :disabled="pending" /></footer>
      </AdminListState>
    </section>
  </div>
</template>
