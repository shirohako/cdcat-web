<script setup lang="ts">
import { ARTICLE_REPORT_REASONS, type ArticleReportReason } from '~/types/article'

/** Reports a published article to the moderators. */
const props = defineProps<{ open: boolean, articleId: number }>()
const emit = defineEmits<{ 'update:open': [value: boolean], reported: [] }>()
const { t } = useI18n()
const { $api } = useNuxtApp()
const { localizeError } = useLocalizedApiError()
const dialog = useTemplateRef('dialog')
const reason = ref<ArticleReportReason>('spam')
const note = ref('')
const busy = ref(false)
const error = ref('')

watch(() => props.open, async (value) => {
  await nextTick()
  if (value) {
    reason.value = 'spam'
    note.value = ''
    error.value = ''
    if (!dialog.value?.open) dialog.value?.showModal()
  }
  else {
    dialog.value?.close()
  }
}, { immediate: true })

const close = () => { if (!busy.value) emit('update:open', false) }
async function submit() {
  if (reason.value === 'other' && !note.value.trim()) {
    error.value = t('article_ui.report.note_required')
    return
  }
  busy.value = true
  error.value = ''
  try {
    await $api(`/v1/articles/${props.articleId}/reports`, { method: 'POST', body: { reason: reason.value, note: note.value.trim() || undefined } })
    emit('reported')
    emit('update:open', false)
  }
  catch (failure) {
    const name = (failure as { name?: string }).name
    error.value = name === 'ALREADY_REPORTED' ? t('article_ui.report.already') : name === 'RATE_LIMIT_EXCEEDED' ? t('article_ui.report.too_many') : localizeError(failure)
  }
  finally {
    busy.value = false
  }
}
</script>

<template>
  <dialog ref="dialog" class="m-auto w-[min(26rem,calc(100vw-2rem))] rounded-2xl bg-card p-0 text-body shadow-overlay ring-1 ring-line backdrop:bg-black/50" @cancel.prevent="close">
    <form class="space-y-4 p-5" @submit.prevent="submit">
      <h2 class="text-lg font-bold text-title">{{ t('article_ui.report.title') }}</h2>
      <fieldset class="space-y-1.5">
        <legend class="sr-only">{{ t('article_ui.report.reason') }}</legend>
        <label v-for="value in ARTICLE_REPORT_REASONS" :key="value" class="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors duration-150 ease-out hover:bg-card-hover">
          <input v-model="reason" type="radio" name="report-reason" :value="value" class="radio radio-sm">
          {{ t(`article_ui.report.reasons.${value}`) }}
        </label>
      </fieldset>
      <textarea
        v-model="note" rows="3" maxlength="1000" class="textarea w-full resize-none"
        :placeholder="t(reason === 'other' ? 'article_ui.report.note_required' : 'article_ui.report.note')" />
      <p v-if="error" role="alert" class="text-sm text-danger">{{ error }}</p>
      <footer class="flex justify-end gap-2">
        <UiButton size="sm" :disabled="busy" @click="close">{{ t('common.cancel') }}</UiButton>
        <UiButton type="submit" variant="primary" size="sm" :loading="busy">{{ t('article_ui.report.submit') }}</UiButton>
      </footer>
    </form>
  </dialog>
</template>
