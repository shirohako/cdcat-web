<script setup lang="ts">
import { FileText, FolderOpen, PenLine, Search, Sparkles } from '@lucide/vue'
import type { ArticleCard, Pagination } from '~/types/article'
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

useHead({ title: computed(() => t('content_display.articles')) })
</script>

<template>
  <div class="relative min-h-screen">
    <div aria-hidden="true" class="pointer-events-none absolute inset-0 overflow-hidden">
      <div class="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-linear-to-br from-primary/15 to-primary/5 blur-3xl" />
      <div class="absolute -right-20 top-10 h-72 w-72 rounded-full bg-linear-to-br from-primary/10 to-transparent blur-3xl" />
      <div class="absolute bottom-0 left-1/2 h-64 w-64 rounded-full bg-linear-to-br from-primary/10 to-primary/5 blur-3xl" />
    </div>

    <div class="container relative mx-auto max-w-6xl px-4 py-10 md:px-8 2xl:max-w-7xl">
      <CollectionPageCard>
        <template #header>
          <CollectionPageHeader :title="t('content_display.articles')" :description="t('content_display.articles_desc')" icon="lucide:newspaper">
            <template #action>
              <div class="flex items-center gap-2">
                <NuxtLink v-if="isAuthenticated" to="/articles/mine" class="btn btn-sm gap-1.5 px-2.5 text-xs sm:h-9 sm:px-3.5">
                  <FolderOpen :size="14" /><span class="hidden sm:inline">{{ t('article_ui.mine.title') }}</span>
                </NuxtLink>
                <NuxtLink v-if="isAuthenticated" to="/articles/new" class="btn btn-primary btn-sm h-8 w-8 shrink-0 p-0 text-xs sm:h-9 sm:w-auto sm:gap-2 sm:px-3.5">
                  <PenLine :size="14" /><span class="hidden sm:inline">{{ t('content_display.new_article') }}</span>
                </NuxtLink>
              </div>
            </template>
          </CollectionPageHeader>
        </template>

        <section v-if="showFeatured && (featured.length || featuredLoading)" class="mb-8">
          <h2 class="mb-3 inline-flex items-center gap-1.5 text-sm font-bold text-body"><Sparkles :size="15" class="text-primary" />{{ t('article_ui.list.featured') }}</h2>
          <CollectionLoadingSkeleton v-if="featuredLoading" variant="articles" :count="3" grid-class="grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3" />
          <div v-else class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <ArticleCard v-for="article in featured" :key="article.id" :article="article" />
          </div>
        </section>

        <div class="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center">
          <div class="flex flex-wrap gap-1.5">
            <button type="button" class="chip chip-sm" :class="{ 'chip-selected': !type }" @click="update({ type: null })">
              {{ t('article_ui.list.all_types') }}
            </button>
            <button
              v-for="option in typeOptions" :key="option.key" type="button" class="chip chip-sm"
              :class="{ 'chip-selected': type === option.key }" @click="update({ type: option.key })">
              {{ typeName(option.key) }}
            </button>
          </div>
          <div class="flex flex-wrap items-center gap-2 lg:ml-auto">
            <UiSelect
              :model-value="sort" :options="sortOptions" size="xs" :aria-label="t('article_ui.list.sort')"
              @update:model-value="value => update({ sort: value === 'popular' ? 'popular' : null })"
            />
            <form class="flex items-center gap-1.5 rounded-lg border border-line bg-field px-2.5 py-1.5 transition-colors duration-150 ease-out focus-within:border-primary" role="search" @submit.prevent="submitSearch">
              <Search :size="13" class="text-meta" />
              <input v-model="searchInput" type="search" maxlength="100" class="w-36 bg-transparent text-xs text-title outline-none placeholder:text-faint" :placeholder="t('article_ui.list.search')">
            </form>
          </div>
        </div>

        <CommonLoadError v-if="status === 'error' && data" class="mb-4" @retry="refresh()" />
        <CollectionLoadingSkeleton v-if="loading" variant="articles" />
        <div v-else-if="status === 'error' && !data" class="flex min-h-60 flex-col items-center justify-center gap-2 text-sm text-meta">
          {{ t('common.load_failed') }}<button type="button" class="link" @click="refresh()">{{ t('common.retry') }}</button>
        </div>
        <div v-else :key="revealKey" class="transition-opacity" :class="[revealClass, { 'pointer-events-none opacity-60': refetching }]" :inert="refetching">
          <div v-if="data?.articles.length" class="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            <ArticleCard v-for="article in data.articles" :key="article.id" :article="article" />
          </div>
          <UiEmpty v-else :title="filtered ? t('article_ui.list.no_match') : t('content_display.no_articles')" :icon="FileText" class="min-h-72" />
          <CommonPagination
            v-if="data && data.pagination.last_page > 1" class="mt-6" :page="data.pagination.current_page" :total-pages="data.pagination.last_page"
            :disabled="refetching" @update:page="value => update({ page: value > 1 ? String(value) : null })" />
        </div>
      </CollectionPageCard>
    </div>
  </div>
</template>
