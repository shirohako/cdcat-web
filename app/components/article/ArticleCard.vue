<script setup lang="ts">
import { Calendar, Clock, Heart, ImageIcon, Sparkles, UserRound } from '@lucide/vue'
import type { ArticleCard } from '~/types/article'

/** A published article in a grid: cover, type, title, spoiler-free summary and reading time. */
const props = defineProps<{ article: ArticleCard }>()
const { t, locale } = useI18n()
const { tagName } = useTags()
const { typeName } = useArticleTypes()
const href = computed(() => props.article.slug ? `/articles/${props.article.id}/${props.article.slug}` : `/articles/${props.article.id}`)
const minutes = computed(() => Math.max(1, Math.ceil(props.article.word_count / 300)))
const date = computed(() => props.article.published_at ? new Intl.DateTimeFormat(locale.value, { dateStyle: 'medium' }).format(new Date(props.article.published_at)) : '')
</script>

<template>
  <NuxtLink :to="href" class="group flex flex-col overflow-hidden rounded-2xl bg-sunken transition-colors duration-150 ease-out hover:bg-card-hover active:bg-card-active">
    <div class="relative aspect-video overflow-hidden">
      <img
        v-if="article.cover_url" v-img-fade :src="article.cover_url" :alt="article.title" loading="lazy" referrerpolicy="no-referrer"
        class="size-full object-cover transition-transform duration-500 group-hover:scale-105">
      <div v-else class="grid size-full place-items-center"><ImageIcon :size="28" class="text-faint" /></div>
      <span v-if="article.type" class="absolute left-2.5 top-2.5 rounded-md bg-scrim px-2 py-0.5 text-[11px] font-semibold text-on-media backdrop-blur-sm">
        {{ typeName(article.type) }}
      </span>
      <span v-if="article.featured" class="absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded-md bg-primary px-2 py-0.5 text-[11px] font-semibold text-on-primary">
        <Sparkles :size="11" />{{ t('article_ui.featured') }}
      </span>
    </div>
    <div class="flex flex-1 flex-col p-4">
      <h2 class="mb-2 line-clamp-2 text-sm font-bold leading-snug text-title transition-colors duration-150 ease-out group-hover:text-primary">{{ article.title }}</h2>
      <p class="mb-3 line-clamp-3 flex-1 text-xs leading-relaxed text-meta">{{ article.summary }}</p>
      <div v-if="article.tags.length" class="mb-3 flex flex-wrap gap-1">
        <span v-for="tag in article.tags.slice(0, 3)" :key="tag.id" class="rounded bg-btn px-1.5 py-0.5 text-[11px] text-btn-content">#{{ tagName(tag) }}</span>
      </div>
      <div class="flex items-center gap-2 border-t border-line pt-3 text-xs text-meta">
        <div class="grid size-5 shrink-0 place-items-center overflow-hidden rounded-full bg-primary/10 ring-1 ring-line">
          <img v-if="article.author?.avatar_url" :src="article.author.avatar_url" :alt="article.author.nickname ?? ''" class="size-full object-cover">
          <UserRound v-else :size="11" class="text-primary" />
        </div>
        <span class="truncate font-medium text-meta">{{ article.author?.nickname || article.author?.username }}</span>
        <span class="ml-auto inline-flex shrink-0 items-center gap-1" :title="t('article_ui.likes', { count: article.likes_count })"><Heart :size="11" />{{ article.likes_count }}</span>
        <span class="inline-flex shrink-0 items-center gap-1"><Clock :size="11" />{{ t('article_ui.minutes', { count: minutes }) }}</span>
        <span class="inline-flex shrink-0 items-center gap-1"><Calendar :size="11" />{{ date }}</span>
      </div>
    </div>
  </NuxtLink>
</template>
