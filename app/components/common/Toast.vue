<template>
  <Teleport to="body">
    <div
      v-if="toast.show"
      class="fixed bottom-6 right-6 z-60 rounded-xl border px-4 py-3 text-sm shadow-lg"
      :class="toast.type === 'error' ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'"
      role="status"
    >
      {{ toast.message }}
    </div>
  </Teleport>
</template>

<script setup lang="ts">
/** Shows the state returned by useToast(). */
defineProps<{ toast: { show: boolean, message: string, type: 'success' | 'error' | 'info' } }>()
</script>
