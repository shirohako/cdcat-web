<script setup lang="ts">
import { Loader2, Send, X } from '@lucide/vue'
import type { DiscussionPost, DiscussionReferences } from '~/types/discussion'

/**
 * Writes a floor (`variant="full"`) or a sub-reply (`compact`, with `parentId`).
 * The text is kept as a local draft until it is posted; Ctrl/Cmd + Enter sends it.
 */
const props = withDefaults(defineProps<{
  topicId: number
  parentId?: number | null
  replyTo?: { post_id: number, user: { username: string, nickname: string | null } | null } | null
  variant?: 'full' | 'compact'
  autofocus?: boolean
}>(), { parentId: null, replyTo: null, variant: 'full', autofocus: false })
const emit = defineEmits<{ posted: [post: DiscussionPost, references: DiscussionReferences, lastFloor: number], cancel: [] }>()
const { t } = useI18n()
const { $api } = useNuxtApp()
const { localizeError } = useLocalizedApiError()
const { formatDate } = useLocaleFormatting()
const { resolveEnv, complete } = useDiscussionAssist(() => props.topicId)
const draftKey = computed(() => props.parentId ? `reply:${props.parentId}` : `topic:${props.topicId}`)
const { value: draft, load, clear } = useDiscussionDraft(draftKey, () => ({ raw: '' }))
const editor = ref<{ insert: (text: string) => void, focus: () => void } | null>(null)
const busy = ref(false)
const error = ref('')
const maxLength = computed(() => props.variant === 'compact' ? 2000 : 20000)

onMounted(() => {
  load()
  if (props.autofocus) nextTick(() => editor.value?.focus())
})

function describe(failure: unknown) {
  const details = (failure as { details?: { details?: Record<string, unknown> } }).details?.details
  const name = (failure as { name?: string }).name
  if (name === 'DISCUSSION_SILENCED') {
    const endsAt = details?.ends_at as string | null | undefined
    return endsAt ? t('discussions.composer.silenced_until', { date: formatDate(endsAt, { dateStyle: 'medium', timeStyle: 'short' }), reason: details?.reason ?? '' }) : t('discussions.composer.silenced_forever', { reason: details?.reason ?? '' })
  }
  if (name === 'RATE_LIMIT_EXCEEDED' && details?.retry_after) return t('discussions.composer.rate_limited', { seconds: details.retry_after })
  if (name === 'VALIDATION_FAILED') return t('discussions.composer.length', { min: 2, max: maxLength.value })
  return localizeError(failure)
}

async function submit() {
  if (busy.value || !draft.value.raw.trim()) return
  busy.value = true
  error.value = ''
  try {
    const response = await $api<{ post: DiscussionPost, references: DiscussionReferences, last_floor_number: number }>(`/v1/discussions/topics/${props.topicId}/posts`, {
      method: 'POST',
      body: { raw: draft.value.raw, parent_id: props.parentId ?? undefined, reply_to_post_id: props.replyTo?.post_id ?? undefined },
    })
    clear()
    emit('posted', response.post, response.references, response.last_floor_number)
  }
  catch (failure) {
    error.value = describe(failure)
  }
  finally {
    busy.value = false
  }
}

/** Inserts text at the cursor, e.g. a quote, and focuses the editor. */
function insert(text: string) {
  editor.value?.insert(text)
}

defineExpose({ insert, focus: () => editor.value?.focus() })
</script>

<template>
  <div :class="variant === 'compact' ? 'space-y-2' : 'space-y-3'">
    <p v-if="replyTo?.user" class="flex items-center gap-1 text-xs text-slate-500">
      {{ t('discussions.composer.replying_to', { name: replyTo.user.nickname || replyTo.user.username }) }}
      <button type="button" class="ml-1 text-slate-400 hover:text-slate-600" :aria-label="t('common.cancel')" @click="emit('cancel')"><X :size="12" /></button>
    </p>
    <ClientOnly>
      <MarkdownEditor
        ref="editor" v-model="draft.raw" :variant="variant" :max-length="maxLength" :resolve-env="resolveEnv" :complete="complete"
        :guide-url="variant === 'full' ? undefined : null" :disabled="busy" :mode="variant === 'full' ? 'split' : 'edit'"
        :placeholder="variant === 'compact' ? t('discussions.composer.reply_placeholder') : t('discussions.composer.floor_placeholder')"
        @submit="submit"
      />
      <template #fallback>
        <div class="rounded-xl border border-slate-200 bg-slate-50" :class="variant === 'compact' ? 'h-28' : 'h-72'" />
      </template>
    </ClientOnly>
    <div class="flex flex-wrap items-center justify-end gap-2">
      <p v-if="error" role="alert" class="mr-auto text-sm text-rose-600">{{ error }}</p>
      <span v-else class="mr-auto hidden text-xs text-slate-400 sm:inline">{{ t('discussions.composer.shortcut') }}</span>
      <button v-if="variant === 'compact'" type="button" class="btn btn-ghost btn-sm" :disabled="busy" @click="emit('cancel')">{{ t('common.cancel') }}</button>
      <button type="button" class="btn btn-primary" :class="variant === 'compact' ? 'btn-sm' : ''" :disabled="busy || !draft.raw.trim()" @click="submit">
        <Loader2 v-if="busy" :size="14" class="animate-spin" /><Send v-else :size="14" />
        {{ variant === 'compact' ? t('discussions.composer.send_reply') : t('discussions.composer.send_floor') }}
      </button>
    </div>
  </div>
</template>
