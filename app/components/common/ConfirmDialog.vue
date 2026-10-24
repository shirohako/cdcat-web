<template>
  <UiDialog
    :model-value="modelValue"
    :title="title"
    :icon="variant === 'warning' ? 'lucide:triangle-alert' : 'lucide:trash-2'"
    :tone="variant === 'warning' ? 'warning' : 'danger'"
    :size="wide ? 'md' : 'sm'"
    @update:model-value="(open) => { if (!open) onCancel() }"
  >
    <p v-if="description" class="text-sm leading-6 text-body">{{ description }}</p>
    <slot />

    <!-- Second confirmation: type the phrase (e.g. #12) before a deletion can go ahead -->
    <label v-if="confirmPhrase" class="mt-4 block text-sm text-body">
      {{ $t('common.type_to_confirm', { phrase: confirmPhrase }) }}
      <input v-model="typed" type="text" class="input input-sm mt-1.5 w-full font-mono" autocomplete="off" :placeholder="confirmPhrase">
    </label>

    <template #footer>
      <button v-if="variant === 'warning'" type="button" class="btn btn-sm btn-warning" @click="onConfirm">
        {{ $t('common.got_it') }}
      </button>
      <template v-else>
        <button type="button" class="btn btn-sm btn-ghost" @click="onCancel">
          {{ $t('common.cancel') }}
        </button>
        <button type="button" class="btn btn-sm btn-error" :disabled="!phraseMatches" @click="onConfirm">
          {{ confirmText ?? $t('common.confirm_delete') }}
        </button>
      </template>
    </template>
  </UiDialog>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean
  title: string
  description?: string
  variant?: 'delete' | 'warning'
  confirmText?: string
  /** The text to type before confirming, for deletions that are hard to undo. */
  confirmPhrase?: string
  wide?: boolean
}>()

const typed = ref('')
watch(() => props.modelValue, () => { typed.value = '' })
const phraseMatches = computed(() => !props.confirmPhrase || typed.value.trim() === props.confirmPhrase)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: []
  cancel: []
}>()

const onConfirm = () => {
  if (!phraseMatches.value) return
  emit('confirm')
  emit('update:modelValue', false)
}

// Also runs when the dialog closes itself: Escape, the close button or a click outside.
const onCancel = () => {
  emit('cancel')
  emit('update:modelValue', false)
}
</script>
