<script setup lang="ts">
import { CheckCircle2, Circle, XCircle } from '@lucide/vue'

export interface SubmitCheck {
  key: string
  ok: boolean
  /** Required checks block the action; the others are suggestions. */
  required: boolean
  params?: Record<string, unknown>
}

/** Confirms publishing, or publishing a hidden article again, after a checklist; there is no review. */
const props = defineProps<{ open: boolean, republish?: boolean, checks: SubmitCheck[], busy: boolean, error: string }>()
const emit = defineEmits<{ 'update:open': [value: boolean], confirm: [] }>()
const { t } = useI18n()
const dialog = useTemplateRef('dialog')
const action = computed(() => props.republish ? 'republish' : 'publish')
const blocked = computed(() => props.checks.some(check => check.required && !check.ok))
watch(() => props.open, async (value) => {
  await nextTick()
  if (value) {
    if (!dialog.value?.open) dialog.value?.showModal()
  }
  else {
    dialog.value?.close()
  }
}, { immediate: true })
const close = () => { if (!props.busy) emit('update:open', false) }
const confirm = () => { if (!props.busy && !blocked.value) emit('confirm') }
</script>

<template>
  <dialog ref="dialog" class="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-2xl bg-card p-0 text-body shadow-overlay ring-1 ring-line backdrop:bg-black/50" @cancel.prevent="close">
    <form class="space-y-4 p-5" @submit.prevent="confirm">
      <header>
        <h2 class="text-lg font-bold text-title">{{ t(`article_ui.submit.${action}_title`) }}</h2>
        <p class="mt-1 text-sm text-meta">{{ t(`article_ui.submit.${action}_description`) }}</p>
      </header>
      <ul class="space-y-1.5 rounded-xl bg-sunken p-3 text-sm">
        <li v-for="check in checks" :key="check.key" class="flex items-center gap-2">
          <CheckCircle2 v-if="check.ok" :size="16" class="shrink-0 text-success" />
          <XCircle v-else-if="check.required" :size="16" class="shrink-0 text-danger" />
          <Circle v-else :size="16" class="shrink-0 text-faint" />
          <span :class="check.ok ? 'text-body' : check.required ? 'text-danger' : 'text-meta'">{{ t(`article_ui.submit.checks.${check.key}`, check.params ?? {}) }}</span>
          <span v-if="!check.required" class="ml-auto text-[11px] text-meta">{{ t('article_ui.submit.optional') }}</span>
        </li>
      </ul>
      <p v-if="error" role="alert" class="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{{ error }}</p>
      <footer class="flex justify-end gap-2">
        <UiButton size="sm" :disabled="busy" @click="close">{{ t('common.cancel') }}</UiButton>
        <UiButton type="submit" variant="primary" size="sm" :loading="busy" :disabled="blocked">
          {{ t(`article_ui.submit.${action}_confirm`) }}
        </UiButton>
      </footer>
    </form>
  </dialog>
</template>
