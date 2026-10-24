<script setup lang="ts">
import { CheckCircle2, Loader2, MessageSquareReply, Quote } from '@lucide/vue'
import type { Pagination } from '~/types/api'
import type { DiscussionPost, DiscussionReferences } from '~/types/discussion'

/**
 * One floor with its sub-replies. The first few sub-replies come with the page;
 * "view all" pages through the rest. Replying opens a compact editor under the floor.
 */
const props = defineProps<{ post: DiscussionPost, replyPage?: number | null }>()
const emit = defineEmits<{ update: [post: DiscussionPost] }>()
const { t } = useI18n()
const { $api } = useNuxtApp()
const { localizeError } = useLocalizedApiError()
const { ago, exact } = useRelativeTime()
const notice = useDiscussionNotice()
const context = useDiscussionTopic()
const topic = context.topic
const editing = ref(false)
const confirmDelete = ref(false)
const composerOpen = ref(false)
const replyTarget = ref<DiscussionPost | null>(null)
const replies = ref<DiscussionPost[]>(props.post.replies ?? [])
const repliesPage = ref<Pagination | null>(null)
const loadingReplies = ref(false)
const isFirst = computed(() => props.post.floor === 1)
const focused = computed(() => context.focusId.value === props.post.id)
const accepted = computed(() => topic.value.accepted_post?.id === props.post.id)
const canAccept = computed(() => topic.value.viewer.can.accept && !isFirst.value)
const shownAll = computed(() => repliesPage.value !== null || replies.value.length >= props.post.replies_count)

watch(() => props.post.replies, (value) => { if (value && repliesPage.value === null) replies.value = value })

async function loadReplies(page = 1) {
  loadingReplies.value = true
  try {
    const response = await $api<{ replies: DiscussionPost[], references: DiscussionReferences, pagination: Pagination }>(`/v1/discussions/posts/${props.post.id}/replies`, { query: { page } })
    context.mergeReferences(response.references)
    replies.value = response.replies
    repliesPage.value = response.pagination
  }
  catch (failure) {
    notice.error(localizeError(failure))
  }
  finally {
    loadingReplies.value = false
  }
}

onMounted(() => {
  // A link to a sub-reply beyond the preview opens the page of replies that holds it.
  if (props.replyPage && context.focusId.value && !replies.value.some(reply => reply.id === context.focusId.value)) void loadReplies(props.replyPage)
})

function openComposer(target: DiscussionPost | null) {
  if (isFirst.value) {
    context.quote(props.post)
    return
  }
  replyTarget.value = target
  composerOpen.value = true
}

function posted(post: DiscussionPost, references: DiscussionReferences) {
  context.mergeReferences(references)
  composerOpen.value = false
  replyTarget.value = null
  replies.value = [...replies.value, post]
  emit('update', { ...props.post, replies_count: props.post.replies_count + 1 })
  notice.success(t('discussions.composer.posted'))
}

function updateReply(updated: DiscussionPost) {
  replies.value = replies.value.map(reply => reply.id === updated.id ? updated : reply)
}

function removeReply(id: number) {
  replies.value = replies.value.filter(reply => reply.id !== id)
  emit('update', { ...props.post, replies_count: Math.max(0, props.post.replies_count - 1) })
}

function saved(post: DiscussionPost, references: DiscussionReferences) {
  context.mergeReferences(references)
  editing.value = false
  emit('update', { ...post, replies: replies.value })
}

async function remove() {
  try {
    await $api(`/v1/discussions/posts/${props.post.id}`, { method: 'DELETE' })
    notice.success(t(isFirst.value ? 'discussions.topic.deleted' : 'discussions.post.deleted'))
    context.removed(props.post, isFirst.value)
  }
  catch (failure) {
    notice.error(localizeError(failure))
  }
}

/** Quotes the selected part of this post when there is a selection inside it, else the whole post. */
function quote() {
  const selection = window.getSelection()
  const inside = selection && !selection.isCollapsed && selection.anchorNode && document.getElementById(`post-${props.post.id}`)?.contains(selection.anchorNode)
  context.quote(props.post, inside ? selection!.toString() : undefined)
}
</script>

<template>
  <article
    :id="`post-${post.id}`" :data-post-id="post.id"
    class="discussion-post card scroll-mt-24 p-4 transition-shadow duration-150 ease-out sm:p-5"
    :class="[focused ? 'ring-2 ring-warning/40' : accepted ? 'ring-1 ring-success/40' : '']"
  >
    <div class="flex gap-3 sm:gap-4">
      <NuxtLink :to="`/profile/${post.user.username}`" class="shrink-0"><DiscussionAvatar :user="post.user" size="lg" /></NuxtLink>
      <div class="min-w-0 flex-1">
        <header class="flex flex-wrap items-center gap-x-2 gap-y-1">
          <NuxtLink :to="`/profile/${post.user.username}`" class="font-semibold text-title transition-colors duration-150 ease-out hover:text-primary">{{ post.user.nickname || post.user.username }}</NuxtLink>
          <span class="text-xs text-meta">@{{ post.user.username }}</span>
          <span v-if="post.user.is_op" class="rounded-md bg-sky-50 px-1.5 py-0.5 text-[11px] font-semibold text-sky-700 dark:bg-sky-400/15 dark:text-sky-300">{{ t('discussions.post.op') }}</span>
          <span v-if="post.user.is_moderator" class="rounded-md bg-indigo-50 px-1.5 py-0.5 text-[11px] font-semibold text-indigo-700 dark:bg-indigo-400/15 dark:text-indigo-300">{{ t('discussions.post.moderator') }}</span>
          <span v-if="accepted" class="inline-flex items-center gap-1 rounded-md bg-success/15 px-1.5 py-0.5 text-[11px] font-semibold text-success"><CheckCircle2 :size="12" />{{ t('discussions.answer.badge') }}</span>
          <span class="ml-auto flex items-center gap-2 text-xs text-meta">
            <NuxtLink :to="`/discussions/${post.topic_id}?post=${post.id}`" class="font-semibold tabular-nums transition-colors duration-150 ease-out hover:text-primary">#{{ post.floor }}</NuxtLink>
            <time :datetime="post.created_at ?? undefined" :title="exact(post.created_at)">{{ ago(post.created_at) }}</time>
            <span v-if="post.edited_at" :title="exact(post.edited_at)">{{ t('discussions.post.edited') }}</span>
            <DiscussionPostMenu :post="post" :can-accept="canAccept" :accepted="accepted" @edit="editing = true" @delete="confirmDelete = true" />
          </span>
        </header>

        <DiscussionPostEditor v-if="editing" class="mt-3" :post="post" :topic-id="post.topic_id" @saved="saved" @cancel="editing = false" />
        <DiscussionPostBody v-else :post="post" class="mt-2" />

        <div v-if="!editing && post.status === 'visible'" class="mt-3 flex flex-wrap items-center gap-2">
          <DiscussionReactions :post-id="post.id" :reactions="post.reactions" :can-react="post.can.react" @update:reactions="value => emit('update', { ...post, reactions: value, replies: replies })" />
          <span class="ml-auto flex items-center gap-1">
            <button v-if="topic.viewer.can.reply" type="button" class="inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs text-meta transition-colors duration-150 ease-out hover:bg-ghost-hover hover:text-primary" @click="quote">
              <Quote :size="13" />{{ t('discussions.post.quote') }}
            </button>
            <button v-if="post.can.reply" type="button" class="inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs text-meta transition-colors duration-150 ease-out hover:bg-ghost-hover hover:text-primary" @click="openComposer(null)">
              <MessageSquareReply :size="13" />{{ t('discussions.post.reply') }}
            </button>
          </span>
        </div>

        <section v-if="!isFirst && (replies.length || composerOpen)" class="mt-3 rounded-xl bg-sunken p-1.5">
          <DiscussionReplyItem v-for="reply in replies" :key="reply.id" :reply="reply" @reply="target => openComposer(target)" @update="updateReply" @removed="removeReply" />
          <div v-if="!shownAll || (repliesPage && repliesPage.last_page > 1)" class="flex items-center gap-3 px-3 py-1.5 text-xs">
            <button v-if="!shownAll" type="button" class="link font-medium" :disabled="loadingReplies" @click="loadReplies(1)">
              <Loader2 v-if="loadingReplies" :size="12" class="inline animate-spin" />{{ t('discussions.post.view_all_replies', { count: post.replies_count }) }}
            </button>
            <CommonPagination v-else-if="repliesPage" :page="repliesPage.current_page" :total-pages="repliesPage.last_page" :disabled="loadingReplies" @update:page="loadReplies" />
          </div>
          <div v-if="composerOpen" class="p-2">
            <DiscussionComposer
              :topic-id="post.topic_id" :parent-id="post.id" variant="compact" autofocus
              :reply-to="replyTarget ? { post_id: replyTarget.id, user: replyTarget.user } : null"
              @posted="posted" @cancel="composerOpen = false; replyTarget = null"
            />
          </div>
        </section>
      </div>
    </div>
    <CommonConfirmDialog v-model="confirmDelete" :title="t('discussions.post.delete_title')" :description="t(isFirst ? 'discussions.post.delete_first_help' : 'discussions.post.delete_floor_help')" @confirm="remove" />
  </article>
</template>
