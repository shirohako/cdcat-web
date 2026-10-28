<script setup lang="ts">
import type { DiscussionTopicDetail } from '~/types/discussion'

/** Pin, feature, lock or delete (for good) a topic. Editing its fields is the edit dialog. */
const props = defineProps<{ topic: DiscussionTopicDetail | null }>()
const emit = defineEmits<{ close: [], saved: [], deleted: [] }>()
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

async function run(request: () => Promise<unknown>, done: 'saved' | 'deleted' = 'saved') {
  busy.value = true
  error.value = ''
  try {
    await request()
    notice.success(t('discussions.moderation.done'))
    if (done === 'deleted') emit('deleted')
    else emit('saved')
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
  return run(() => $api(`/v1/admin/discussions/topics/${props.topic!.id}`, { method: 'DELETE', body: { reason: reason.value.trim() } }), 'deleted')
}
</script>

<template>
  <DiscussionDialog v-model:open="open" :title="t('discussions.moderation.topic_title')" width="max-w-lg" :busy="busy">
    <form id="discussion-topic-mod" class="space-y-4 text-sm" @submit.prevent="save">
      <fieldset>
        <legend class="font-medium text-body">{{ t('discussions.moderation.pin') }}</legend>
        <div class="mt-1.5 flex flex-wrap gap-3">
          <label v-for="value in ['none', 'category', 'global'] as const" :key="value" class="flex items-center gap-1.5">
            <input v-model="pinned" type="radio" :value="value" class="radio radio-sm">{{ t(`discussions.moderation.pin_scopes.${value}`) }}
          </label>
        </div>
        <label v-if="pinned !== 'none'" class="mt-2 block text-body">
          {{ t('discussions.moderation.pin_until') }}
          <input v-model="pinnedUntil" type="datetime-local" class="input mt-1 w-full">
        </label>
      </fieldset>
      <label class="flex items-center gap-2"><input v-model="featured" type="checkbox" class="checkbox checkbox-sm">{{ t('discussions.moderation.featured') }}</label>
      <label class="flex items-center gap-2"><input v-model="locked" type="checkbox" class="checkbox checkbox-sm">{{ t('discussions.moderation.locked') }}</label>
      <label class="block">
        {{ t('discussions.moderation.reason_optional') }}
        <textarea v-model="reason" rows="2" maxlength="2000" class="textarea textarea-sm mt-1 w-full" />
      </label>
      <p v-if="error" role="alert" class="text-danger">{{ error }}</p>
    </form>
    <template #footer>
      <UiButton variant="danger" size="sm" class="mr-auto" :disabled="busy" @click="remove">{{ t('discussions.moderation.delete_topic') }}</UiButton>
      <UiButton size="sm" :disabled="busy" @click="emit('close')">{{ t('common.cancel') }}</UiButton>
      <UiButton type="submit" form="discussion-topic-mod" variant="primary" size="sm" :loading="busy">{{ t('common.save') }}</UiButton>
    </template>
  </DiscussionDialog>
</template>
