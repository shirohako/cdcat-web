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
        <h1 class="text-2xl font-bold text-title">{{ t('article_ui.mine.title') }}</h1>
        <p class="mt-1 text-sm text-meta">{{ t('article_ui.mine.description') }}</p>
      </div>
      <NuxtLink to="/articles/new" class="btn btn-primary btn-sm"><Plus :size="15" />{{ t('article_ui.write') }}</NuxtLink>
    </header>

    <NuxtLink v-if="localNew" to="/articles/new" class="mt-6 flex items-center gap-3 rounded-xl border border-warning/25 bg-warning/10 px-4 py-3 text-sm text-warning transition-colors duration-150 ease-out hover:bg-warning/15">
      <HardDrive :size="16" class="shrink-0" />
      <span class="min-w-0 flex-1 truncate">{{ t('article_ui.mine.local_new', { title: localNew.title || t('article_ui.untitled'), time: date(localNew.at) }) }}</span>
      <span class="shrink-0 font-medium">{{ t('article_ui.chooser.continue') }}</span>
    </NuxtLink>

    <nav class="mt-6 flex gap-1 overflow-x-auto border-b border-line" :aria-label="t('article_ui.mine.filter')">
      <button
        v-for="tab in tabs" :key="tab.value ?? 'all'" type="button"
        class="-mb-px inline-flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2 text-sm transition-colors duration-150 ease-out"
        :class="status === tab.value ? 'border-primary font-semibold text-primary' : 'border-transparent text-meta hover:text-title'"
        @click="selectTab(tab.value)">
        {{ tab.value ? t(`article_ui.statuses.${tab.value}`) : t('article_ui.mine.all') }}
        <span v-if="data" class="rounded-full bg-btn px-1.5 text-[11px] tabular-nums text-btn-content">{{ tab.count }}</span>
      </button>
    </nav>

    <CommonLoadError v-if="loadStatus === 'error' && data" class="mt-4" @retry="refresh()" />
    <SkeletonRows v-if="loading" page class="mt-4" :count="6" />
    <div v-else-if="loadStatus === 'error' && !data" class="py-16 text-center text-sm text-danger">
      {{ localizeError(error) }} <button type="button" class="underline" @click="refresh()">{{ t('common.retry') }}</button>
    </div>
    <UiEmpty v-else-if="!data?.articles.length" :title="t('article_ui.mine.empty')" :icon="FileText" class="mt-4" />
    <ul
      v-else
      :key="revealKey"
      class="card mt-4 divide-y divide-line transition-opacity"
      :class="[revealClass, { 'pointer-events-none opacity-60': refetching }]"
      :inert="refetching"
    >
      <li v-for="article in data.articles" :key="article.id" class="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-2">
            <ArticleStatusBadge :status="article.status" />
            <span v-if="article.type" class="text-xs text-meta">{{ typeName(article.type) }}</span>
            <span v-if="article.featured" class="rounded bg-primary/15 px-1.5 text-[11px] text-primary">{{ t('article_ui.featured') }}</span>
          </div>
          <NuxtLink :to="`/articles/${article.id}/edit`" class="mt-1 block truncate font-medium text-title transition-colors duration-150 ease-out hover:text-primary">
            {{ article.title || t('article_ui.untitled') }}
          </NuxtLink>
          <p v-if="article.status_reason && (article.status === 'hidden' || article.status === 'locked')" class="mt-1 text-xs text-danger">
            {{ t('article_ui.mine.reason') }}{{ article.status_reason }}
          </p>
          <p class="mt-1 text-xs text-meta">
            {{ t('article_ui.mine.updated', { time: date(article.updated_at) }) }}
            <template v-if="article.status === 'published'"> · {{ t('article_ui.views', { count: article.views_count }) }} · {{ t('article_ui.likes', { count: article.likes_count }) }}</template>
          </p>
        </div>
        <div class="flex items-center gap-1">
          <NuxtLink v-if="article.status === 'published'" :to="`/articles/${article.id}`" class="btn btn-ghost btn-sm" :title="t('article_ui.mine.view')">
            <ExternalLink :size="14" />
          </NuxtLink>
          <NuxtLink :to="`/articles/${article.id}/edit`" class="btn btn-ghost btn-sm"><PenLine :size="14" />{{ t('common.edit') }}</NuxtLink>
          <button type="button" class="btn btn-ghost btn-sm text-danger" :title="t('common.delete')" @click="deleting = article"><Trash2 :size="14" /></button>
        </div>
      </li>
    </ul>
    <CommonPagination v-if="data && data.pagination.last_page > 1" v-model:page="page" class="mt-6" :total-pages="data.pagination.last_page" :disabled="refetching" />

    <CommonConfirmDialog
      v-model="deleteOpen" variant="delete" :title="t('article_ui.mine.delete_title')"
      :description="t('article_ui.mine.delete_description', { title: deleting?.title || t('article_ui.untitled') })" @confirm="remove" />
    <div
      v-if="toast.show" class="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl bg-popover px-4 py-3 text-sm text-body shadow-overlay ring-1 ring-line" role="status">
      <Icon :name="toast.type === 'error' ? 'lucide:circle-alert' : 'lucide:circle-check'" class="size-4 shrink-0" :class="toast.type === 'error' ? 'text-danger' : 'text-success'" />{{ toast.message }}
    </div>
  </div>
</template>
