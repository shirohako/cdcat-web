<script setup lang="ts">
import { CheckCircle2, Eye, Lock, MessageSquare, Pin, Star } from '@lucide/vue'
import type { DiscussionTopicCard } from '~/types/discussion'

/** One row of a topic list: status, title, category and tags, the author, counts and the last reply. */
const props = withDefaults(defineProps<{ topic: DiscussionTopicCard, showCategory?: boolean }>(), { showCategory: true })
const { t } = useI18n()
const { tagName } = useTags()
const { ago, exact } = useRelativeTime()
const unread = computed(() => props.topic.viewer?.visited ? props.topic.viewer.unread_count : 0)
const isNew = computed(() => props.topic.viewer !== undefined && !props.topic.viewer.visited)
const href = computed(() => unread.value ? `/discussions/${props.topic.id}?unread=1` : `/discussions/${props.topic.id}`)
const compact = (value: number) => value >= 10000 ? `${(value / 1000).toFixed(value >= 100000 ? 0 : 1)}k` : String(value)
</script>

<template>
  <article class="group flex items-start gap-3 px-3 py-3.5 transition-colors hover:bg-slate-50/80 sm:px-4">
    <NuxtLink :to="topic.author ? `/profile/${topic.author.username}` : undefined" class="mt-0.5 hidden sm:block" :aria-label="topic.author?.nickname || topic.author?.username">
      <DiscussionAvatar :user="topic.author" />
    </NuxtLink>
    <div class="min-w-0 flex-1">
      <h3 class="flex items-start gap-1.5 text-[15px] leading-snug">
        <span class="mt-0.5 flex shrink-0 items-center gap-1">
          <Pin v-if="topic.pinned" :size="14" class="text-rose-500" :aria-label="t('discussions.status.pinned')" />
          <Star v-if="topic.featured" :size="14" class="fill-amber-400 text-amber-400" :aria-label="t('discussions.status.featured')" />
          <Lock v-if="topic.locked" :size="14" class="text-slate-400" :aria-label="t('discussions.status.locked')" />
          <CheckCircle2 v-if="topic.solved" :size="14" class="text-emerald-500" :aria-label="t('discussions.status.solved')" />
        </span>
        <NuxtLink :to="href" class="min-w-0 font-semibold text-slate-900 transition-colors group-hover:text-sky-700" :class="topic.viewer?.visited && !unread ? 'text-slate-600' : ''">
          {{ topic.title }}
        </NuxtLink>
        <span v-if="unread" class="mt-0.5 shrink-0 rounded-full bg-sky-500 px-1.5 text-[11px] font-semibold leading-4 text-white" :title="t('discussions.list.unread_count', { count: unread })">{{ unread }}</span>
        <span v-else-if="isNew" class="mt-1 size-2 shrink-0 rounded-full bg-sky-400" :title="t('discussions.list.new_topic')" />
      </h3>
      <p v-if="topic.excerpt" class="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{{ topic.excerpt }}</p>
      <div class="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
        <DiscussionCategoryBadge v-if="showCategory" :category="topic.category" />
        <NuxtLink v-for="tag in topic.tags" :key="tag.id" :to="`/discussions/tags/${tag.slug}`" class="text-slate-400 hover:text-sky-700">#{{ tagName(tag) }}</NuxtLink>
        <span class="text-slate-400">
          <NuxtLink v-if="topic.author" :to="`/profile/${topic.author.username}`" class="hover:text-slate-700">{{ topic.author.nickname || topic.author.username }}</NuxtLink>
          · <time :datetime="topic.created_at ?? undefined" :title="exact(topic.created_at)">{{ ago(topic.created_at) }}</time>
        </span>
      </div>
    </div>
    <div class="hidden shrink-0 items-center gap-5 text-right sm:flex">
      <div class="w-12">
        <p class="flex items-center justify-end gap-1 text-sm font-semibold tabular-nums text-slate-700"><MessageSquare :size="13" class="text-slate-300" />{{ compact(topic.replies_count) }}</p>
        <p class="flex items-center justify-end gap-1 text-[11px] tabular-nums text-slate-400"><Eye :size="11" />{{ compact(topic.views_count) }}</p>
      </div>
      <NuxtLink :to="topic.last_post_id && topic.replies_count ? `/discussions/${topic.id}?post=${topic.last_post_id}` : `/discussions/${topic.id}`" class="flex w-28 items-center justify-end gap-2" :title="exact(topic.last_posted_at)">
        <span class="min-w-0 text-right">
          <span class="block truncate text-xs font-medium text-slate-600">{{ topic.last_poster?.nickname || topic.last_poster?.username }}</span>
          <span class="block text-[11px] text-slate-400">{{ ago(topic.bumped_at) }}</span>
        </span>
        <DiscussionAvatar :user="topic.last_poster" size="sm" />
      </NuxtLink>
    </div>
    <div class="flex shrink-0 flex-col items-end text-[11px] text-slate-400 sm:hidden">
      <span class="flex items-center gap-0.5 font-semibold text-slate-600"><MessageSquare :size="11" />{{ compact(topic.replies_count) }}</span>
      <span>{{ ago(topic.bumped_at) }}</span>
    </div>
  </article>
</template>
