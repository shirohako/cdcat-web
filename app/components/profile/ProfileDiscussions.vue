<script setup lang="ts">
import { MessageCircle, MessageSquare } from '@lucide/vue'
import type { Pagination } from '~/types/article'
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
const { data, pending } = await useAsyncData<Page>(() => `profile-discussions-${props.username}-${tab.value}-${page.value}`,
  () => $api<Page>(`/v1/profiles/${props.username}/discussions/${tab.value}`, { query: { page: page.value, per_page: 10 } }),
  { watch: [tab, page, () => props.username] })
const topics = computed(() => data.value?.topics ?? [])
const posts = computed(() => data.value?.posts ?? [])
</script>

<template>
  <section v-if="(topicsCount ?? 0) + (postsCount ?? 0) > 0 || topics.length || posts.length" class="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
    <header class="mb-3 flex flex-wrap items-center gap-2">
      <MessageCircle :size="16" class="text-sky-500" />
      <h2 class="text-base font-bold text-gray-900">{{ t('discussions.profile.title') }}</h2>
      <nav class="ml-auto flex gap-1">
        <button
          v-for="value in ['topics', 'posts'] as const" :key="value" type="button" class="rounded-lg px-2.5 py-1 text-xs font-medium transition"
          :class="tab === value ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'" @click="tab = value"
        >
          {{ t(`discussions.profile.${value}`, { count: value === 'topics' ? topicsCount ?? 0 : postsCount ?? 0 }) }}
        </button>
      </nav>
    </header>
    <div :class="pending ? 'opacity-60' : ''">
      <div v-if="tab === 'topics'" class="divide-y divide-gray-50">
        <NuxtLink v-for="topic in topics" :key="topic.id" :to="`/discussions/${topic.id}`" class="group flex items-center gap-3 py-2.5">
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium text-gray-800 group-hover:text-sky-700">{{ topic.title }}</p>
            <p class="mt-0.5 flex items-center gap-2 text-[11px] text-gray-400"><DiscussionCategoryBadge :category="topic.category" :link="false" />{{ ago(topic.created_at) }}</p>
          </div>
          <span class="flex shrink-0 items-center gap-1 text-xs tabular-nums text-gray-400"><MessageSquare :size="12" />{{ topic.replies_count }}</span>
        </NuxtLink>
        <p v-if="!topics.length" class="py-6 text-center text-sm text-gray-400">{{ t('discussions.profile.no_topics') }}</p>
      </div>
      <div v-else class="divide-y divide-gray-50">
        <NuxtLink v-for="post in posts" :key="post.id" :to="`/discussions/${post.topic?.id}?post=${post.id}`" class="group block py-2.5">
          <p class="line-clamp-2 text-sm text-gray-700">{{ post.excerpt }}</p>
          <p class="mt-1 truncate text-[11px] text-gray-400">{{ t('discussions.profile.in_topic', { title: post.topic?.title }) }} · {{ ago(post.created_at) }}</p>
        </NuxtLink>
        <p v-if="!posts.length" class="py-6 text-center text-sm text-gray-400">{{ t('discussions.profile.no_posts') }}</p>
      </div>
      <CommonPagination v-if="data && data.pagination.last_page > 1" v-model:page="page" class="mt-3" :total-pages="data.pagination.last_page" :disabled="pending" />
    </div>
  </section>
</template>
