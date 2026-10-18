<script setup lang="ts">
import { ExternalLink, MessageCircle } from '@lucide/vue'
import { markdownQuote } from '~/utils/markdownEditor'
import type { DiscussionPost, DiscussionReferences, DiscussionTopicDetail, DiscussionTopicPage } from '~/types/discussion'

/**
 * An article's comments: the floors of its discussion topic from #2 on, with the
 * same posts, sub-replies, reactions and editor as the topic page. The reactions
 * on floor #1 are the article's reactions.
 */
const props = defineProps<{ topicId: number }>()
const { t } = useI18n()
const route = useRoute()
const { $api } = useNuxtApp()
const { isAuthenticated } = useAuth()
const { localizeError } = useLocalizedApiError()
const notice = useDiscussionNotice()
const page = ref(1)
const { data, pending, error } = await useAsyncData(`article-comments-${props.topicId}`,
  () => $api<DiscussionTopicPage>(`/v1/discussions/topics/${props.topicId}`, { query: { page: page.value } }), { watch: [page] })

const topic = ref<DiscussionTopicDetail>(data.value?.topic as DiscussionTopicDetail)
const floors = ref<DiscussionPost[]>(data.value?.floors ?? [])
const references = ref<DiscussionReferences>(data.value?.references ?? {})
const focusId = ref<number | null>(null)
watch(data, (value) => {
  if (!value) return
  topic.value = value.topic
  floors.value = value.floors
  references.value = value.references
})
const first = computed(() => floors.value.find(floor => floor.floor === 1) ?? null)
const comments = computed(() => floors.value.filter(floor => floor.floor !== 1))
const composer = ref<{ insert: (text: string) => void } | null>(null)
const reportPostId = ref<number | null>(null)
const moderating = ref<DiscussionPost | null>(null)

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
  quote: (post, selection) => { if (post.raw) composer.value?.insert(markdownQuote(post.id, selection || post.raw)) },
  report: (post) => { reportPostId.value = post.id },
  moderate: (post) => { moderating.value = post },
  accept: async () => {},
  updated: replacePost,
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
  <section id="comments" class="space-y-4 rounded-2xl bg-white p-5 shadow-sm">
    <header class="flex flex-wrap items-center gap-2">
      <MessageCircle :size="18" class="text-sky-500" />
      <h2 class="text-base font-bold text-gray-900">{{ t('discussions.comments.title') }}</h2>
      <span v-if="topic" class="text-sm text-gray-400">{{ topic.replies_count }}</span>
      <NuxtLink :to="`/discussions/${topicId}`" class="ml-auto inline-flex items-center gap-1 text-xs text-gray-400 hover:text-sky-700">{{ t('discussions.comments.open_topic') }}<ExternalLink :size="12" /></NuxtLink>
    </header>
    <p v-if="error" class="text-sm text-gray-500">{{ localizeError(error) }}</p>
    <template v-else-if="topic">
      <div v-if="first" class="flex items-center gap-3 border-b border-gray-100 pb-4">
        <span class="text-xs text-gray-400">{{ t('discussions.comments.reactions') }}</span>
        <DiscussionReactions :post-id="first.id" :reactions="first.reactions" :can-react="first.can.react" @update:reactions="value => replacePost({ ...first!, reactions: value })" />
      </div>
      <div class="space-y-3" :class="pending ? 'opacity-60' : ''">
        <DiscussionFloor v-for="floor in comments" :key="floor.id" :post="floor" @update="replacePost" />
        <p v-if="!comments.length" class="py-6 text-center text-sm text-gray-400">{{ t('discussions.comments.empty') }}</p>
      </div>
      <CommonPagination v-if="data && data.pagination.last_page > 1" v-model:page="page" :total-pages="data.pagination.last_page" :disabled="pending" />
      <div class="border-t border-gray-100 pt-4">
        <DiscussionComposer v-if="topic.viewer.can.reply" ref="composer" :topic-id="topicId" @posted="posted" />
        <p v-else-if="!isAuthenticated" class="text-center text-sm text-gray-500">
          <NuxtLink :to="{ path: '/auth/login', query: { redirect: `${route.path}#comments` } }" class="font-medium text-sky-700 hover:underline">{{ t('discussions.comments.login') }}</NuxtLink>
        </p>
        <p v-else class="text-center text-sm text-gray-500">{{ t('discussions.composer.closed') }}</p>
      </div>
    </template>
    <DiscussionReportDialog :post-id="reportPostId" @close="reportPostId = null" />
    <DiscussionModerationDialog :post="moderating" @close="moderating = null" @updated="replacePost" />
  </section>
</template>
