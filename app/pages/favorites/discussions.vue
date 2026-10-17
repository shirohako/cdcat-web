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
const { data, pending, refresh } = await useAsyncData('favorite-discussions',
  () => $api<{ bookmarks: Bookmark[], pagination: Pagination }>('/v1/me/discussions/bookmarks', { query: { page: page.value } }), { watch: [page] })
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
    <p v-if="error" role="alert" class="mb-3 text-sm text-rose-600">{{ error }}</p>
    <div v-if="data?.bookmarks.length" class="divide-y divide-gray-100" :class="pending ? 'opacity-60' : ''">
      <div v-for="bookmark in data.bookmarks" :key="bookmark.id" class="flex items-start gap-3 py-3">
        <NuxtLink :to="`/discussions/${bookmark.topic?.id}?post=${bookmark.post.id}`" class="min-w-0 flex-1">
          <p class="text-sm font-semibold text-gray-800 hover:text-sky-700">{{ bookmark.topic?.title }}</p>
          <p class="mt-1 line-clamp-2 text-sm text-gray-600">{{ bookmark.post.excerpt ?? t('discussions.bookmarks.unavailable') }}</p>
          <p class="mt-1 text-xs text-gray-400">
            {{ bookmark.post.user?.nickname || bookmark.post.user?.username }} ·
            {{ bookmark.post.floor ? `#${bookmark.post.floor}` : t('discussions.search.reply_under', { floor: bookmark.post.parent_floor }) }} ·
            {{ t('discussions.bookmarks.saved', { time: ago(bookmark.created_at) }) }}
          </p>
        </NuxtLink>
        <button type="button" class="grid size-8 place-items-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-rose-600" :aria-label="t('discussions.post.unbookmark')" @click="remove(bookmark)">
          <BookmarkX :size="15" />
        </button>
      </div>
    </div>
    <div v-else-if="!pending" class="flex min-h-60 flex-col items-center justify-center text-center">
      <div class="mb-3 grid size-14 place-items-center rounded-2xl bg-gray-50"><MessageCircle :size="26" class="text-gray-300" /></div>
      <p class="text-sm text-gray-400">{{ t('discussions.bookmarks.empty') }}</p>
    </div>
    <CommonPagination v-if="data && data.pagination.last_page > 1" v-model:page="page" class="mt-4" :total-pages="data.pagination.last_page" :disabled="pending" />
  </div>
</template>
