<script setup lang="ts">
import { Eye, Heart, Sparkles } from '@lucide/vue'
import type { ArticleCard } from '~/types/article'

/**
 * A published article in a grid: cover (or ArticleCoverArt) with views, likes and the featured mark on it, then
 * type, title, spoiler-free summary, tags, and who posted it and when. It sits in a page card, so it draws its own
 * edge: a hairline ring and a faint shadow that both take the theme colour on hover. The cover is inset so its corners
 * follow the card's (14px outside, 6px gap, 8px inside).
 */
const props = defineProps<{ article: ArticleCard }>()
const { t, locale } = useI18n()
const { tagName } = useTags()
const { typeName } = useArticleTypes()
const href = computed(() => props.article.slug ? `/articles/${props.article.id}/${props.article.slug}` : `/articles/${props.article.id}`)
const authorName = computed(() => props.article.author?.nickname || props.article.author?.username || t('common.anonymous'))
const date = computed(() => props.article.published_at ? new Intl.DateTimeFormat(locale.value, { dateStyle: 'medium' }).format(new Date(props.article.published_at)) : '')
// 1.2万 / 1.2K: the counts sit in small badges on the cover.
const count = computed(() => new Intl.NumberFormat(locale.value, { notation: 'compact', maximumFractionDigits: 1 }))
</script>

<template>
  <NuxtLink
    :to="href"
    class="group flex flex-col rounded-[14px] bg-card p-1.5 shadow-[0_1px_2px_oklch(0_0_0/0.05)] ring-1 ring-line transition-shadow duration-200 ease-out
           hover:shadow-[0_14px_32px_-16px_color-mix(in_oklch,var(--primary)_60%,transparent)] hover:ring-primary/40"
  >
    <div class="relative aspect-video overflow-hidden rounded-lg">
      <img
        v-if="article.cover_url" v-img-fade :src="article.cover_url" :alt="article.title" loading="lazy" referrerpolicy="no-referrer"
        class="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04] motion-reduce:transition-none">
      <ArticleCoverArt v-else />

      <span v-if="article.featured" class="absolute left-2 top-2 inline-flex h-6 items-center gap-1 rounded-md bg-primary px-2 text-[11px] font-semibold text-on-primary shadow-sm">
        <Sparkles :size="12" aria-hidden="true" />{{ t('article_ui.featured') }}
      </span>
      <div class="absolute bottom-2 right-2 flex gap-1.5 text-[11px] font-semibold tabular-nums text-on-media">
        <span class="inline-flex h-6 items-center gap-1 rounded-md bg-scrim px-2 backdrop-blur-sm">
          <Eye :size="12" aria-hidden="true" /><span aria-hidden="true">{{ count.format(article.views_count) }}</span>
          <span class="sr-only">{{ t('article_ui.views', { count: article.views_count }) }}</span>
        </span>
        <span class="inline-flex h-6 items-center gap-1 rounded-md bg-scrim px-2 backdrop-blur-sm">
          <Heart :size="12" aria-hidden="true" /><span aria-hidden="true">{{ count.format(article.likes_count) }}</span>
          <span class="sr-only">{{ t('article_ui.likes', { count: article.likes_count }) }}</span>
        </span>
      </div>
    </div>

    <div class="flex flex-1 flex-col px-2.5 pb-2.5 pt-3">
      <p class="mb-1.5 truncate text-[11px] font-semibold tracking-wide text-primary">{{ typeName(article.type) }}</p>
      <h2 class="line-clamp-2 text-[15px] font-bold leading-snug text-title transition-colors duration-150 ease-out group-hover:text-primary">{{ article.title }}</h2>
      <p v-if="article.summary" class="mt-1.5 line-clamp-2 text-xs leading-relaxed text-meta">{{ article.summary }}</p>
      <div v-if="article.tags.length" class="mt-2.5 flex flex-wrap gap-1">
        <span v-for="tag in article.tags.slice(0, 3)" :key="tag.id" class="rounded-md bg-btn px-1.5 py-0.5 text-[11px] text-btn-content">#{{ tagName(tag) }}</span>
      </div>

      <!-- The poster takes the whole row, with the date under the name. -->
      <div class="mt-auto flex items-center gap-2.5 pt-4">
        <UiAvatar :src="article.author?.avatar_url" :name="authorName" alt="" size="sm" />
        <div class="min-w-0 flex-1">
          <p class="truncate text-xs font-semibold leading-5 text-body">{{ authorName }}</p>
          <time v-if="date" :datetime="article.published_at ?? undefined" class="block text-[11px] leading-4 text-faint">{{ date }}</time>
        </div>
      </div>
    </div>
  </NuxtLink>
</template>
