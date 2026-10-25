<template>
  <div class="min-h-screen">
    <div v-if="article" :class="revealClass">
      <ArticleHero :article="article" :word-count="article.word_count" :reading-time="readingTime" />

      <div class="container mx-auto max-w-6xl px-4 py-8 md:px-6 2xl:max-w-7xl">
        <div class="flex items-start gap-6">
          <div class="min-w-0 flex-1 space-y-4">
            <div class="card flex flex-wrap items-center gap-2 px-5 py-3 text-xs text-meta">
              <span v-if="article.type" class="rounded-md bg-primary/15 px-2 py-0.5 font-semibold text-primary">{{ typeName(article.type) }}</span>
              <span v-for="tag in article.tags" :key="tag.id" class="rounded-md bg-btn px-2 py-0.5 text-btn-content">#{{ tagName(tag) }}</span>
              <a v-if="article.is_repost" href="#article-license" class="inline-flex items-center gap-1 rounded-md bg-warning/15 px-2 py-0.5 text-warning transition-colors duration-150 ease-out hover:bg-warning/25">
                <Repeat2 :size="12" />{{ t('article_ui.declaration.reposted') }}
              </a>
              <a
                v-else-if="license" :href="licenseUrl ?? '#article-license'" :target="licenseUrl ? '_blank' : undefined" :rel="licenseUrl ? 'license noopener' : undefined"
                class="inline-flex items-center gap-1 rounded-md bg-btn px-2 py-0.5 text-btn-content transition-colors duration-150 ease-out hover:bg-btn-hover" :title="t(`article_ui.licenses.${license.key}.summary`)">
                <Copyright v-if="!license.url" :size="12" /><span v-else class="font-mono text-[10px] font-bold">cc</span>
                {{ license.url ? license.short : t(`article_ui.licenses.${license.key}.name`) }}<ExternalLink v-if="licenseUrl" :size="10" />
              </a>
              <span v-if="article.updated_at" class="inline-flex items-center gap-1"><History :size="12" />{{ t('article_ui.reader.updated', { date: formatDate(article.updated_at) }) }}</span>
              <span class="inline-flex items-center gap-1"><Eye :size="12" />{{ t('article_ui.views', { count: article.views_count }) }}</span>
              <button
                type="button" class="btn btn-xs gap-1 rounded-full" :class="article.liked ? 'btn-error' : 'btn-ghost'"
                :disabled="liking || (isAuthenticated && !article.can.like)" :aria-pressed="article.liked"
                :title="isAuthenticated && !article.can.like ? t('article_ui.like_own') : t(article.liked ? 'article_ui.unlike' : 'article_ui.like')" @click="toggleLike">
                <Heart :size="12" :fill="article.liked ? 'currentColor' : 'none'" />{{ article.likes_count }}
              </button>
              <span class="ml-auto flex items-center gap-1">
                <NuxtLink v-if="article.can.manage" :to="`/admin/articles/${article.id}`" class="btn btn-ghost btn-xs"><Shield :size="12" />{{ t('article_ui.reader.manage') }}</NuxtLink>
                <button v-if="article.can.report" type="button" class="btn btn-ghost btn-xs" @click="reportOpen = true"><Flag :size="12" />{{ t('article_ui.report.title') }}</button>
              </span>
            </div>
            <ArticleContent ref="contentRef" :content="article.content" :published-at="article.published_at ?? ''" />
            <ArticleLicenseNotice :article="article" />
            <ArticleLinkCards :links="article.links" />
            <DiscussionCommentSection v-if="article.discussion_topic_id" :topic-id="article.discussion_topic_id" />
            <section v-if="moreByAuthor.length" class="card p-5 @container">
              <h2 class="text-sm font-bold text-title">{{ t('article_ui.reader.more_by', { name: article.author?.nickname || article.author?.username }) }}</h2>
              <div class="mt-3 grid grid-cols-1 gap-4 @lg:grid-cols-2 @4xl:grid-cols-3">
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
      <p v-if="reported" class="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl bg-popover px-4 py-3 text-sm text-body shadow-overlay ring-1 ring-line" role="status">
        <Icon name="lucide:circle-check" class="size-4 shrink-0 text-success" />{{ t('article_ui.report.done') }}
      </p>
      <DiscussionNotice />
    </div>

    <div v-else-if="status === 'error'" class="flex min-h-screen items-center justify-center p-6 text-center text-sm text-meta">
      {{ localizeError(error) }}
    </div>

    <SkeletonArticle v-else />
  </div>
</template>

<script setup lang="ts">
import { Copyright, ExternalLink, Eye, Flag, Heart, History, Repeat2, Shield } from '@lucide/vue'
import type { ArticleCard, ArticleDetail } from '~/types/article'
import { articleLicense, licenseDeedUrl } from '~/utils/articleLicenses'
import { compactLd } from '~/utils/structuredData'

const route = useRoute()
const { t, locale } = useI18n()
const { $api } = useNuxtApp()
const { localizeError } = useLocalizedApiError()
const { showToast } = useToast()
const { formatDate } = useLocaleFormatting()
const { tagName } = useTags()
const { typeName } = useArticleTypes()
const articleId = String(route.params.id)

const { data: article, status, error, revealClass, mutate } = await usePageAPI<ArticleDetail>(`/v1/articles/${articleId}`)
const license = computed(() => article.value && !article.value.is_repost ? articleLicense(article.value.license) : null)
const licenseUrl = computed(() => license.value ? licenseDeedUrl(license.value, locale.value) : null)

// Liking: guests go to log in first; authors cannot like their own article.
const { isAuthenticated } = useAuth()
const liking = ref(false)
async function toggleLike() {
  const current = article.value
  if (!current || liking.value) return
  if (!isAuthenticated.value) {
    await navigateTo({ path: '/auth/login', query: { redirect: route.fullPath } })
    return
  }
  liking.value = true
  try {
    const result = await $api<{ liked: boolean, likes_count: number }>(`/v1/articles/${current.id}/like`, { method: current.liked ? 'DELETE' : 'PUT' })
    mutate(value => ({ ...value, liked: result.liked, likes_count: result.likes_count }))
  }
  catch (failure) { showToast(localizeError(failure), 'error') }
  finally { liking.value = false }
}

// Contents and anchors come from the same renderer that draws the article, so they always match.
const tocItems = computed(() => markdownHeadings(article.value?.content ?? ''))
const readingTime = computed(() => Math.max(1, Math.ceil((article.value?.word_count ?? 0) / 300)))
const contentRef = ref<{ articleEl: HTMLElement | null } | null>(null)
const reportOpen = ref(false)
const reported = ref(false)
watch(reported, (value) => { if (value) setTimeout(() => { reported.value = false }, 3000) })

// Not awaited: it only needs the author, and the page shouldn't wait for it on the server either.
const author = computed(() => article.value?.author?.username ?? '')
const { data: moreData } = usePageData(() => `articles-more-${articleId}-${author.value}`, async ({ signal, background }) => {
  if (!author.value) return []
  const response = await $api<{ articles: ArticleCard[] }>('/v1/articles', { query: { user: author.value, per_page: 4 }, signal, progress: !background })
  return response.articles.filter(item => item.id !== article.value?.id).slice(0, 3)
})
const moreByAuthor = computed(() => moreData.value ?? [])

const articlePath = computed(() => article.value ? `/articles/${article.value.id}${article.value.slug ? `/${article.value.slug}` : ''}` : null)
const absolute = useSiteUrl()
usePageSeo({
  title: () => article.value?.title,
  description: () => article.value?.summary,
  image: () => article.value?.cover_url,
  wideImage: true,
  type: 'article',
  path: articlePath,
  query: [],
  error,
  breadcrumbs: () => article.value && articlePath.value
    ? [{ name: t('content_display.articles'), path: '/articles' }, { name: article.value.title, path: articlePath.value }]
    : null,
  jsonLd: () => article.value && compactLd({
    '@context': 'https://schema.org',
    '@type': 'Article',
    'headline': article.value.title,
    'description': article.value.summary,
    'url': articlePath.value ? absolute(articlePath.value) : undefined,
    'image': article.value.cover_url ? [article.value.cover_url] : undefined,
    'datePublished': article.value.published_at,
    'dateModified': article.value.updated_at ?? article.value.published_at,
    'wordCount': article.value.word_count,
    'author': article.value.author
      ? { '@type': 'Person', 'name': article.value.author.nickname || article.value.author.username, 'url': absolute(`/profile/${article.value.author.username}`) }
      : undefined,
  }),
})
useSeoMeta({
  articlePublishedTime: () => article.value?.published_at ?? undefined,
  articleModifiedTime: () => article.value?.updated_at ?? undefined,
})
</script>
