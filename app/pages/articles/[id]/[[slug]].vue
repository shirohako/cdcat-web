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
        <span>加载失败: {{ error.message }}</span>
      </div>
    </div>

    <template v-else-if="article">
      <ArticleHero
        :article="article"
        :word-count="wordCount"
        :reading-time="readingTime"
      />

      <div class="container mx-auto px-4 md:px-6 py-8 max-w-6xl">
        <div class="flex gap-6 items-start">
          <div class="flex-1 min-w-0">
            <ArticleContent
              ref="contentRef"
              :rendered-content="renderedContent"
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
import MarkdownIt from "markdown-it";
import anchor from "markdown-it-anchor";
import hexoTagPlugin from "~/utils/markdownTagPlugin.js";

const route = useRoute();
const articleId = route.params.id;

const { data: response, pending, error } = await useAPI(`/v1/articles/${articleId}`);
const article = computed(() => response.value ?? null);

useHead(() => ({
  title: article.value ? `${article.value.title} | CDCAT` : 'Article | CDCAT',
}));

// ── Markdown ──
const md = new MarkdownIt({ html: false, breaks: true, linkify: true })
  .use(anchor, {
    slugify: (s) => s.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w\u4e00-\u9fa5-]/g, ''),
  })
  .use(hexoTagPlugin);

const DOMPurify = import.meta.client ? (await import('dompurify')).default : null;

const renderedContent = computed(() => {
  const text = article.value?.content;
  if (!text) return "";
  const rendered = md.render(text);
  if (DOMPurify) {
    return DOMPurify.sanitize(rendered, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 's', 'a', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'img', 'div', 'span', 'i'],
      ALLOWED_ATTR: ['href', 'target', 'rel', 'id', 'class', 'src', 'alt'],
    });
  }
  return rendered;
});

// ── TOC ──
const tocItems = computed(() => {
  const text = article.value?.content;
  if (!text) return [];
  return md.parse(text, {}).reduce((acc, token, i, tokens) => {
    if (token.type !== 'heading_open') return acc;
    const level = parseInt(token.tag.slice(1));
    const text = tokens[i + 1]?.children?.map(t => t.content).join('') ?? '';
    if (!text) return acc;
    const id = text.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w\u4e00-\u9fa5-]/g, '');
    acc.push({ id, text, level });
    return acc;
  }, []);
});

// ── 统计 ──
const wordCount = computed(() => (article.value?.content ?? '').replace(/\s+/g, '').length);
const readingTime = computed(() => Math.max(1, Math.ceil(wordCount.value / 300)));

// ── Content ref (for TOC observer) ──
const contentRef = ref(null);
</script>
