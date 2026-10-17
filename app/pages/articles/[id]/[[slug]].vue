<template>
  <div class="min-h-screen bg-[#f5f5f5]">
    <div v-if="pending" class="flex min-h-screen items-center justify-center">
      <span class="loading loading-spinner loading-lg text-violet-400" />
    </div>

    <div v-else-if="error" class="flex min-h-screen items-center justify-center p-6 text-center text-sm text-gray-500">
      {{ localizeError(error) }}
    </div>

    <template v-else-if="article">
      <ArticleHero :article="article" :word-count="article.word_count" :reading-time="readingTime" />

      <div class="container mx-auto max-w-6xl px-4 py-8 md:px-6 2xl:max-w-7xl">
        <div class="flex items-start gap-6">
          <div class="min-w-0 flex-1 space-y-4">
            <div class="flex flex-wrap items-center gap-2 rounded-2xl bg-white px-5 py-3 text-xs text-gray-500 shadow-sm">
              <span class="rounded-md bg-violet-50 px-2 py-0.5 font-semibold text-violet-700">{{ t(`article_ui.types.${article.type}`) }}</span>
              <NuxtLink v-for="tag in article.tags" :key="tag.id" :to="{ path: '/articles', query: { tag: tag.slug } }" class="rounded-md bg-slate-50 px-2 py-0.5 hover:text-violet-700">#{{ tagName(tag) }}</NuxtLink>
              <span v-if="article.updated_at" class="inline-flex items-center gap-1"><History :size="12" />{{ t('article_ui.reader.updated', { date: formatDate(article.updated_at) }) }}</span>
              <span class="inline-flex items-center gap-1"><Eye :size="12" />{{ t('article_ui.views', { count: article.views_count }) }}</span>
              <span class="ml-auto flex items-center gap-1">
                <NuxtLink v-if="article.can.manage" :to="`/admin/articles/${article.id}`" class="btn btn-ghost btn-xs"><Shield :size="12" />{{ t('article_ui.reader.manage') }}</NuxtLink>
                <button v-if="article.can.report" type="button" class="btn btn-ghost btn-xs" @click="reportOpen = true"><Flag :size="12" />{{ t('article_ui.report.title') }}</button>
              </span>
            </div>
            <ArticleContent ref="contentRef" :content="article.content" :published-at="article.published_at ?? ''" />
            <ArticleLinkCards :links="article.links" />
            <DiscussionCommentSection v-if="article.discussion_topic_id" :topic-id="article.discussion_topic_id" />
            <section v-if="moreByAuthor.length" class="rounded-2xl bg-white p-5 shadow-sm">
              <h2 class="text-sm font-bold text-gray-900">{{ t('article_ui.reader.more_by', { name: article.author?.nickname || article.author?.username }) }}</h2>
              <div class="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <ArticleCard v-for="item in moreByAuthor" :key="item.id" :article="item" />
              </div>
            </section>
          </div>

          <aside class="hidden w-64 shrink-0 lg:block xl:w-72">
            <ArticleAuthorCard v-if="article.author" :author="article.author" class="mb-4" />
            <ArticleToc :toc-items="tocItems" :article-el="contentRef?.articleEl ?? undefined" />
          </aside>
        </div>
      </div>

      <ArticleReportDialog v-if="article.can.report" v-model:open="reportOpen" :article-id="article.id" @reported="reported = true" />
      <p v-if="reported" class="fixed bottom-6 right-6 z-50 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 shadow-lg" role="status">
        {{ t('article_ui.report.done') }}
      </p>
      <DiscussionNotice />
    </template>
  </div>
</template>

<script setup lang="ts">
import { Eye, Flag, History, Shield } from '@lucide/vue'
import type { ArticleCard, ArticleDetail } from '~/types/article'

const route = useRoute()
const { t } = useI18n()
const { $api } = useNuxtApp()
const { localizeError } = useLocalizedApiError()
const { formatDate } = useLocaleFormatting()
const { tagName } = useTags()
const config = useRuntimeConfig()
const articleId = String(route.params.id)

const { data: article, pending, error } = await useAPI<ArticleDetail>(`/v1/articles/${articleId}`)

// Contents and anchors come from the same renderer that draws the article, so they always match.
const tocItems = computed(() => markdownHeadings(article.value?.content ?? ''))
const readingTime = computed(() => Math.max(1, Math.ceil((article.value?.word_count ?? 0) / 300)))
const contentRef = ref<{ articleEl: HTMLElement | null } | null>(null)
const reportOpen = ref(false)
const reported = ref(false)
watch(reported, (value) => { if (value) setTimeout(() => { reported.value = false }, 3000) })

const { data: moreByAuthor } = await useAsyncData(`articles-more-${articleId}`, async () => {
  if (!article.value?.author) return []
  const response = await $api<{ articles: ArticleCard[] }>('/v1/articles', { query: { user: article.value.author.username, per_page: 4 } })
  return response.articles.filter(item => item.id !== article.value?.id).slice(0, 3)
}, { default: () => [], watch: [article] })

const canonical = computed(() => article.value && config.public.baseUrl
  ? `${String(config.public.baseUrl).replace(/\/$/, '')}/articles/${article.value.id}${article.value.slug ? `/${article.value.slug}` : ''}` : undefined)

useSeoMeta({
  title: () => article.value?.title,
  description: () => article.value?.summary,
  ogTitle: () => article.value ? `${article.value.title} | CDCAT` : undefined,
  ogDescription: () => article.value?.summary,
  ogImage: () => article.value?.cover_url ?? undefined,
  ogType: 'article',
  articlePublishedTime: () => article.value?.published_at ?? undefined,
  articleModifiedTime: () => article.value?.updated_at ?? undefined,
})
useHead(() => ({
  link: canonical.value ? [{ rel: 'canonical', href: canonical.value }] : [],
  script: article.value ? [{
    type: 'application/ld+json',
    innerHTML: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Article',
      'headline': article.value.title,
      'description': article.value.summary,
      'image': article.value.cover_url ? [article.value.cover_url] : undefined,
      'datePublished': article.value.published_at,
      'dateModified': article.value.updated_at ?? article.value.published_at,
      'wordCount': article.value.word_count,
      'author': article.value.author ? { '@type': 'Person', 'name': article.value.author.nickname || article.value.author.username } : undefined,
    }),
  }] : [],
}))
</script>
