<script setup lang="ts">
/** A native modal dialog shell for discussion pages. */
const props = withDefaults(defineProps<{ open: boolean, title: string, width?: string, busy?: boolean }>(), { width: 'max-w-lg', busy: false })
const emit = defineEmits<{ 'update:open': [value: boolean] }>()
const dialog = useTemplateRef<HTMLDialogElement>('dialog')
const titleId = useId()

watch(() => props.open, async (value) => {
  await nextTick()
  if (value && !dialog.value?.open) dialog.value?.showModal()
  if (!value) dialog.value?.close()
}, { immediate: true })
const close = () => { if (!props.busy) emit('update:open', false) }
</script>

<template>
  <dialog ref="dialog" :aria-labelledby="titleId" class="m-auto w-[calc(100%_-_2rem)] rounded-2xl bg-card p-0 text-body shadow-overlay ring-1 ring-line backdrop:bg-black/50" :class="width" @cancel.prevent="close" @close="close">
    <div v-if="open" class="max-h-[85vh] overflow-y-auto p-5">
      <h2 :id="titleId" class="text-lg font-bold text-title">{{ title }}</h2>
      <div class="mt-4">
        <slot />
      </div>
      <footer v-if="$slots.footer" class="mt-5 flex flex-wrap items-center justify-end gap-2">
        <slot name="footer" />
      </footer>
    </div>
  </dialog>
</template>
