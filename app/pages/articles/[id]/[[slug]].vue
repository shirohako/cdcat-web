<template>
  <div class="min-h-screen bg-[#f5f5f5]">
    <!-- 加载状态 -->
    <div v-if="pending" class="flex items-center justify-center min-h-screen">
      <span class="loading loading-spinner loading-lg text-violet-400"></span>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="flex items-center justify-center min-h-screen">
      <div class="alert alert-error max-w-md mx-auto mt-20">
        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{{ $t('common.load_failed') }}</span>
      </div>
    </div>

    <template v-else-if="article">
      <ArticleHero
        :article="article"
        :word-count="wordCount"
        :reading-time="readingTime"
      />

      <div class="container mx-auto px-4 md:px-6 py-8 max-w-6xl 2xl:max-w-7xl">
        <div class="flex gap-6 items-start">
          <div class="flex-1 min-w-0">
            <ArticleContent
              ref="contentRef"
              :content="article.content"
              :published-at="article.published_at"
            />
          </div>

          <aside class="hidden lg:block w-64 xl:w-72 shrink-0">
            <ArticleAuthorCard :author="article.author" class="mb-4" />
            <ArticleToc :toc-items="tocItems" :article-el="contentRef?.articleEl" />
          </aside>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
const route = useRoute();
const articleId = route.params.id;

const { data: response, pending, error } = await useAPI(`/v1/articles/${articleId}`);
const article = computed(() => response.value ?? null);

useHead(() => ({
  title: article.value ? `${article.value.title} | CDCAT` : 'Article | CDCAT',
}));

// ── TOC ──
// Comes from the same renderer that draws the article, so every entry's id is
// guaranteed to match an anchor that actually exists in the rendered HTML.
const tocItems = computed(() => markdownHeadings(article.value?.content ?? ''));

// ── 统计 ──
const wordCount = computed(() => (article.value?.content ?? '').replace(/\s+/g, '').length);
const readingTime = computed(() => Math.max(1, Math.ceil(wordCount.value / 300)));

// ── Content ref (for TOC observer) ──
const contentRef = ref(null);
</script>
