<script setup lang="ts">
import { MessageCircle, PenLine } from '@lucide/vue'
import { markdownQuote } from '~/utils/markdownEditor'
import type { DiscussionPost, DiscussionReferences, DiscussionTopicDetail, DiscussionTopicPage } from '~/types/discussion'

/**
 * An article's comments: the floors of its discussion topic from #2 on, with the
 * same posts, sub-replies, reactions and editor as the topic page. The reactions
 * on floor #1 are the article's reactions. The editor loads only when the reader
 * asks for it (or quotes a post, or has an unsent draft here).
 */
const props = defineProps<{ topicId: number }>()
const { t } = useI18n()
const route = useRoute()
const { $api } = useNuxtApp()
const { isAuthenticated } = useAuth()
const { localizeError } = useLocalizedApiError()
const notice = useDiscussionNotice()
const page = ref(1)
// Comments change too often to show an earlier copy, so no revisit cache.
const { data, pending, status, error, refresh } = await usePageData(`article-comments-${props.topicId}`,
  ({ signal }) => $api<DiscussionTopicPage>(`/v1/discussions/topics/${props.topicId}`, { query: { page: page.value }, signal }), { cache: false, watch: [page] })

// Filled from the data whenever it arrives: during the server render, or later after client-side navigation.
const topic = ref<DiscussionTopicDetail>() as Ref<DiscussionTopicDetail>
const floors = ref<DiscussionPost[]>([])
const references = ref<DiscussionReferences>({})
const focusId = ref<number | null>(null)
watch(data, (value) => {
  if (!value) return
  topic.value = value.topic
  floors.value = value.floors
  references.value = value.references
}, { immediate: true })
// Floor #1 only introduces the article; readers like the article itself instead of reacting to it.
const comments = computed(() => floors.value.filter(floor => floor.floor !== 1))
const composer = ref<{ insert: (text: string) => void } | null>(null)
const composerOpen = ref(false)
// Text to insert once the editor has loaded, e.g. a quote picked before it was open.
const pendingInsert = ref<string[]>([])
watch(composer, (editor) => {
  if (!editor || !pendingInsert.value.length) return
  pendingInsert.value.forEach(text => editor.insert(text))
  pendingInsert.value = []
})
function insertIntoComposer(text: string) {
  if (composer.value) composer.value.insert(text)
  else {
    pendingInsert.value.push(text)
    composerOpen.value = true
  }
}
onMounted(() => {
  // An unsent comment saved in this browser opens the editor right away (see useDiscussionDraft).
  try { if (localStorage.getItem(`cdcat:discussion-draft:topic:${props.topicId}`)) composerOpen.value = true }
  catch { /* storage unavailable */ }
})
const reportPostId = ref<number | null>(null)
const moderating = ref<DiscussionPost | null>(null)

/** Takes a deleted comment off the list. */
function removePost(post: DiscussionPost) {
  floors.value = post.parent_id === null
    ? floors.value.filter(floor => floor.id !== post.id)
    : floors.value.map(floor => floor.id === post.parent_id ? { ...floor, replies: (floor.replies ?? []).filter(reply => reply.id !== post.id), replies_count: Math.max(0, floor.replies_count - 1) } : floor)
  if (post.parent_id === null) topic.value = { ...topic.value, replies_count: Math.max(0, topic.value.replies_count - 1) }
}

function replacePost(post: DiscussionPost) {
  if (post.parent_id === null) {
    floors.value = floors.value.map(floor => floor.id === post.id ? { ...floor, ...post, replies: post.replies ?? floor.replies } : floor)
    return
  }
  floors.value = floors.value.map(floor => floor.id === post.parent_id ? { ...floor, replies: (floor.replies ?? []).map(reply => reply.id === post.id ? post : reply) } : floor)
}

provideDiscussionTopic({
  topic: topic as Ref<DiscussionTopicDetail>,
  references,
  focusId,
  mergeReferences: (incoming) => { references.value = mergeDiscussionReferences(references.value, incoming) },
  quote: (post, selection) => { if (post.raw) insertIntoComposer(markdownQuote(post.id, selection || post.raw)) },
  report: (post) => { reportPostId.value = post.id },
  moderate: (post) => { moderating.value = post },
  accept: async () => {},
  updated: replacePost,
  removed: removePost,
})

async function posted(post: DiscussionPost, incoming: DiscussionReferences, lastFloor: number) {
  references.value = mergeDiscussionReferences(references.value, incoming)
  notice.success(t('discussions.composer.posted'))
  const lastPage = Math.max(1, Math.ceil(lastFloor / (data.value?.pagination.per_page ?? 20)))
  if (page.value === lastPage) floors.value = [...floors.value, { ...post, replies: [] }]
  else page.value = lastPage
  topic.value = { ...topic.value, replies_count: topic.value.replies_count + 1 }
}
</script>

<template>
  <section id="comments" class="scroll-mt-20 space-y-4">
    <!-- The floors are cards of their own, as on the topic page, so the section itself is not one. -->
    <header class="flex flex-wrap items-center gap-2 px-1 pt-2">
      <MessageCircle :size="18" class="text-primary" />
      <h2 class="text-base font-bold text-title">{{ t('discussions.comments.title') }}</h2>
      <span v-if="topic" class="text-sm text-meta">{{ topic.replies_count }}</span>
    </header>
    <template v-if="topic">
      <CommonLoadError v-if="status === 'error'" @retry="refresh()" />
      <div class="space-y-3" :class="pending ? 'opacity-60' : ''">
        <DiscussionFloor v-for="floor in comments" :key="floor.id" :post="floor" @update="replacePost" />
        <p v-if="!comments.length" class="py-6 text-center text-sm text-meta">{{ t('discussions.comments.empty') }}</p>
      </div>
      <CommonPagination v-if="data && data.pagination.last_page > 1" v-model:page="page" :total-pages="data.pagination.last_page" :disabled="pending" />
      <div class="card p-4 sm:p-5">
        <template v-if="topic.viewer.can.reply">
          <LazyDiscussionComposer v-if="composerOpen" ref="composer" :topic-id="topicId" autofocus @posted="posted" @cancel="composerOpen = false" />
          <button
            v-else type="button"
            class="flex w-full items-center gap-2 rounded-xl border border-dashed border-line px-4 py-3 text-left text-sm text-meta transition-colors duration-150 ease-out hover:bg-ghost-hover hover:text-primary"
            @click="composerOpen = true">
            <PenLine :size="15" />{{ t('discussions.comments.write') }}
          </button>
        </template>
        <p v-else-if="!isAuthenticated" class="text-center text-sm text-meta">
          <NuxtLink :to="{ path: '/auth/login', query: { redirect: `${route.path}#comments` } }" class="link font-medium">{{ t('discussions.comments.login') }}</NuxtLink>
        </p>
        <p v-else class="text-center text-sm text-meta">{{ t('discussions.composer.closed') }}</p>
      </div>
    </template>
    <p v-else-if="status === 'error'" class="card p-5 text-sm text-meta">{{ localizeError(error) }}</p>
    <SkeletonStatus v-else class="space-y-3">
      <div v-for="row in 2" :key="row" class="card flex gap-3 p-4">
        <div class="skeleton size-9 shrink-0 rounded-full" />
        <div class="flex-1 space-y-2.5">
          <div class="skeleton h-3 w-24 rounded-full" />
          <div class="skeleton h-3 w-full rounded-full" />
          <div class="skeleton h-3 rounded-full" :class="row === 1 ? 'w-2/3' : 'w-1/2'" />
        </div>
      </div>
    </SkeletonStatus>
    <DiscussionReportDialog :post-id="reportPostId" @close="reportPostId = null" />
    <DiscussionModerationDialog :post="moderating" @close="moderating = null" @updated="replacePost" @removed="removePost" />
  </section>
</template>
