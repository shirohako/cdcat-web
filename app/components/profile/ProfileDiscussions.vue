<script setup lang="ts">
import { MessageCircle, MessageSquare } from '@lucide/vue'
import type { Pagination } from '~/types/api'
import type { DiscussionPostSummary, DiscussionTopicCard } from '~/types/discussion'

/** A user's discussion topics and replies on their profile, in two tabs. */
const props = defineProps<{ username: string, topicsCount?: number, postsCount?: number }>()
const { t } = useI18n()
const { $api } = useNuxtApp()
const { ago } = useRelativeTime()
const tab = ref<'topics' | 'posts'>('topics')
const page = ref(1)
watch(tab, () => { page.value = 1 })

type Page = { topics?: DiscussionTopicCard[], posts?: DiscussionPostSummary[], pagination: Pagination }
const { data, loading, refetching } = await usePageData<Page>(() => `profile-discussions-${props.username}-${tab.value}-${page.value}`,
  ({ signal, background }) => $api<Page>(`/v1/profiles/${props.username}/discussions/${tab.value}`, { query: { page: page.value, per_page: 10 }, signal, progress: !background }))
const topics = computed(() => data.value?.topics ?? [])
const posts = computed(() => data.value?.posts ?? [])
</script>

<template>
  <section v-if="(topicsCount ?? 0) + (postsCount ?? 0) > 0 || topics.length || posts.length" class="card p-5">
    <header class="mb-3 flex flex-wrap items-center gap-2">
      <MessageCircle :size="16" class="text-primary" />
      <h2 class="text-base font-bold text-title">{{ t('discussions.profile.title') }}</h2>
      <nav class="ml-auto flex gap-1">
        <button
          v-for="value in ['topics', 'posts'] as const" :key="value" type="button" class="rounded-lg px-2.5 py-1 text-xs font-medium transition-colors duration-150 ease-out"
          :class="tab === value ? 'bg-primary text-on-primary' : 'text-meta hover:bg-ghost-hover hover:text-primary'" @click="tab = value"
        >
          {{ t(`discussions.profile.${value}`, { count: value === 'topics' ? topicsCount ?? 0 : postsCount ?? 0 }) }}
        </button>
      </nav>
    </header>
    <SkeletonStatus v-if="loading" class="divide-y divide-line">
      <div v-for="row in 3" :key="row" class="space-y-1.5 py-2.5">
        <div class="skeleton h-3.5 rounded-full" :class="['w-3/5', 'w-2/3', 'w-1/2'][row - 1]" />
        <div class="skeleton h-2.5 w-1/4 rounded-full" />
      </div>
    </SkeletonStatus>
    <div v-else class="transition-opacity" :class="{ 'pointer-events-none opacity-60': refetching }" :inert="refetching">
      <div v-if="tab === 'topics'" class="divide-y divide-line">
        <NuxtLink v-for="topic in topics" :key="topic.id" :to="`/discussions/${topic.id}`" class="group flex items-center gap-3 py-2.5">
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium text-title transition-colors group-hover:text-primary">{{ topic.title }}</p>
            <p class="mt-0.5 flex items-center gap-2 text-[11px] text-meta"><DiscussionCategoryBadge :category="topic.category" :link="false" />{{ ago(topic.created_at) }}</p>
          </div>
          <span class="flex shrink-0 items-center gap-1 text-xs tabular-nums text-meta"><MessageSquare :size="12" />{{ topic.replies_count }}</span>
        </NuxtLink>
        <p v-if="!topics.length" class="py-6 text-center text-sm text-meta">{{ t('discussions.profile.no_topics') }}</p>
      </div>
      <div v-else class="divide-y divide-line">
        <NuxtLink v-for="post in posts" :key="post.id" :to="`/discussions/${post.topic?.id}?post=${post.id}`" class="group block py-2.5">
          <p class="line-clamp-2 text-sm text-body">{{ post.excerpt }}</p>
          <p class="mt-1 truncate text-[11px] text-meta">{{ t('discussions.profile.in_topic', { title: post.topic?.title }) }} · {{ ago(post.created_at) }}</p>
        </NuxtLink>
        <p v-if="!posts.length" class="py-6 text-center text-sm text-meta">{{ t('discussions.profile.no_posts') }}</p>
      </div>
      <CommonPagination v-if="data && data.pagination.last_page > 1" v-model:page="page" class="mt-3" :total-pages="data.pagination.last_page" :disabled="refetching" />
    </div>
  </section>
</template>
