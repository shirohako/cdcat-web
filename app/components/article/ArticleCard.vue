<script setup lang="ts">
import { Calendar, Clock, ImageIcon, Sparkles, UserRound } from '@lucide/vue'
import type { ArticleCard } from '~/types/article'

/** A published article in a grid: cover, type, title, spoiler-free summary and reading time. */
const props = defineProps<{ article: ArticleCard }>()
const { t, locale } = useI18n()
const { tagName } = useTags()
const href = computed(() => props.article.slug ? `/articles/${props.article.id}/${props.article.slug}` : `/articles/${props.article.id}`)
const minutes = computed(() => Math.max(1, Math.ceil(props.article.word_count / 300)))
const date = computed(() => props.article.published_at ? new Intl.DateTimeFormat(locale.value, { dateStyle: 'medium' }).format(new Date(props.article.published_at)) : '')
</script>

<template>
  <NuxtLink :to="href" class="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
    <div class="relative aspect-video overflow-hidden bg-gray-50">
      <img
        v-if="article.cover_url" :src="article.cover_url" :alt="article.title" loading="lazy" referrerpolicy="no-referrer"
        class="size-full object-cover transition-transform duration-500 group-hover:scale-105">
      <div v-else class="grid size-full place-items-center"><ImageIcon :size="28" class="text-gray-200" /></div>
      <span class="absolute left-2.5 top-2.5 rounded-md bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-slate-700 shadow-sm backdrop-blur">
        {{ t(`article_ui.types.${article.type}`) }}
      </span>
      <span v-if="article.featured" class="absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded-md bg-violet-600/90 px-2 py-0.5 text-[11px] font-semibold text-white shadow-sm">
        <Sparkles :size="11" />{{ t('article_ui.featured') }}
      </span>
    </div>
    <div class="flex flex-1 flex-col p-4">
      <h2 class="mb-2 line-clamp-2 text-sm font-bold leading-snug text-gray-900 transition-colors group-hover:text-violet-600">{{ article.title }}</h2>
      <p class="mb-3 line-clamp-3 flex-1 text-xs leading-relaxed text-gray-500">{{ article.summary }}</p>
      <div v-if="article.tags.length" class="mb-3 flex flex-wrap gap-1">
        <span v-for="tag in article.tags.slice(0, 3)" :key="tag.id" class="rounded bg-slate-50 px-1.5 py-0.5 text-[11px] text-slate-500">#{{ tagName(tag) }}</span>
      </div>
      <div class="flex items-center gap-2 border-t border-gray-50 pt-3 text-xs text-gray-400">
        <div class="grid size-5 shrink-0 place-items-center overflow-hidden rounded-full bg-violet-50 ring-1 ring-gray-100">
          <img v-if="article.author?.avatar_url" :src="article.author.avatar_url" :alt="article.author.nickname ?? ''" class="size-full object-cover">
          <UserRound v-else :size="11" class="text-violet-400" />
        </div>
        <span class="truncate font-medium text-gray-500">{{ article.author?.nickname || article.author?.username }}</span>
        <span class="ml-auto inline-flex shrink-0 items-center gap-1"><Clock :size="11" />{{ t('article_ui.minutes', { count: minutes }) }}</span>
        <span class="inline-flex shrink-0 items-center gap-1"><Calendar :size="11" />{{ date }}</span>
      </div>
    </div>
  </NuxtLink>
</template>
