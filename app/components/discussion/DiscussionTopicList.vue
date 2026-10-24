<script setup lang="ts">
import { MessagesSquare } from '@lucide/vue'
import type { DiscussionTopicCard } from '~/types/discussion'

/** Pinned topics first, then the page of topics; an empty state when there is nothing. */
withDefaults(defineProps<{ topics: DiscussionTopicCard[], pinned?: DiscussionTopicCard[], showCategory?: boolean, empty?: string }>(), { pinned: () => [], showCategory: true, empty: '' })
const { t } = useI18n()
</script>

<template>
  <div>
    <div v-if="pinned.length || topics.length" class="card divide-y divide-line overflow-hidden">
      <DiscussionTopicRow v-for="topic in pinned" :key="`pinned-${topic.id}`" :topic="topic" :show-category="showCategory" class="bg-rose-50/30 dark:bg-rose-400/5" />
      <DiscussionTopicRow v-for="topic in topics" :key="topic.id" :topic="topic" :show-category="showCategory" />
    </div>
    <UiEmpty v-else :title="empty || t('discussions.list.empty')" :icon="MessagesSquare" class="card min-h-64" />
  </div>
</template>
