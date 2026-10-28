<script setup lang="ts">
import { FileText, FolderOpen, Sparkles } from '@lucide/vue'
import type { ArticleCard } from '~/types/article'
import type { Pagination } from '~/types/api'
import type { UiSelectOption } from '~/components/ui/Select.vue'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const { $api } = useNuxtApp()
const { isAuthenticated } = useAuth()
const { types, typeName } = useArticleTypes()

// Deactivated types stay in the filter only while they are the one selected, so old links keep working.
const type = computed(() => typeof route.query.type === 'string' && /^[a-z][a-z0-9_]{1,19}$/.test(route.query.type) ? route.query.type : null)
const typeOptions = computed(() => types.value.filter(item => item.is_active || item.key === type.value))
const typeFilters = computed(() => [
  { value: 'all', label: t('article_ui.list.all_types') },
  ...typeOptions.value.map(option => ({ value: option.key, label: typeName(option.key) })),
])
const sort = computed(() => route.query.sort === 'popular' ? 'popular' : 'latest')
const sortOptions = computed<UiSelectOption<'latest' | 'popular'>[]>(() => [
  { value: 'latest', label: t('article_ui.list.latest') },
  { value: 'popular', label: t('article_ui.list.popular') },
])
const search = computed(() => route.query.search ? String(route.query.search) : '')
const page = computed(() => Math.max(1, Number.parseInt(String(route.query.page || '1')) || 1))
const filtered = computed(() => type.value || search.value)
const searchInput = ref(search.value)
watch(search, (value) => { searchInput.value = value })

const update = (changes: Record<string, string | null | undefined>) => {
  const query: Record<string, string> = {}
  for (const [key, value] of Object.entries({ ...route.query, page: undefined, ...changes })) {
    if (value) query[key] = String(value)
  }
  router.push({ query })
}
const submitSearch = () => update({ search: searchInput.value.trim().length >= 2 ? searchInput.value.trim() : null })

const { data, status, refresh, loading, refetching, revealKey, revealClass } = await usePageData(
  () => `articles-list-${JSON.stringify([type.value, sort.value, search.value, page.value])}`,
  ({ signal, background }) => $api<{ articles: ArticleCard[], pagination: Pagination }>('/v1/articles', {
    query: { type: type.value ?? undefined, sort: sort.value, search: search.value || undefined, page: page.value },
    signal,
    progress: !background,
  }),
)

// Featured articles only show on the first, unfiltered page, so they're only asked for there. Not awaited:
// the server loads them alongside the list.
const showFeatured = computed(() => !filtered.value && page.value === 1)
const { data: featuredData, loading: featuredLoading } = usePageData(
  () => showFeatured.value ? 'articles-featured' : 'articles-featured-off',
  async ({ signal, background }) => showFeatured.value
    ? (await $api<{ articles: ArticleCard[] }>('/v1/articles', { query: { featured: 1, per_page: 3 }, signal, progress: !background })).articles
    : [],
)
const featured = computed(() => featuredData.value ?? [])

usePageSeo({ title: () => t('content_display.articles'), description: () => t('seo.pages.articles') })
</script>

<template>
  <div class="relative min-h-screen">
    <div aria-hidden="true" class="pointer-events-none absolute inset-0 overflow-hidden">
      <div class="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-linear-to-br from-primary/15 to-primary/5 blur-3xl" />
      <div class="absolute -right-20 top-10 h-72 w-72 rounded-full bg-linear-to-br from-primary/10 to-transparent blur-3xl" />
      <div class="absolute bottom-0 left-1/2 h-64 w-64 rounded-full bg-linear-to-br from-primary/10 to-primary/5 blur-3xl" />
    </div>

    <div class="container relative mx-auto max-w-6xl px-4 py-8 md:px-8 2xl:max-w-7xl">
      <CollectionPageCard>
        <template #header>
          <CollectionPageHeader
            v-model:search="searchInput"
            :model-value="type ?? 'all'"
            :title="t('content_display.articles')"
            :description="t('content_display.articles_desc')"
            icon="lucide:newspaper"
            :filters="typeFilters"
            :filter-label="t('content_display.type')"
            :search-placeholder="t('article_ui.list.search')"
            @update:model-value="value => update({ type: value === 'all' ? null : value })"
            @search="submitSearch"
          >
            <template #icon>
              <HeaderArtArticles />
            </template>
            <template v-if="isAuthenticated" #action>
              <!-- Icon-only below sm only, so named with aria-label: `label` would keep them square at every width. -->
              <UiButton to="/articles/mine" size="sm" :icon="FolderOpen" class="max-sm:w-8 max-sm:px-0" :aria-label="t('article_ui.mine.title')">
                <span class="hidden sm:inline">{{ t('article_ui.mine.title') }}</span>
              </UiButton>
              <!-- The list headers' old "new" button; the other lists use UiCreateButton. -->
              <UiButton to="/articles/new" variant="primary" size="sm" icon="lucide:plus" class="max-sm:w-8 max-sm:px-0" :aria-label="t('content_display.new_article')">
                <span class="hidden sm:inline">{{ t('content_display.new_article') }}</span>
              </UiButton>
            </template>
            <template #filter-end>
              <UiSelect
                :model-value="sort" :options="sortOptions" size="sm" :aria-label="t('article_ui.list.sort')"
                @update:model-value="value => update({ sort: value === 'popular' ? 'popular' : null })"
              />
            </template>
          </CollectionPageHeader>
        </template>

        <!-- Article grids count columns by the room they get (container queries), so the sidebar's width doesn't squeeze
             four cards into a row: one, two from 512px, three from 896px. -->
        <section v-if="showFeatured && (featured.length || featuredLoading)" class="mb-8 @container">
          <h2 class="mb-3 inline-flex items-center gap-1.5 text-sm font-bold text-body"><Sparkles :size="15" class="text-primary" />{{ t('article_ui.list.featured') }}</h2>
          <CollectionLoadingSkeleton v-if="featuredLoading" variant="articles" :count="3" />
          <div v-else class="grid grid-cols-1 gap-5 @lg:grid-cols-2 @4xl:grid-cols-3">
            <ArticleCard v-for="article in featured" :key="article.id" :article="article" />
          </div>
        </section>

        <CommonLoadError v-if="status === 'error' && data" class="mb-4" @retry="refresh()" />
        <CollectionLoadingSkeleton v-if="loading" variant="articles" />
        <div v-else-if="status === 'error' && !data" class="flex min-h-60 flex-col items-center justify-center gap-2 text-sm text-meta">
          {{ t('common.load_failed') }}<UiButton size="xs" @click="refresh()">{{ t('common.retry') }}</UiButton>
        </div>
        <div v-else :key="revealKey" class="transition-opacity @container" :class="[revealClass, { 'pointer-events-none opacity-60': refetching }]" :inert="refetching">
          <CommonPagedList
            :page="data?.pagination.current_page ?? 1" :total-pages="data?.pagination.last_page ?? 1" :total="data?.pagination.total ?? 0"
            :count="data?.articles.length ?? 0" :per-page="data?.pagination.per_page ?? 1" :top-after="6" :disabled="refetching" @update:page="value => update({ page: value > 1 ? String(value) : null })"
          >
            <div v-if="data?.articles.length" class="grid grid-cols-1 gap-5 @lg:grid-cols-2 @4xl:grid-cols-3">
              <ArticleCard v-for="article in data.articles" :key="article.id" :article="article" />
            </div>
            <UiEmpty v-else :title="filtered ? t('article_ui.list.no_match') : t('content_display.no_articles')" :icon="FileText" class="min-h-72" />
          </CommonPagedList>
        </div>
      </CollectionPageCard>
    </div>
  </div>
</template>
