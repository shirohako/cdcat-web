<script setup lang="ts">
import { FileText } from '@lucide/vue'
import type { ArticleCard, ContentLinkType } from '~/types/article'

/** Published articles linking a piece of content; renders nothing when there are none. */
const props = defineProps<{ type: ContentLinkType, id: number }>()
const { t } = useI18n()
const { $api } = useNuxtApp()
const { formatDate } = useLocaleFormatting()
const { data: articles } = await useAsyncData(`related-articles-${props.type}-${props.id}`,
  () => $api<{ articles: ArticleCard[] }>('/v1/articles', { query: { link: `${props.type}:${props.id}`, per_page: 5 } }).then(response => response.articles),
  { default: () => [] as ArticleCard[] })
</script>

<template>
  <section v-if="articles.length" class="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
    <div class="flex items-center gap-2.5 border-b border-gray-100 px-5 py-3">
      <div class="grid size-8 shrink-0 place-items-center rounded-lg bg-amber-50"><FileText :size="15" class="text-amber-500" /></div>
      <h2 class="text-base font-bold text-gray-900">{{ t('article_ui.related.title') }}</h2>
      <NuxtLink :to="{ path: '/articles', query: {} }" class="ml-auto text-xs text-gray-400 hover:text-violet-600">{{ t('article_ui.related.all') }}</NuxtLink>
    </div>
    <div class="divide-y divide-gray-50">
      <NuxtLink
        v-for="article in articles" :key="article.id" :to="article.slug ? `/articles/${article.id}/${article.slug}` : `/articles/${article.id}`"
        class="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50/80">
        <div class="size-14 shrink-0 overflow-hidden rounded-lg bg-gray-100">
          <img v-if="article.cover_url" :src="article.cover_url" :alt="article.title" class="size-full object-cover" loading="lazy" referrerpolicy="no-referrer">
          <div v-else class="grid size-full place-items-center"><FileText :size="18" class="text-gray-300" /></div>
        </div>
        <div class="min-w-0 flex-1">
          <p class="line-clamp-2 text-sm font-medium leading-snug text-gray-800 transition-colors group-hover:text-amber-600">{{ article.title }}</p>
          <p class="mt-1 text-[11px] text-gray-400">{{ t(`article_ui.types.${article.type}`) }}<template v-if="article.published_at"> · {{ formatDate(article.published_at) }}</template></p>
        </div>
      </NuxtLink>
    </div>
  </section>
</template>
