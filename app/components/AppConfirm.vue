<template>
  <CommonConfirmDialog
    :model-value="!!request"
    :title="shown.title"
    :description="shown.description"
    :confirm-text="shown.confirmText"
    @confirm="answerConfirm(true)"
    @cancel="answerConfirm(false)"
  />
</template>

<script setup lang="ts">
import type { ConfirmOptions } from '~/composables/useConfirm'

/** The dialog behind useConfirm(), mounted once in app.vue. */
const { request } = useConfirm()
// Kept after the question is answered, so the text doesn't vanish while the dialog fades out.
const shown = ref<ConfirmOptions>({ title: '' })
watch(request, (value) => {
  if (value) shown.value = { title: value.title, description: value.description, confirmText: value.confirmText }
})

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && request.value) {
    event.stopImmediatePropagation()
    answerConfirm(false)
  }
}
// Capture phase, so an editor dialog underneath doesn't close on the same key.
onMounted(() => window.addEventListener('keydown', onKeydown, true))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown, true))
</script>
