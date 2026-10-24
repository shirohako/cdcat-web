<template>
  <Teleport to="body">
    <div
      v-if="toast.show"
      class="fixed bottom-6 right-6 z-60 flex max-w-sm items-start gap-2.5 rounded-xl bg-popover px-4 py-3 text-sm text-body shadow-overlay ring-1 ring-line"
      :role="toast.type === 'error' ? 'alert' : 'status'"
    >
      <Icon :name="ICONS[toast.type]" class="mt-0.5 size-4 shrink-0" :class="TONES[toast.type]" />
      {{ toast.message }}
    </div>
  </Teleport>
</template>

<script setup lang="ts">
/** Shows the state returned by useToast(). */
defineProps<{ toast: { show: boolean, message: string, type: 'success' | 'error' | 'info' } }>()

const ICONS = { success: 'lucide:circle-check', error: 'lucide:circle-alert', info: 'lucide:info' }
const TONES = { success: 'text-success', error: 'text-danger', info: 'text-info' }
</script>
