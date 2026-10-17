<script setup lang="ts">
import { Loader2 } from '@lucide/vue'
import type { DiscussionTopicDetail } from '~/types/discussion'

/** Pin, feature, lock, delete or restore a topic. Editing its fields is the edit dialog. */
const props = defineProps<{ topic: DiscussionTopicDetail | null }>()
const emit = defineEmits<{ close: [], saved: [] }>()
const { t } = useI18n()
const { $api } = useNuxtApp()
const { localizeError } = useLocalizedApiError()
const notice = useDiscussionNotice()
const open = computed({ get: () => props.topic !== null, set: (value) => { if (!value) emit('close') } })
const pinned = ref<'none' | 'category' | 'global'>('none')
const pinnedUntil = ref('')
const featured = ref(false)
const locked = ref(false)
const reason = ref('')
const busy = ref(false)
const error = ref('')

watch(() => props.topic, (topic) => {
  if (!topic) return
  pinned.value = topic.pinned ?? 'none'
  pinnedUntil.value = topic.pinned_until ? topic.pinned_until.slice(0, 16) : ''
  featured.value = topic.featured
  locked.value = topic.locked
  reason.value = ''
  error.value = ''
}, { immediate: true })

async function run(request: () => Promise<unknown>) {
  busy.value = true
  error.value = ''
  try {
    await request()
    notice.success(t('discussions.moderation.done'))
    emit('saved')
  }
  catch (failure) {
    error.value = localizeError(failure)
  }
  finally {
    busy.value = false
  }
}

const save = () => run(() => $api(`/v1/admin/discussions/topics/${props.topic!.id}`, {
  method: 'PATCH',
  body: {
    pinned_scope: pinned.value === 'none' ? null : pinned.value,
    pinned_until: pinned.value !== 'none' && pinnedUntil.value ? new Date(pinnedUntil.value).toISOString() : null,
    featured: featured.value, locked: locked.value, reason: reason.value.trim() || undefined,
  },
}))
const remove = () => {
  if (!reason.value.trim()) {
    error.value = t('discussions.moderation.reason_required')
    return
  }
  return run(() => $api(`/v1/admin/discussions/topics/${props.topic!.id}`, { method: 'DELETE', body: { reason: reason.value.trim() } }))
}
const restore = () => run(() => $api(`/v1/admin/discussions/topics/${props.topic!.id}/restore`, { method: 'POST', body: { reason: reason.value.trim() || undefined } }))
</script>

<template>
  <DiscussionDialog v-model:open="open" :title="t('discussions.moderation.topic_title')" width="max-w-lg" :busy="busy">
    <form id="discussion-topic-mod" class="space-y-4 text-sm" @submit.prevent="save">
      <fieldset>
        <legend class="font-medium text-slate-700">{{ t('discussions.moderation.pin') }}</legend>
        <div class="mt-1.5 flex flex-wrap gap-3">
          <label v-for="value in ['none', 'category', 'global'] as const" :key="value" class="flex items-center gap-1.5">
            <input v-model="pinned" type="radio" :value="value" class="accent-sky-600">{{ t(`discussions.moderation.pin_scopes.${value}`) }}
          </label>
        </div>
        <label v-if="pinned !== 'none'" class="mt-2 block text-slate-600">
          {{ t('discussions.moderation.pin_until') }}
          <input v-model="pinnedUntil" type="datetime-local" class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2">
        </label>
      </fieldset>
      <label class="flex items-center gap-2"><input v-model="featured" type="checkbox" class="accent-sky-600">{{ t('discussions.moderation.featured') }}</label>
      <label class="flex items-center gap-2"><input v-model="locked" type="checkbox" class="accent-sky-600">{{ t('discussions.moderation.locked') }}</label>
      <label class="block">
        {{ t('discussions.moderation.reason_optional') }}
        <textarea v-model="reason" rows="2" maxlength="2000" class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-sky-400" />
      </label>
      <p v-if="error" role="alert" class="text-rose-600">{{ error }}</p>
    </form>
    <template #footer>
      <button v-if="topic?.status === 'deleted'" type="button" class="btn btn-sm mr-auto" :disabled="busy" @click="restore">{{ t('discussions.moderation.restore_topic') }}</button>
      <button v-else type="button" class="btn btn-error btn-sm mr-auto" :disabled="busy" @click="remove">{{ t('discussions.moderation.delete_topic') }}</button>
      <button type="button" class="btn btn-ghost btn-sm" :disabled="busy" @click="emit('close')">{{ t('common.cancel') }}</button>
      <button type="submit" form="discussion-topic-mod" class="btn btn-primary btn-sm" :disabled="busy"><Loader2 v-if="busy" :size="14" class="animate-spin" />{{ t('common.save') }}</button>
    </template>
  </DiscussionDialog>
</template>
