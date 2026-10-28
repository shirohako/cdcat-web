<script setup lang="ts">
const props = withDefaults(defineProps<{
  modelValue: boolean
  title: string
  description?: string
  confirmText?: string
  reasonRequired?: boolean
  busy?: boolean
  confirmDisabled?: boolean
  /** Typed second confirmation (e.g. "#12") for deletions and merges. */
  confirmPhrase?: string
}>(), { reasonRequired: false, busy: false, confirmDisabled: false, description: '', confirmText: '', confirmPhrase: '' })
const emit = defineEmits<{ 'update:modelValue': [value: boolean], confirm: [reason: string] }>()
const dialog = useTemplateRef('dialog')
const reason = ref('')
const typed = ref('')
const phraseMatches = computed(() => !props.confirmPhrase || typed.value.trim() === props.confirmPhrase)
const titleId = useId()
watch(() => props.modelValue, async (value) => {
  await nextTick()
  if (value) {
    reason.value = ''
    typed.value = ''
    if (!dialog.value?.open) dialog.value?.showModal()
  } else {
    dialog.value?.close()
  }
}, { immediate: true })
const close = () => { if (!props.busy) emit('update:modelValue', false) }
const confirm = () => {
  if (!props.busy && !props.confirmDisabled && phraseMatches.value && (!props.reasonRequired || reason.value.trim())) emit('confirm', reason.value.trim())
}
</script>

<template>
  <dialog ref="dialog" :aria-labelledby="titleId" class="m-auto w-[calc(100%_-_2rem)] max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl backdrop:bg-black/40" @cancel.prevent="close" @close="close">
    <form @submit.prevent="confirm">
      <h2 :id="titleId" class="text-lg font-semibold">{{ title }}</h2>
      <p v-if="description" class="mt-2 text-sm text-slate-600">{{ description }}</p>
      <slot />
      <label v-if="reasonRequired" class="mt-4 block text-sm">
        原因（必填）
        <textarea v-model="reason" required maxlength="2000" :disabled="busy" rows="3" class="mt-2 w-full rounded-lg border border-slate-300 p-2" />
      </label>
      <label v-if="confirmPhrase" class="mt-4 block text-sm">
        请输入 {{ confirmPhrase }} 确认
        <input v-model="typed" type="text" autocomplete="off" :disabled="busy" :placeholder="confirmPhrase" class="mt-2 w-full rounded-lg border border-slate-300 p-2 font-mono">
      </label>
      <div class="mt-5 flex justify-end gap-2">
        <UiButton size="sm" :disabled="busy" @click="close">取消</UiButton>
        <UiButton type="submit" variant="primary" size="sm" :disabled="busy || confirmDisabled || !phraseMatches || (reasonRequired && !reason.trim())">{{ busy ? '保存中…' : (confirmText || '确认') }}</UiButton>
      </div>
    </form>
  </dialog>
</template>
