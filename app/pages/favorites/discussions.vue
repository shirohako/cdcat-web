<script setup lang="ts">
import { BookmarkX, MessageCircle } from '@lucide/vue'
import type { Pagination } from '~/types/article'
import type { DiscussionPostSummary } from '~/types/discussion'

/** Posts the user bookmarked in discussions. */
const { t } = useI18n()
const { $api } = useNuxtApp()
const { localizeError } = useLocalizedApiError()
const { ago } = useRelativeTime()
const page = ref(1)
type Bookmark = { id: number, created_at: string, post: DiscussionPostSummary, topic: DiscussionPostSummary['topic'] }
// The reader's own bookmarks: always fetched fresh (no revisit cache).
const { data, status, refresh, loading, refetching } = await usePageData(() => `favorite-discussions-${page.value}`,
  ({ signal }) => $api<{ bookmarks: Bookmark[], pagination: Pagination }>('/v1/me/discussions/bookmarks', { query: { page: page.value }, signal }),
  { cache: false })
const error = ref('')

async function remove(bookmark: Bookmark) {
  try {
    await $api(`/v1/discussions/posts/${bookmark.post.id}/bookmark`, { method: 'DELETE' })
    await refresh()
  }
  catch (failure) {
    error.value = localizeError(failure)
  }
}
</script>

<template>
  <div class="p-4 sm:p-6">
    <p v-if="error" role="alert" class="mb-3 text-sm text-danger">{{ error }}</p>
    <CommonLoadError v-if="status === 'error'" class="mb-3" @retry="refresh()" />
    <SkeletonStatus v-if="loading" page class="divide-y divide-line">
      <div v-for="row in 5" :key="row" class="space-y-2 py-3">
        <div class="skeleton h-3.5 rounded-full" :class="['w-2/5', 'w-1/2', 'w-1/3', 'w-3/5', 'w-2/5'][row - 1]" />
        <div class="skeleton h-3 w-4/5 rounded-full" />
        <div class="skeleton h-2.5 w-1/4 rounded-full" />
      </div>
    </SkeletonStatus>
    <div v-else-if="data?.bookmarks.length" class="divide-y divide-line transition-opacity" :class="{ 'pointer-events-none opacity-60': refetching }" :inert="refetching">
      <div v-for="bookmark in data.bookmarks" :key="bookmark.id" class="flex items-start gap-3 py-3">
        <NuxtLink :to="`/discussions/${bookmark.topic?.id}?post=${bookmark.post.id}`" class="min-w-0 flex-1">
          <p class="text-sm font-semibold text-title transition-colors hover:text-primary">{{ bookmark.topic?.title }}</p>
          <p class="mt-1 line-clamp-2 text-sm text-body">{{ bookmark.post.excerpt ?? t('discussions.bookmarks.unavailable') }}</p>
          <p class="mt-1 text-xs text-meta">
            {{ bookmark.post.user?.nickname || bookmark.post.user?.username }} ·
            {{ bookmark.post.floor ? `#${bookmark.post.floor}` : t('discussions.search.reply_under', { floor: bookmark.post.parent_floor }) }} ·
            {{ t('discussions.bookmarks.saved', { time: ago(bookmark.created_at) }) }}
          </p>
        </NuxtLink>
        <button type="button" class="grid size-8 place-items-center rounded-lg text-meta transition-colors duration-150 ease-out hover:bg-ghost-hover hover:text-danger" :aria-label="t('discussions.post.unbookmark')" @click="remove(bookmark)">
          <BookmarkX :size="15" />
        </button>
      </div>
    </div>
    <UiEmpty v-else-if="status !== 'error'" class="min-h-60" :title="t('discussions.bookmarks.empty')" :icon="MessageCircle" />
    <CommonPagination v-if="data && data.pagination.last_page > 1" v-model:page="page" class="mt-4" :total-pages="data.pagination.last_page" :disabled="refetching" />
  </div>
</template>
