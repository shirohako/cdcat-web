<template>
  <section class="card overflow-hidden">
    <!-- Header -->
    <UiSectionTitle :title="$t('album.section.articles')" :icon="FileText" class="px-5 pb-2 pt-4">
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
        class="group flex items-center gap-3 px-4 py-3 transition-colors duration-150 ease-out hover:bg-card-hover active:bg-card-active"
      >
        <!-- Cover -->
        <div class="w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-sunken">
          <img
            v-if="article.cover_url"
            :src="article.cover_url"
            :alt="article.title"
            class="w-full h-full object-cover"
          />
          <div v-else class="w-full h-full flex items-center justify-center">
            <FileText :size="18" class="text-faint" />
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

    <!-- Empty state -->
    <div v-else class="flex items-center justify-center gap-3 py-5 px-5">
      <div class="w-8 h-8 rounded-lg bg-sunken flex items-center justify-center shrink-0">
        <FileText :size="15" class="text-faint" />
      </div>
      <div class="text-left">
        <p class="text-sm font-semibold text-meta">{{ $t('album.empty.articles_title') }}</p>
        <p class="text-xs text-meta mt-0.5">{{ $t('album.empty.articles_desc') }}</p>
      </div>
    </div>
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
