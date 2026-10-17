<script setup lang="ts">
import { Loader2 } from '@lucide/vue'
import type { DiscussionPost } from '~/types/discussion'

type Action = 'hide' | 'unhide' | 'delete' | 'restore' | 'edit' | 'silence'

/**
 * A moderator's actions on one post: fold or unfold it, delete or restore it, edit
 * it with a reason, or silence its author. Reasons reach the author with a notice.
 */
const props = defineProps<{ post: DiscussionPost | null }>()
const emit = defineEmits<{ close: [], updated: [post: DiscussionPost] }>()
const { t } = useI18n()
const { $api } = useNuxtApp()
const { localizeError } = useLocalizedApiError()
const notice = useDiscussionNotice()
const open = computed({ get: () => props.post !== null, set: (value) => { if (!value) emit('close') } })
const action = ref<Action>('hide')
const reason = ref('')
const raw = ref('')
const days = ref<number | null>(3)
const busy = ref(false)
const error = ref('')

const actions = computed<Action[]>(() => {
  if (!props.post) return []
  const list: Action[] = []
  if (props.post.status === 'visible') list.push('hide')
  if (props.post.status === 'hidden') list.push('unhide')
  if (props.post.status !== 'deleted') list.push('delete', 'edit')
  if (props.post.status !== 'visible') list.push('restore')
  list.push('silence')
  return list
})
const needsReason = computed(() => ['hide', 'delete', 'edit', 'silence'].includes(action.value))

watch(() => props.post, (post) => {
  if (!post) return
  action.value = actions.value[0] ?? 'silence'
  reason.value = ''
  raw.value = post.raw ?? ''
  days.value = 3
  error.value = ''
})

async function submit() {
  const post = props.post
  if (!post || (needsReason.value && !reason.value.trim())) {
    error.value = t('discussions.moderation.reason_required')
    return
  }
  busy.value = true
  error.value = ''
  const body = { reason: reason.value.trim() || undefined }
  try {
    if (action.value === 'silence') {
      await $api('/v1/admin/discussions/restrictions', { method: 'POST', body: { user_id: post.user.id, days: days.value ?? undefined, ...body } })
      notice.success(t('discussions.moderation.silenced', { name: post.user.nickname || post.user.username }))
      emit('close')
      return
    }
    const request = {
      hide: () => $api<Partial<DiscussionPost>>(`/v1/admin/discussions/posts/${post.id}`, { method: 'PATCH', body: { status: 'hidden', ...body } }),
      unhide: () => $api<Partial<DiscussionPost>>(`/v1/admin/discussions/posts/${post.id}`, { method: 'PATCH', body: { status: 'visible', ...body } }),
      edit: () => $api<Partial<DiscussionPost>>(`/v1/admin/discussions/posts/${post.id}`, { method: 'PATCH', body: { raw: raw.value, ...body } }),
      delete: () => $api<Partial<DiscussionPost>>(`/v1/admin/discussions/posts/${post.id}`, { method: 'DELETE', body }),
      restore: () => $api<Partial<DiscussionPost>>(`/v1/admin/discussions/posts/${post.id}/restore`, { method: 'POST', body }),
    }[action.value]
    const state = await request()
    const status = state.status ?? post.status
    emit('updated', {
      ...post, ...state, status,
      removed_by: status === 'visible' ? null : 'moderator',
      can: { ...post.can, react: status === 'visible' && post.can.react, report: status === 'visible' && post.can.report, edit: status === 'visible' && post.can.edit, delete: status === 'visible' && post.can.delete },
    } as DiscussionPost)
    notice.success(t('discussions.moderation.done'))
    emit('close')
  }
  catch (failure) {
    error.value = localizeError(failure)
  }
  finally {
    busy.value = false
  }
}
</script>

<template>
  <DiscussionDialog v-model:open="open" :title="t('discussions.moderation.post_title', { floor: post?.floor ? `#${post.floor}` : t('discussions.moderation.reply') })" width="max-w-xl" :busy="busy">
    <form id="discussion-moderation" class="space-y-4" @submit.prevent="submit">
      <div class="flex flex-wrap gap-1.5">
        <button
          v-for="value in actions" :key="value" type="button" class="rounded-lg px-3 py-1.5 text-sm transition"
          :class="action === value ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'" @click="action = value"
        >
          {{ t(`discussions.moderation.actions.${value}`) }}
        </button>
      </div>
      <p class="text-sm text-slate-500">{{ t(`discussions.moderation.help.${action}`) }}</p>
      <ClientOnly v-if="action === 'edit'">
        <MarkdownEditor v-model="raw" :variant="post?.floor === null ? 'compact' : 'full'" mode="edit" :guide-url="null" />
      </ClientOnly>
      <label v-if="action === 'silence'" class="block text-sm">
        {{ t('discussions.moderation.duration') }}
        <select v-model="days" class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2">
          <option v-for="value in [1, 3, 7, 30]" :key="value" :value="value">{{ t('discussions.moderation.days', { count: value }) }}</option>
          <option :value="null">{{ t('discussions.moderation.forever') }}</option>
        </select>
      </label>
      <label class="block text-sm">
        {{ needsReason ? t('discussions.moderation.reason') : t('discussions.moderation.reason_optional') }}
        <textarea v-model="reason" rows="2" maxlength="2000" :required="needsReason" class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400" />
      </label>
      <p v-if="error" role="alert" class="text-sm text-rose-600">{{ error }}</p>
    </form>
    <template #footer>
      <button type="button" class="btn btn-ghost btn-sm" :disabled="busy" @click="emit('close')">{{ t('common.cancel') }}</button>
      <button type="submit" form="discussion-moderation" class="btn btn-sm" :class="['delete', 'silence', 'hide'].includes(action) ? 'btn-error' : 'btn-primary'" :disabled="busy">
        <Loader2 v-if="busy" :size="14" class="animate-spin" />{{ t('common.confirm') }}
      </button>
    </template>
  </DiscussionDialog>
</template>
