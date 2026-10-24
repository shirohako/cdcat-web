<script setup lang="ts">
import { Reply } from '@lucide/vue'
import type { DiscussionPost, DiscussionReferences } from '~/types/discussion'

/** One sub-reply under a floor. */
const props = defineProps<{ reply: DiscussionPost }>()
const emit = defineEmits<{ reply: [target: DiscussionPost], update: [post: DiscussionPost], removed: [id: number] }>()
const { t } = useI18n()
const { $api } = useNuxtApp()
const { localizeError } = useLocalizedApiError()
const { ago, exact } = useRelativeTime()
const notice = useDiscussionNotice()
const context = useDiscussionTopic()
const editing = ref(false)
const confirmDelete = ref(false)
const focused = computed(() => context.focusId.value === props.reply.id)

function saved(post: DiscussionPost, references: DiscussionReferences) {
  context.mergeReferences(references)
  editing.value = false
  emit('update', { ...post, replies: undefined })
}

async function remove() {
  try {
    await $api(`/v1/discussions/posts/${props.reply.id}`, { method: 'DELETE' })
    emit('removed', props.reply.id)
    notice.success(t('discussions.post.deleted'))
  }
  catch (failure) {
    notice.error(localizeError(failure))
  }
}
</script>

<template>
  <div :id="`post-${reply.id}`" :data-post-id="reply.id" class="discussion-post scroll-mt-24 rounded-lg px-3 py-2.5 transition-colors" :class="focused ? 'bg-warning/10 ring-1 ring-warning/30' : ''">
    <div class="flex items-start gap-2.5">
      <NuxtLink :to="`/profile/${reply.user.username}`" class="mt-0.5"><DiscussionAvatar :user="reply.user" size="sm" /></NuxtLink>
      <div class="min-w-0 flex-1">
        <div class="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs">
          <NuxtLink :to="`/profile/${reply.user.username}`" class="font-semibold text-title transition-colors duration-150 ease-out hover:text-primary">{{ reply.user.nickname || reply.user.username }}</NuxtLink>
          <span v-if="reply.user.is_op" class="rounded bg-sky-50 px-1 text-[10px] font-semibold text-sky-700 dark:bg-sky-400/15 dark:text-sky-300">{{ t('discussions.post.op') }}</span>
          <span v-if="reply.user.is_moderator" class="rounded bg-indigo-50 px-1 text-[10px] font-semibold text-indigo-700 dark:bg-indigo-400/15 dark:text-indigo-300">{{ t('discussions.post.moderator') }}</span>
          <template v-if="reply.reply_to?.user">
            <span class="text-meta">{{ t('discussions.post.replied_to') }}</span>
            <NuxtLink :to="`/profile/${reply.reply_to.user.username}`" class="link font-medium">@{{ reply.reply_to.user.nickname || reply.reply_to.user.username }}</NuxtLink>
          </template>
          <span class="text-meta">·</span>
          <NuxtLink :to="`/discussions/${reply.topic_id}?post=${reply.id}`" class="text-meta transition-colors duration-150 ease-out hover:text-primary" :title="exact(reply.created_at)">{{ ago(reply.created_at) }}</NuxtLink>
          <span v-if="reply.edited_at" class="text-meta" :title="exact(reply.edited_at)">{{ t('discussions.post.edited') }}</span>
          <span class="ml-auto"><DiscussionPostMenu :post="reply" @edit="editing = true" @delete="confirmDelete = true" /></span>
        </div>
        <DiscussionPostEditor v-if="editing" class="mt-2" :post="reply" :topic-id="reply.topic_id" @saved="saved" @cancel="editing = false" />
        <DiscussionPostBody v-else :post="reply" class="mt-1 text-[13px]" />
        <div v-if="!editing && reply.status === 'visible'" class="mt-1.5 flex flex-wrap items-center gap-2">
          <DiscussionReactions :post-id="reply.id" :reactions="reply.reactions" :can-react="reply.can.react" compact @update:reactions="value => emit('update', { ...reply, reactions: value })" />
          <button v-if="context.topic.value.viewer.can.reply" type="button" class="inline-flex items-center gap-1 text-xs text-meta transition-colors duration-150 ease-out hover:text-primary" @click="emit('reply', reply)">
            <Reply :size="12" />{{ t('discussions.post.reply') }}
          </button>
        </div>
      </div>
    </div>
    <CommonConfirmDialog v-model="confirmDelete" :title="t('discussions.post.delete_title')" :description="t('discussions.post.delete_reply_help')" @confirm="remove" />
  </div>
</template>
