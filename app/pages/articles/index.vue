<script setup lang="ts">
import { FileText, FolderOpen, PenLine, Search, Sparkles } from '@lucide/vue'
import type { ArticleCard, Pagination } from '~/types/article'

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

const { data, pending, error, refresh } = await useAsyncData('articles-list',
  () => $api<{ articles: ArticleCard[], pagination: Pagination }>('/v1/articles', {
    query: { type: type.value ?? undefined, sort: sort.value, search: search.value || undefined, page: page.value },
  }), { watch: [type, sort, search, page] })

const { data: featured } = await useAsyncData('articles-featured',
  () => $api<{ articles: ArticleCard[] }>('/v1/articles', { query: { featured: 1, per_page: 3 } }).then(response => response.articles),
  { default: () => [] })

useHead({ title: computed(() => t('content_display.articles')) })
</script>

<template>
  <div class="relative min-h-screen bg-base-100">
    <div aria-hidden="true" class="pointer-events-none absolute inset-0 overflow-hidden">
      <div class="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-linear-to-br from-violet-200/40 to-indigo-200/20 blur-3xl" />
      <div class="absolute -right-20 top-10 h-72 w-72 rounded-full bg-linear-to-br from-sky-200/35 to-cyan-200/15 blur-3xl" />
      <div class="absolute bottom-0 left-1/2 h-64 w-64 rounded-full bg-linear-to-br from-pink-200/25 to-rose-200/10 blur-3xl" />
    </div>

    <div class="container relative mx-auto max-w-6xl px-4 py-10 md:px-8 2xl:max-w-7xl">
      <CollectionPageCard>
        <template #header>
          <CollectionPageHeader :title="t('content_display.articles')" :description="t('content_display.articles_desc')" icon="lucide:newspaper" tone="indigo">
            <template #action>
              <div class="flex items-center gap-2">
                <NuxtLink v-if="isAuthenticated" to="/articles/mine" class="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 sm:h-9 sm:px-3.5">
                  <FolderOpen :size="14" /><span class="hidden sm:inline">{{ t('article_ui.mine.title') }}</span>
                </NuxtLink>
                <NuxtLink v-if="isAuthenticated" to="/articles/new" class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-900 p-0 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-slate-700 sm:h-9 sm:w-auto sm:gap-2 sm:px-3.5">
                  <PenLine :size="14" /><span class="hidden sm:inline">{{ t('content_display.new_article') }}</span>
                </NuxtLink>
              </div>
            </template>
          </CollectionPageHeader>
        </template>

        <section v-if="featured.length && !filtered && page === 1" class="mb-8">
          <h2 class="mb-3 inline-flex items-center gap-1.5 text-sm font-bold text-slate-700"><Sparkles :size="15" class="text-violet-500" />{{ t('article_ui.list.featured') }}</h2>
          <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <ArticleCard v-for="article in featured" :key="article.id" :article="article" />
          </div>
        </section>

        <div class="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center">
          <div class="flex flex-wrap gap-1.5">
            <button type="button" class="rounded-full px-3 py-1 text-xs font-medium transition" :class="!type ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-slate-300'" @click="update({ type: null })">
              {{ t('article_ui.list.all_types') }}
            </button>
            <button
              v-for="option in typeOptions" :key="option.key" type="button" class="rounded-full px-3 py-1 text-xs font-medium transition"
              :class="type === option.key ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-slate-300'" @click="update({ type: option.key })">
              {{ typeName(option.key) }}
            </button>
          </div>
          <div class="flex flex-wrap items-center gap-2 lg:ml-auto">
            <select :value="sort" class="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-600" :aria-label="t('article_ui.list.sort')" @change="update({ sort: ($event.target as HTMLSelectElement).value === 'popular' ? 'popular' : null })">
              <option value="latest">{{ t('article_ui.list.latest') }}</option>
              <option value="popular">{{ t('article_ui.list.popular') }}</option>
            </select>
            <form class="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 focus-within:border-violet-400" role="search" @submit.prevent="submitSearch">
              <Search :size="13" class="text-slate-400" />
              <input v-model="searchInput" type="search" maxlength="100" class="w-36 bg-transparent text-xs outline-none placeholder:text-slate-300" :placeholder="t('article_ui.list.search')">
            </form>
          </div>
        </div>

        <CollectionLoadingSkeleton v-if="pending" variant="wide" />
        <div v-else-if="error" class="flex min-h-60 flex-col items-center justify-center gap-2 text-sm text-slate-500">
          {{ t('common.load_failed') }}<button type="button" class="underline" @click="refresh()">{{ t('common.retry') }}</button>
        </div>
        <div v-else class="collection-content-enter">
          <div v-if="data?.articles.length" class="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            <ArticleCard v-for="article in data.articles" :key="article.id" :article="article" />
          </div>
          <div v-else class="flex min-h-72 flex-col items-center justify-center text-center">
            <div class="mx-auto mb-4 grid size-16 place-items-center rounded-2xl bg-gray-50"><FileText :size="28" class="text-gray-300" /></div>
            <p class="text-sm text-gray-400">{{ filtered ? t('article_ui.list.no_match') : t('content_display.no_articles') }}</p>
          </div>
          <CommonPagination
            v-if="data && data.pagination.last_page > 1" class="mt-6" :page="data.pagination.current_page" :total-pages="data.pagination.last_page"
            :disabled="pending" @update:page="value => update({ page: value > 1 ? String(value) : null })" />
        </div>
      </CollectionPageCard>
    </div>
  </div>
</template>
