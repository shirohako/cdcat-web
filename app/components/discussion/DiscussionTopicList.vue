<script setup lang="ts">
import { MessagesSquare } from '@lucide/vue'
import type { DiscussionTopicCard } from '~/types/discussion'

/** Pinned topics first, then the page of topics; an empty state when there is nothing. */
withDefaults(defineProps<{ topics: DiscussionTopicCard[], pinned?: DiscussionTopicCard[], showCategory?: boolean, empty?: string }>(), { pinned: () => [], showCategory: true, empty: '' })
const { t } = useI18n()
</script>

<template>
  <div>
    <div v-if="pinned.length || topics.length" class="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200/80 bg-white">
      <DiscussionTopicRow v-for="topic in pinned" :key="`pinned-${topic.id}`" :topic="topic" :show-category="showCategory" class="bg-rose-50/30" />
      <DiscussionTopicRow v-for="topic in topics" :key="topic.id" :topic="topic" :show-category="showCategory" />
    </div>
    <div v-else class="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white text-center">
      <div class="mb-3 grid size-14 place-items-center rounded-2xl bg-slate-50"><MessagesSquare :size="26" class="text-slate-300" /></div>
      <p class="text-sm text-slate-400">{{ empty || t('discussions.list.empty') }}</p>
    </div>
  </div>
</template>
