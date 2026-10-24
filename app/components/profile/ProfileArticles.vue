<script setup lang="ts">
import { Newspaper } from '@lucide/vue'
import type { ArticleCard } from '~/types/article'
import type { Pagination } from '~/types/api'

/** A user's published articles on their profile; hidden when they have none. */
const props = defineProps<{ username: string }>()
const { t } = useI18n()
const { $api } = useNuxtApp()
const { data, revealClass } = await usePageData(() => `profile-articles-${props.username}`,
  ({ signal, background }) => $api<{ articles: ArticleCard[], pagination: Pagination }>('/v1/articles', { query: { user: props.username, per_page: 4 }, signal, progress: !background }))
</script>

<template>
  <section v-if="data?.articles.length" class="card p-5" :class="revealClass">
    <header class="mb-4 flex items-center gap-2">
      <Newspaper :size="16" class="text-primary" />
      <h2 class="text-base font-bold text-title">{{ t('article_ui.profile.title') }}</h2>
      <span class="text-xs text-meta">{{ data.pagination.total }}</span>
      <NuxtLink v-if="data.pagination.total > data.articles.length" :to="{ path: '/articles', query: { user: username } }" class="ml-auto text-xs text-meta transition-colors duration-150 ease-out hover:text-primary">
        {{ t('article_ui.profile.all') }}
      </NuxtLink>
    </header>
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <ArticleCard v-for="article in data.articles" :key="article.id" :article="article" />
    </div>
  </section>
</template>
