<template>
  <section class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
    <!-- Header -->
    <div class="px-5 py-3 border-b border-gray-100 flex items-center gap-2.5">
      <div class="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
        <FileText :size="15" class="text-amber-500" />
      </div>
      <h2 class="text-base font-bold text-gray-900">相关文章</h2>
      <span v-if="articles.length > 0" class="ml-auto text-xs text-gray-400">{{ articles.length }} 篇</span>
    </div>

    <!-- Article list -->
    <div v-if="articles.length > 0" class="divide-y divide-gray-50">
      <NuxtLink
        v-for="article in articles"
        :key="article.id"
        :to="`/articles/${article.id}`"
        class="flex items-center gap-3 px-4 py-3 hover:bg-gray-50/80 transition-colors group"
      >
        <!-- Cover -->
        <div class="w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-gray-100">
          <img
            v-if="article.cover_url"
            :src="article.cover_url"
            :alt="article.title"
            class="w-full h-full object-cover"
          />
          <div v-else class="w-full h-full flex items-center justify-center">
            <FileText :size="18" class="text-gray-300" />
          </div>
        </div>

        <!-- Info -->
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-800 leading-snug line-clamp-2 group-hover:text-amber-600 transition-colors">
            {{ article.title }}
          </p>
          <p v-if="article.published_at" class="text-[11px] text-gray-400 mt-1">
            {{ formatDate(article.published_at) }}
          </p>
        </div>
      </NuxtLink>
    </div>

    <!-- Empty state -->
    <div v-else class="flex items-center justify-center gap-3 py-5 px-5">
      <div class="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
        <FileText :size="15" class="text-amber-300" />
      </div>
      <div class="text-left">
        <p class="text-sm font-semibold text-gray-500">暂无相关文章</p>
        <p class="text-xs text-gray-400 mt-0.5">该作品尚未关联任何文章</p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { WorkArticle } from '~/types/work'
import { FileText } from 'lucide-vue-next'

defineProps<{
  articles: WorkArticle[]
}>()

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr)
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
}
</script>
