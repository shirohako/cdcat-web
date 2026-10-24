<script setup lang="ts">
import { EyeOff, UserX } from '@lucide/vue'
import type { DiscussionPost, DiscussionReferences } from '~/types/discussion'

/**
 * A post's text, or the placeholder that stands in for it: folded by a moderator or by
 * reports, or from someone the reader blocked. Anyone may open a folded post after a warning;
 * its text is fetched only then, so it stays out of the page. The author and moderators
 * already have the text, and blocked posts open without a warning. Deleted posts never get here.
 */
const props = defineProps<{ post: DiscussionPost }>()
const { t } = useI18n()
const { $api } = useNuxtApp()
const { localizeError } = useLocalizedApiError()
const { references } = useDiscussionTopic()
const expanded = ref(false)

const notice = computed(() => {
  if (props.post.status === 'hidden') {
    const reason = props.post.status_reason === 'auto:reports' ? t('discussions.post.auto_hidden') : props.post.status_reason
    return { icon: EyeOff, text: reason ? t('discussions.post.hidden_reason', { reason }) : t('discussions.post.hidden') }
  }
  if (props.post.blocked) return { icon: UserX, text: t('discussions.post.blocked') }
  return null
})

// A folded post's text, fetched after the reader confirms the warning.
const revealed = ref<{ raw: string, references: DiscussionReferences } | null>(null)
const raw = computed(() => props.post.raw ?? revealed.value?.raw ?? null)
const env = computed(() => {
  const extra = revealed.value?.references
  if (!extra) return { references: references.value }
  const merged: DiscussionReferences = { ...references.value }
  for (const [group, items] of Object.entries(extra)) {
    Object.assign(merged, { [group]: { ...(merged[group as keyof DiscussionReferences] ?? {}), ...items } })
  }
  return { references: merged }
})

const canExpand = computed(() => notice.value !== null && (raw.value !== null || props.post.status === 'hidden'))
const warningOpen = ref(false)
const revealing = ref(false)
const revealError = ref('')

function toggle() {
  if (expanded.value) expanded.value = false
  else if (raw.value !== null) expanded.value = true
  else warningOpen.value = true
}

async function reveal() {
  revealing.value = true
  revealError.value = ''
  try {
    revealed.value = await $api<{ raw: string, references: DiscussionReferences }>(`/v1/discussions/posts/${props.post.id}/reveal`)
    expanded.value = true
  }
  catch (failure) { revealError.value = localizeError(failure) }
  finally { revealing.value = false }
}
</script>

<template>
  <div>
    <div v-if="notice" class="flex flex-wrap items-center gap-2 rounded-lg bg-sunken px-3 py-2 text-sm text-meta">
      <component :is="notice.icon" :size="14" class="shrink-0" />
      <span>{{ notice.text }}</span>
      <button v-if="canExpand" type="button" class="link text-xs font-medium disabled:opacity-50" :disabled="revealing" @click="toggle">
        {{ expanded ? t('discussions.post.collapse') : t('discussions.post.expand') }}
      </button>
      <span v-if="revealError" class="text-xs text-danger">{{ revealError }}</span>
    </div>
    <RichContent v-if="raw !== null && (!notice || expanded)" :class="notice ? 'mt-2 opacity-80' : ''" :content="raw" format="markdown" :env="env" />
    <CommonConfirmDialog
      v-model="warningOpen" variant="warning" :title="t('discussions.post.reveal_title')"
      :description="t('discussions.post.reveal_description', { reason: notice?.text ?? '' })"
      :confirm-text="t('discussions.post.reveal_confirm')" @confirm="reveal" />
  </div>
</template>
