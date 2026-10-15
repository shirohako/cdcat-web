<script setup lang="ts">
const props = withDefaults(defineProps<{
  modelValue: boolean
  title: string
  description?: string
  confirmText?: string
  reasonRequired?: boolean
  busy?: boolean
}>(), { reasonRequired: false, busy: false, description: '', confirmText: '' })
const emit = defineEmits<{ 'update:modelValue': [value: boolean], confirm: [reason: string] }>()
const { t } = useAdminI18n()
const dialog = useTemplateRef('dialog')
const reason = ref('')
const titleId = useId()
watch(() => props.modelValue, async (value) => {
  await nextTick()
  if (value) {
    reason.value = ''
    if (!dialog.value?.open) dialog.value?.showModal()
  } else {
    dialog.value?.close()
  }
}, { immediate: true })
const close = () => { if (!props.busy) emit('update:modelValue', false) }
const confirm = () => {
  if (!props.busy && (!props.reasonRequired || reason.value.trim())) emit('confirm', reason.value.trim())
}
</script>

<template>
  <dialog ref="dialog" :aria-labelledby="titleId" class="m-auto w-[calc(100%_-_2rem)] max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl backdrop:bg-black/40" @cancel.prevent="close" @close="close">
    <form @submit.prevent="confirm">
      <h2 :id="titleId" class="text-lg font-semibold">{{ title }}</h2>
      <p v-if="description" class="mt-2 text-sm text-slate-600">{{ description }}</p>
      <slot />
      <label v-if="reasonRequired" class="mt-4 block text-sm">
        {{ t('admin_pages.reason') }}
        <textarea v-model="reason" required maxlength="2000" :disabled="busy" rows="3" class="mt-2 w-full rounded-lg border border-slate-300 p-2" />
      </label>
      <div class="mt-5 flex justify-end gap-2">
        <button type="button" :disabled="busy" class="rounded-lg border px-3 py-2 text-sm disabled:opacity-50" @click="close">{{ t('common.cancel') }}</button>
        <button type="submit" :disabled="busy || (reasonRequired && !reason.trim())" class="rounded-lg bg-slate-900 px-3 py-2 text-sm text-white disabled:opacity-50">{{ busy ? t('common.saving') : (confirmText || t('admin_pages.confirm')) }}</button>
      </div>
    </form>
  </dialog>
</template>
