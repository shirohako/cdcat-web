<script setup lang="ts">
import { EyeOff, Trash2, UserX } from '@lucide/vue'
import type { DiscussionPost } from '~/types/discussion'

/**
 * A post's text, or the placeholder that stands in for it: folded by a moderator
 * (expandable by its author and moderators), deleted, or from someone the reader
 * blocked (expandable by the reader).
 */
const props = defineProps<{ post: DiscussionPost }>()
const { t } = useI18n()
const { references } = useDiscussionTopic()
const expanded = ref(false)
const env = computed(() => ({ references: references.value }))

const notice = computed(() => {
  if (props.post.status === 'deleted') {
    return { icon: Trash2, text: props.post.removed_by === 'author' ? t('discussions.post.deleted_by_author') : t('discussions.post.deleted_by_moderator') }
  }
  if (props.post.status === 'hidden') {
    const reason = props.post.status_reason === 'auto:reports' ? t('discussions.post.auto_hidden') : props.post.status_reason
    return { icon: EyeOff, text: reason ? t('discussions.post.hidden_reason', { reason }) : t('discussions.post.hidden') }
  }
  if (props.post.blocked) return { icon: UserX, text: t('discussions.post.blocked') }
  return null
})
const canExpand = computed(() => notice.value !== null && props.post.raw !== null)
</script>

<template>
  <div>
    <div v-if="notice" class="flex flex-wrap items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-500">
      <component :is="notice.icon" :size="14" class="shrink-0" />
      <span>{{ notice.text }}</span>
      <button v-if="canExpand" type="button" class="text-xs font-medium text-sky-600 hover:underline" @click="expanded = !expanded">
        {{ expanded ? t('discussions.post.collapse') : t('discussions.post.expand') }}
      </button>
    </div>
    <RichContent v-if="post.raw !== null && (!notice || expanded)" :class="notice ? 'mt-2 opacity-80' : ''" :content="post.raw" format="markdown" :env="env" />
  </div>
</template>
