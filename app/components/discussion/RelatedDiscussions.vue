<script setup lang="ts">
import { MessageCircle, MessageSquare, PenSquare } from '@lucide/vue'
import type { ContentLinkType } from '~/types/article'
import type { DiscussionTopicList } from '~/types/discussion'

/** The latest topics linking a piece of content, with a button to start one. */
const props = defineProps<{ type: ContentLinkType, id: number }>()
const { t } = useI18n()
const { $api } = useNuxtApp()
const { isAuthenticated } = useAuth()
const { ago } = useRelativeTime()
const link = computed(() => `${props.type}:${props.id}`)
const { data, loading } = await usePageData(`related-discussions-${link.value}`,
  ({ signal, background }) => $api<DiscussionTopicList>('/v1/discussions/topics', { query: { link: link.value, per_page: 5 }, signal, progress: !background }))
const topics = computed(() => data.value?.topics ?? [])
const total = computed(() => data.value?.pagination.total ?? 0)
const start = computed(() => isAuthenticated.value ? { path: '/discussions/new', query: { link: link.value } } : { path: '/auth/login', query: { redirect: `/discussions/new?link=${link.value}` } })
</script>

<template>
  <section class="card overflow-hidden">
    <UiSectionTitle :title="t('discussions.related.title')" :icon="MessageCircle" :count="total || undefined" class="px-5 pb-2 pt-4">
      <template #actions>
        <NuxtLink :to="start" class="link inline-flex items-center gap-1 text-xs font-medium"><PenSquare :size="12" />{{ t('discussions.related.start') }}</NuxtLink>
      </template>
    </UiSectionTitle>
    <div v-if="topics.length" class="divide-y divide-line">
      <NuxtLink v-for="topic in topics" :key="topic.id" :to="`/discussions/${topic.id}`" class="group flex items-center gap-3 px-4 py-2.5 transition-colors duration-150 ease-out hover:bg-card-hover active:bg-card-active">
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-medium text-title transition-colors duration-150 ease-out group-hover:text-primary">{{ topic.title }}</p>
          <p class="mt-0.5 text-[11px] text-meta">{{ topic.author?.nickname || topic.author?.username }} · {{ ago(topic.bumped_at) }}</p>
        </div>
        <span class="flex shrink-0 items-center gap-1 text-xs tabular-nums text-meta"><MessageSquare :size="12" />{{ topic.replies_count }}</span>
      </NuxtLink>
      <NuxtLink v-if="total > topics.length" :to="{ path: '/discussions', query: {} }" class="block px-4 py-2 text-center text-xs text-meta transition-colors duration-150 ease-out hover:text-primary">{{ t('discussions.related.more', { count: total }) }}</NuxtLink>
    </div>
    <SkeletonStatus v-else-if="loading" class="space-y-3 px-4 py-3">
      <div v-for="row in 2" :key="row" class="space-y-1.5">
        <div class="skeleton h-3.5 rounded-full" :class="row === 1 ? 'w-3/4' : 'w-1/2'" />
        <div class="skeleton h-2.5 w-1/3 rounded-full" />
      </div>
    </SkeletonStatus>
    <p v-else class="px-5 py-4 text-sm text-meta">{{ t('discussions.related.empty') }}</p>
  </section>
</template>
