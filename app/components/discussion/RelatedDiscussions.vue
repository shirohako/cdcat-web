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
const { data } = await useAsyncData(`related-discussions-${link.value}`,
  () => $api<DiscussionTopicList>('/v1/discussions/topics', { query: { link: link.value, per_page: 5 } }),
  { default: () => null })
const topics = computed(() => data.value?.topics ?? [])
const total = computed(() => data.value?.pagination.total ?? 0)
const start = computed(() => isAuthenticated.value ? { path: '/discussions/new', query: { link: link.value } } : { path: '/auth/login', query: { redirect: `/discussions/new?link=${link.value}` } })
</script>

<template>
  <section class="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
    <div class="flex items-center gap-2.5 border-b border-gray-100 px-5 py-3">
      <div class="grid size-8 shrink-0 place-items-center rounded-lg bg-sky-50"><MessageCircle :size="15" class="text-sky-500" /></div>
      <h2 class="text-base font-bold text-gray-900">{{ t('discussions.related.title') }}</h2>
      <span v-if="total" class="text-xs text-gray-400">{{ total }}</span>
      <NuxtLink :to="start" class="ml-auto inline-flex items-center gap-1 text-xs font-medium text-sky-700 hover:underline"><PenSquare :size="12" />{{ t('discussions.related.start') }}</NuxtLink>
    </div>
    <div v-if="topics.length" class="divide-y divide-gray-50">
      <NuxtLink v-for="topic in topics" :key="topic.id" :to="`/discussions/${topic.id}`" class="group flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-gray-50/80">
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-medium text-gray-800 group-hover:text-sky-700">{{ topic.title }}</p>
          <p class="mt-0.5 text-[11px] text-gray-400">{{ topic.author?.nickname || topic.author?.username }} · {{ ago(topic.bumped_at) }}</p>
        </div>
        <span class="flex shrink-0 items-center gap-1 text-xs tabular-nums text-gray-400"><MessageSquare :size="12" />{{ topic.replies_count }}</span>
      </NuxtLink>
      <NuxtLink v-if="total > topics.length" :to="{ path: '/discussions', query: {} }" class="block px-4 py-2 text-center text-xs text-gray-400 hover:text-sky-700">{{ t('discussions.related.more', { count: total }) }}</NuxtLink>
    </div>
    <p v-else class="px-5 py-4 text-sm text-gray-400">{{ t('discussions.related.empty') }}</p>
  </section>
</template>
