<script setup lang="ts">
import { ExternalLink, FileText, HardDrive, PenLine, Plus, Trash2 } from '@lucide/vue'
import { ARTICLE_STATUSES, type ArticleStatus, type MyArticle, type Pagination } from '~/types/article'

definePageMeta({ middleware: 'auth' })

const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n()
const { typeName } = useArticleTypes()
const { $api } = useNuxtApp()
const { localizeError } = useLocalizedApiError()
const { toast, showToast } = useToast()
const { user } = useAuth()

// A new article never saved to the server lives only in this browser; the writer picks it up from 写文章.
const localNew = ref<{ title: string, at: string } | null>(null)
onMounted(() => { localNew.value = localNewArticleDraft(user.value?.id) })

const status = computed(() => (ARTICLE_STATUSES as readonly string[]).includes(String(route.query.status)) ? String(route.query.status) as ArticleStatus : null)
const page = computed({
  get: () => Math.max(1, Number.parseInt(String(route.query.page || '1')) || 1),
  set: value => { router.push({ query: { ...route.query, page: value > 1 ? value : undefined } }) },
})
// The reader's own drafts and articles: always fetched fresh (no revisit cache).
const { data, status: loadStatus, error, refresh, loading, refetching, revealKey, revealClass } = await usePageData(
  () => `my-articles-${status.value ?? 'all'}-${page.value}`,
  ({ signal }) => $api<{ articles: MyArticle[], counts: Partial<Record<ArticleStatus, number>>, pagination: Pagination }>('/v1/me/articles',
    { query: { status: status.value ?? undefined, page: page.value }, signal }),
  { cache: false },
)

const total = computed(() => Object.values(data.value?.counts ?? {}).reduce((sum, count) => sum + (count ?? 0), 0))
const tabs = computed(() => [{ value: null, count: total.value }, ...ARTICLE_STATUSES.map(value => ({ value, count: data.value?.counts[value] ?? 0 }))])
const selectTab = (value: ArticleStatus | null) => router.push({ query: value ? { status: value } : {} })

const deleting = ref<MyArticle | null>(null)
const deleteOpen = computed({ get: () => deleting.value !== null, set: (open) => { if (!open) deleting.value = null } })
async function remove() {
  const article = deleting.value
  if (!article) return
  try {
    await $api(`/v1/articles/${article.id}`, { method: 'DELETE' })
    showToast(t('article_ui.mine.deleted'))
    await refresh()
  }
  catch (failure) { showToast(localizeError(failure), 'error') }
}

const date = (value: string | null) => value ? new Intl.DateTimeFormat(locale.value, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : ''
useHead({ title: computed(() => t('article_ui.mine.title')) })
</script>

<template>
  <div class="container mx-auto max-w-5xl px-4 py-8 md:px-6">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-slate-900">{{ t('article_ui.mine.title') }}</h1>
        <p class="mt-1 text-sm text-slate-500">{{ t('article_ui.mine.description') }}</p>
      </div>
      <NuxtLink to="/articles/new" class="btn btn-primary btn-sm"><Plus :size="15" />{{ t('article_ui.write') }}</NuxtLink>
    </header>

    <NuxtLink v-if="localNew" to="/articles/new" class="mt-6 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 transition hover:bg-amber-100">
      <HardDrive :size="16" class="shrink-0" />
      <span class="min-w-0 flex-1 truncate">{{ t('article_ui.mine.local_new', { title: localNew.title || t('article_ui.untitled'), time: date(localNew.at) }) }}</span>
      <span class="shrink-0 font-medium">{{ t('article_ui.chooser.continue') }}</span>
    </NuxtLink>

    <nav class="mt-6 flex gap-1 overflow-x-auto border-b border-slate-200" :aria-label="t('article_ui.mine.filter')">
      <button
        v-for="tab in tabs" :key="tab.value ?? 'all'" type="button"
        class="-mb-px inline-flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2 text-sm transition"
        :class="status === tab.value ? 'border-violet-500 font-semibold text-violet-700' : 'border-transparent text-slate-500 hover:text-slate-800'"
        @click="selectTab(tab.value)">
        {{ tab.value ? t(`article_ui.statuses.${tab.value}`) : t('article_ui.mine.all') }}
        <span v-if="data" class="rounded-full bg-slate-100 px-1.5 text-[11px] tabular-nums text-slate-500">{{ tab.count }}</span>
      </button>
    </nav>

    <CommonLoadError v-if="loadStatus === 'error' && data" class="mt-4" @retry="refresh()" />
    <SkeletonRows v-if="loading" page class="mt-4" :count="6" />
    <div v-else-if="loadStatus === 'error' && !data" class="py-16 text-center text-sm text-rose-600">
      {{ localizeError(error) }} <button type="button" class="underline" @click="refresh()">{{ t('common.retry') }}</button>
    </div>
    <div v-else-if="!data?.articles.length" class="py-16 text-center">
      <FileText :size="28" class="mx-auto text-slate-300" />
      <p class="mt-3 text-sm text-slate-500">{{ t('article_ui.mine.empty') }}</p>
    </div>
    <ul
      v-else
      :key="revealKey"
      class="mt-4 divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white transition-opacity"
      :class="[revealClass, { 'pointer-events-none opacity-60': refetching }]"
      :inert="refetching"
    >
      <li v-for="article in data.articles" :key="article.id" class="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-2">
            <ArticleStatusBadge :status="article.status" />
            <span v-if="article.type" class="text-xs text-slate-400">{{ typeName(article.type) }}</span>
            <span v-if="article.featured" class="rounded bg-violet-50 px-1.5 text-[11px] text-violet-600">{{ t('article_ui.featured') }}</span>
          </div>
          <NuxtLink :to="`/articles/${article.id}/edit`" class="mt-1 block truncate font-medium text-slate-900 hover:text-violet-700">
            {{ article.title || t('article_ui.untitled') }}
          </NuxtLink>
          <p v-if="article.status_reason && (article.status === 'hidden' || article.status === 'locked')" class="mt-1 text-xs text-rose-600">
            {{ t('article_ui.mine.reason') }}{{ article.status_reason }}
          </p>
          <p class="mt-1 text-xs text-slate-400">
            {{ t('article_ui.mine.updated', { time: date(article.updated_at) }) }}
            <template v-if="article.status === 'published'"> · {{ t('article_ui.views', { count: article.views_count }) }} · {{ t('article_ui.likes', { count: article.likes_count }) }}</template>
          </p>
        </div>
        <div class="flex items-center gap-1">
          <NuxtLink v-if="article.status === 'published'" :to="`/articles/${article.id}`" class="btn btn-ghost btn-sm" :title="t('article_ui.mine.view')">
            <ExternalLink :size="14" />
          </NuxtLink>
          <NuxtLink :to="`/articles/${article.id}/edit`" class="btn btn-ghost btn-sm"><PenLine :size="14" />{{ t('common.edit') }}</NuxtLink>
          <button type="button" class="btn btn-ghost btn-sm text-rose-600" :title="t('common.delete')" @click="deleting = article"><Trash2 :size="14" /></button>
        </div>
      </li>
    </ul>
    <CommonPagination v-if="data && data.pagination.last_page > 1" v-model:page="page" class="mt-6" :total-pages="data.pagination.last_page" :disabled="refetching" />

    <CommonConfirmDialog
      v-model="deleteOpen" variant="delete" :title="t('article_ui.mine.delete_title')"
      :description="t('article_ui.mine.delete_description', { title: deleting?.title || t('article_ui.untitled') })" @confirm="remove" />
    <div
      v-if="toast.show" class="fixed bottom-6 right-6 z-50 rounded-xl border px-4 py-3 text-sm shadow-lg"
      :class="toast.type === 'error' ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'" role="status">
      {{ toast.message }}
    </div>
  </div>
</template>
