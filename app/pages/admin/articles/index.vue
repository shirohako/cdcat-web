<script setup lang="ts">
import type { AdminArticleItem, AdminPagination } from '~/types/admin'
import { ARTICLE_TYPES } from '~/types/article'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const route = useRoute()
const router = useRouter()
const { $api } = useNuxtApp()
const { t } = useAdminI18n()

// Tabs map onto list filters; the review queue is the default view.
const tabs = [
  { key: 'pending', query: { status: 'pending' } },
  { key: 'reported', query: { reported: '1' } },
  { key: 'published', query: { status: 'published' } },
  { key: 'rejected', query: { status: 'rejected' } },
  { key: 'unpublished', query: { status: 'unpublished' } },
  { key: 'draft', query: { status: 'draft' } },
  { key: 'all', query: { status: 'all' } },
] as const
const activeTab = computed(() => route.query.reported ? 'reported' : String(route.query.status || 'pending'))
const filterKeys = ['search', 'type', 'user_id'] as const
const filters = reactive(Object.fromEntries(filterKeys.map(key => [key, String(route.query[key] ?? '')])) as Record<typeof filterKeys[number], string>)
watch(() => route.query, (query) => { for (const key of filterKeys) filters[key] = String(query[key] ?? '') })
const tabQuery = computed(() => tabs.find(tab => tab.key === activeTab.value)?.query ?? tabs[0].query)
const page = computed({
  get: () => Math.max(1, Number.parseInt(String(route.query.page || '1')) || 1),
  set: value => { router.push({ query: { ...route.query, page: value > 1 ? value : undefined } }) },
})
const applyFilters = () => router.push({ query: { ...tabQuery.value, ...Object.fromEntries(filterKeys.filter(key => filters[key].trim()).map(key => [key, filters[key].trim()])) } })
const query = computed(() => {
  const status = 'status' in tabQuery.value ? tabQuery.value.status : ''
  return {
    page: page.value,
    status: status && status !== 'all' ? status : undefined,
    reported: 'reported' in tabQuery.value ? 1 : undefined,
    ...Object.fromEntries(filterKeys.map(key => [key, route.query[key] || undefined])),
  }
})
const { data, pending, error, refresh } = await useAsyncData('admin-articles',
  () => $api<{ items: AdminArticleItem[], pagination: AdminPagination }>('/v1/admin/articles', { query: query.value }), { watch: [query] })
const time = (value: string | null) => value ? new Intl.DateTimeFormat('zh-CN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : '—'
const statusTone: Record<string, string> = {
  pending: 'border-amber-200 text-amber-700', published: 'border-emerald-200 text-emerald-700',
  rejected: 'border-rose-200 text-rose-700', unpublished: 'border-rose-200 text-rose-700', draft: 'border-slate-200 text-slate-500',
}
const field = 'rounded-lg border border-slate-300 bg-white px-3 py-2'
useHead({ title: computed(() => t('admin_pages.articles.title')) })
</script>

<template>
  <div class="mx-auto max-w-6xl space-y-5 p-4 sm:p-8">
    <header>
      <h1 class="text-3xl font-bold">{{ t('admin_pages.articles.title') }}</h1>
      <p class="mt-2 text-sm text-slate-600">{{ t('admin_pages.articles.description') }}</p>
    </header>
    <nav class="flex gap-1 overflow-x-auto border-b border-slate-200 text-sm">
      <NuxtLink
        v-for="tab in tabs" :key="tab.key" :to="{ query: tab.query }" class="-mb-px shrink-0 border-b-2 px-3 py-2"
        :class="activeTab === tab.key ? 'border-slate-900 font-semibold text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800'">
        {{ t(`admin_pages.articles.tabs.${tab.key}`) }}
      </NuxtLink>
    </nav>
    <AdminFilterBar>
      <form class="flex flex-wrap items-end gap-2 text-sm" @submit.prevent="applyFilters">
        <input v-model="filters.search" type="search" maxlength="100" :placeholder="t('admin_pages.articles.search')" :aria-label="t('admin_pages.articles.search')" :class="[field, 'w-56']">
        <select v-model="filters.type" :aria-label="t('admin_pages.articles.type')" :class="field">
          <option value="">{{ t('admin_pages.articles.all_types') }}</option>
          <option v-for="value in ARTICLE_TYPES" :key="value" :value="value">{{ t(`admin_pages.articles.types.${value}`) }}</option>
        </select>
        <input v-model="filters.user_id" inputmode="numeric" pattern="[0-9]*" :placeholder="t('admin_pages.user_id')" :aria-label="t('admin_pages.user_id')" :class="[field, 'w-28']">
        <button type="submit" class="rounded-lg bg-slate-900 px-3 py-2 text-white">{{ t('admin_pages.apply') }}</button>
      </form>
    </AdminFilterBar>
    <section class="rounded-xl border border-slate-200 bg-white">
      <AdminListState :pending="pending" :error="error" :empty="!data?.items.length" @retry="refresh()">
        <div class="overflow-x-auto">
          <table class="w-full min-w-175 text-left text-sm">
            <thead class="border-b border-slate-100 bg-slate-50 text-xs text-slate-500">
              <tr>
                <th class="px-4 py-3">{{ t('admin_pages.articles.article') }}</th><th class="px-4 py-3">{{ t('admin_pages.articles.author') }}</th>
                <th class="px-4 py-3">{{ t('admin_pages.articles.status') }}</th><th class="px-4 py-3">{{ t('admin_pages.articles.reports') }}</th>
                <th class="px-4 py-3">{{ activeTab === 'pending' ? t('admin_pages.articles.submitted_at') : t('admin_pages.content.sorts.updated_at') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="article in data?.items" :key="article.id">
                <td class="max-w-md px-4 py-3">
                  <NuxtLink :to="`/admin/articles/${article.id}`" class="font-medium underline decoration-slate-200 underline-offset-4">{{ article.title || t('admin_pages.articles.untitled') }}</NuxtLink>
                  <p class="mt-0.5 text-xs text-slate-500">
                    <span v-if="article.type">{{ t(`admin_pages.articles.types.${article.type}`) }}</span>
                    <span v-if="article.featured" class="ml-2 text-violet-600">{{ t('admin_pages.articles.featured') }}</span>
                    <span v-if="article.has_changes" class="ml-2">{{ t('admin_pages.articles.has_changes') }}</span>
                  </p>
                </td>
                <td class="px-4 py-3">{{ article.author?.nickname || article.author?.username || '—' }}</td>
                <td class="px-4 py-3"><span class="rounded-full border px-2 py-0.5 text-xs" :class="statusTone[article.status]">{{ t(`admin_pages.articles.statuses.${article.status}`) }}</span></td>
                <td class="px-4 py-3 tabular-nums" :class="article.pending_reports ? 'font-semibold text-rose-600' : 'text-slate-400'">{{ article.pending_reports || '—' }}</td>
                <td class="px-4 py-3 text-xs text-slate-500">{{ time(activeTab === 'pending' ? article.submitted_at : article.updated_at) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <footer v-if="data" class="border-t border-slate-100 px-5 py-3"><CommonPagination v-model:page="page" :total-pages="data.pagination.last_page" :disabled="pending" /></footer>
      </AdminListState>
    </section>
  </div>
</template>
