<template>
  <p class="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-rose-100 bg-rose-50/70 px-3 py-2 text-sm text-rose-700" role="alert">
    {{ message || $t('common.load_failed') }}
    <button type="button" class="font-medium underline underline-offset-2 hover:text-rose-900" @click="emit('retry')">{{ $t('common.retry') }}</button>
  </p>
</template>

<script setup lang="ts">
/** A failed load above content that is still shown (the last results), with a retry button. */
defineProps<{ message?: string }>()
const emit = defineEmits<{ retry: [] }>()
</script>
