<template>
  <UiAlert tone="danger" compact>
    <span class="mr-3">{{ message || $t('common.load_failed') }}</span>
    <UiButton variant="danger-soft" size="xs" class="align-middle" @click="emit('retry')">{{ $t('common.retry') }}</UiButton>
  </UiAlert>
</template>

<script setup lang="ts">
/** A failed load above content that is still shown (the last results), with a retry button. */
defineProps<{ message?: string }>()
const emit = defineEmits<{ retry: [] }>()
</script>
