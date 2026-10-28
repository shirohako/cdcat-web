<script setup lang="ts">
import { DISCUSSION_REPORT_REASONS, type DiscussionReportReason } from '~/types/discussion'

/** Reports a post to the moderators. */
const props = defineProps<{ postId: number | null }>()
const emit = defineEmits<{ close: [] }>()
const { t } = useI18n()
const { $api } = useNuxtApp()
const { localizeError } = useLocalizedApiError()
const notice = useDiscussionNotice()
const reason = ref<DiscussionReportReason>('spam')
const note = ref('')
const busy = ref(false)
const error = ref('')
const open = computed({ get: () => props.postId !== null, set: (value) => { if (!value) emit('close') } })
watch(() => props.postId, () => { reason.value = 'spam'; note.value = ''; error.value = '' })

async function submit() {
  if (reason.value === 'other' && !note.value.trim()) {
    error.value = t('discussions.report.note_required')
    return
  }
  busy.value = true
  error.value = ''
  try {
    await $api(`/v1/discussions/posts/${props.postId}/reports`, { method: 'POST', body: { reason: reason.value, note: note.value.trim() || undefined } })
    notice.success(t('discussions.report.done'))
    emit('close')
  }
  catch (failure) {
    const name = (failure as { name?: string }).name
    error.value = name === 'ALREADY_REPORTED' ? t('discussions.report.already') : localizeError(failure)
  }
  finally {
    busy.value = false
  }
}
</script>

<template>
  <DiscussionDialog v-model:open="open" :title="t('discussions.report.title')" width="max-w-md" :busy="busy">
    <form id="discussion-report" class="space-y-3" @submit.prevent="submit">
      <fieldset class="space-y-1">
        <legend class="sr-only">{{ t('discussions.report.reason') }}</legend>
        <label v-for="value in DISCUSSION_REPORT_REASONS" :key="value" class="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors duration-150 ease-out hover:bg-card-hover">
          <input v-model="reason" type="radio" name="discussion-report-reason" :value="value" class="radio radio-sm">
          {{ t(`discussions.report.reasons.${value}`) }}
        </label>
      </fieldset>
      <textarea v-model="note" rows="3" maxlength="1000" class="textarea w-full resize-none" :placeholder="t(reason === 'other' ? 'discussions.report.note_required' : 'discussions.report.note')" />
      <p v-if="error" role="alert" class="text-sm text-danger">{{ error }}</p>
    </form>
    <template #footer>
      <UiButton size="sm" :disabled="busy" @click="emit('close')">{{ t('common.cancel') }}</UiButton>
      <UiButton type="submit" form="discussion-report" variant="primary" size="sm" :loading="busy">{{ t('discussions.report.submit') }}</UiButton>
    </template>
  </DiscussionDialog>
</template>
