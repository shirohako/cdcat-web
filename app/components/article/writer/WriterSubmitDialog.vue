<script setup lang="ts">
import { CheckCircle2, Circle, Loader2, XCircle } from '@lucide/vue'

export interface SubmitCheck {
  key: string
  ok: boolean
  /** Required checks block the action; the others are suggestions. */
  required: boolean
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
  <dialog ref="dialog" class="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-2xl p-0 shadow-xl backdrop:bg-slate-900/40" @cancel.prevent="close">
    <form class="space-y-4 p-5" @submit.prevent="confirm">
      <header>
        <h2 class="text-lg font-bold text-slate-900">{{ t(`article_ui.submit.${action}_title`) }}</h2>
        <p class="mt-1 text-sm text-slate-500">{{ t(`article_ui.submit.${action}_description`) }}</p>
      </header>
      <ul class="space-y-1.5 rounded-xl bg-slate-50 p-3 text-sm">
        <li v-for="check in checks" :key="check.key" class="flex items-center gap-2">
          <CheckCircle2 v-if="check.ok" :size="16" class="shrink-0 text-emerald-500" />
          <XCircle v-else-if="check.required" :size="16" class="shrink-0 text-rose-500" />
          <Circle v-else :size="16" class="shrink-0 text-slate-300" />
          <span :class="check.ok ? 'text-slate-700' : check.required ? 'text-rose-700' : 'text-slate-500'">{{ t(`article_ui.submit.checks.${check.key}`) }}</span>
          <span v-if="!check.required" class="ml-auto text-[11px] text-slate-400">{{ t('article_ui.submit.optional') }}</span>
        </li>
      </ul>
      <p v-if="error" role="alert" class="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{{ error }}</p>
      <footer class="flex justify-end gap-2">
        <button type="button" class="btn btn-ghost btn-sm" :disabled="busy" @click="close">{{ t('common.cancel') }}</button>
        <button type="submit" class="btn btn-primary btn-sm" :disabled="busy || blocked">
          <Loader2 v-if="busy" :size="14" class="animate-spin" />
          {{ t(`article_ui.submit.${action}_confirm`) }}
        </button>
      </footer>
    </form>
  </dialog>
</template>
