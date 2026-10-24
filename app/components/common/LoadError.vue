<template>
  <UiAlert tone="danger" compact>
    <span class="mr-3">{{ message || $t('common.load_failed') }}</span>
    <button type="button" class="font-semibold text-danger underline underline-offset-2 hover:no-underline" @click="emit('retry')">{{ $t('common.retry') }}</button>
  </UiAlert>
</template>

<script setup lang="ts">
/** A failed load above content that is still shown (the last results), with a retry button. */
defineProps<{ message?: string }>()
const emit = defineEmits<{ retry: [] }>()
</script>
