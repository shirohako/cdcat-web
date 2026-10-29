<template>
  <section class="card overflow-hidden">
    <!-- Header -->
    <UiSectionTitle :title="$t('album.section.articles')" :icon="FileText" size="sm" class="px-5 pb-2 pt-4 [&_h2]:leading-5">
      <template v-if="articles.length > 0" #actions>
        <span class="text-xs text-meta">{{ $t('content_display.article_count', { count: articles.length }) }}</span>
      </template>
    </UiSectionTitle>

    <!-- Article list -->
    <div v-if="articles.length > 0" class="divide-y divide-line">
      <NuxtLink
        v-for="article in articles"
        :key="article.id"
        :to="`/articles/${article.id}`"
        class="group flex items-center gap-3 px-4 py-3"
      >
        <!-- Cover -->
        <div class="w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-sunken">
          <img
            v-if="article.cover_url"
            :src="article.cover_url"
            :alt="article.title"
            class="w-full h-full object-cover"
          >
          <div v-else class="w-full h-full flex items-center justify-center">
            <FileText :size="18" class="text-meta" />
          </div>
        </div>

        <!-- Info -->
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-title leading-snug line-clamp-2 transition-colors group-hover:text-primary">
            {{ article.title }}
          </p>
          <p v-if="article.published_at" class="text-[11px] text-meta mt-1">
            {{ formatDate(article.published_at) }}
          </p>
        </div>
      </NuxtLink>
    </div>

    <CatalogEmptyLine v-else :icon="FileText" :text="$t('album.empty.articles_title')" size="sm" />
  </section>
</template>

<script setup lang="ts">
import type { AlbumArticle } from '~/types/album'
import { FileText } from '@lucide/vue'

defineProps<{
  articles: AlbumArticle[]
}>()

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr)
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
}
</script>
