<script setup lang="ts">
import type { AdminArticleItem, AdminPagination } from '~/types/admin'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const route = useRoute()
const router = useRouter()
const { $api } = useNuxtApp()
const { t } = useAdminI18n()
const { types, typeName } = useArticleTypes()

// Tabs map onto list filters; everything, newest first, is the default view.
const tabs = [
  { key: 'all', query: { status: 'all' } },
  { key: 'reported', query: { reported: '1' } },
  { key: 'published', query: { status: 'published' } },
  { key: 'hidden', query: { status: 'hidden' } },
  { key: 'locked', query: { status: 'locked' } },
  { key: 'draft', query: { status: 'draft' } },
] as const
const activeTab = computed(() => route.query.reported ? 'reported' : String(route.query.status || 'all'))
const filterKeys = ['search', 'type', 'user_id', 'sort_by'] as const
const SORTS = ['updated_at', 'published_at', 'views_count', 'likes_count'] as const
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
  published: 'border-emerald-200 text-emerald-700', hidden: 'border-amber-200 text-amber-700',
  locked: 'border-rose-200 text-rose-700', draft: 'border-slate-200 text-slate-500',
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
          <option v-for="option in types" :key="option.key" :value="option.key">{{ typeName(option.key, 'zh-Hans') }}{{ option.is_active ? '' : `（${t('admin_pages.article_types.inactive')}）` }}</option>
        </select>
        <input v-model="filters.user_id" inputmode="numeric" pattern="[0-9]*" :placeholder="t('admin_pages.user_id')" :aria-label="t('admin_pages.user_id')" :class="[field, 'w-28']">
        <select v-model="filters.sort_by" :aria-label="t('admin_pages.sort_by')" :class="field">
          <option v-for="sort in SORTS" :key="sort" :value="sort === 'updated_at' ? '' : sort">{{ t(`admin_pages.articles.sorts.${sort}`) }}</option>
        </select>
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
                <th class="px-4 py-3">{{ t('admin_pages.articles.status') }}</th>
                <th class="px-4 py-3 text-right">{{ t('admin_pages.articles.views_count') }}</th><th class="px-4 py-3 text-right">{{ t('admin_pages.articles.likes_count') }}</th>
                <th class="px-4 py-3">{{ t('admin_pages.articles.reports') }}</th>
                <th class="px-4 py-3">{{ t('admin_pages.content.sorts.updated_at') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="article in data?.items" :key="article.id">
                <td class="max-w-md px-4 py-3">
                  <NuxtLink :to="`/admin/articles/${article.id}`" class="font-medium underline decoration-slate-200 underline-offset-4">{{ article.title || t('admin_pages.articles.untitled') }}</NuxtLink>
                  <p class="mt-0.5 text-xs text-slate-500">
                    <span v-if="article.type">{{ typeName(article.type, 'zh-Hans') }}</span>
                    <span v-if="article.featured" class="ml-2 text-violet-600">{{ t('admin_pages.articles.featured') }}</span>
                  </p>
                </td>
                <td class="px-4 py-3">{{ article.author?.nickname || article.author?.username || '—' }}</td>
                <td class="px-4 py-3"><span class="rounded-full border px-2 py-0.5 text-xs" :class="statusTone[article.status]">{{ t(`admin_pages.articles.statuses.${article.status}`) }}</span></td>
                <td class="px-4 py-3 text-right tabular-nums text-slate-600">{{ article.views_count.toLocaleString() }}</td>
                <td class="px-4 py-3 text-right tabular-nums text-slate-600">{{ article.likes_count.toLocaleString() }}</td>
                <td class="px-4 py-3 tabular-nums" :class="article.pending_reports ? 'font-semibold text-rose-600' : 'text-slate-400'">{{ article.pending_reports || '—' }}</td>
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
