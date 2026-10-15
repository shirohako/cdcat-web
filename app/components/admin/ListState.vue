<script setup lang="ts">
defineProps<{ pending: boolean, error?: unknown, empty?: boolean }>()
defineEmits<{ retry: [] }>()
const { t } = useAdminI18n()
</script>

<template>
  <div v-if="pending" role="status" class="py-16 text-center text-sm text-slate-500">{{ t('common.loading') }}</div>
  <div v-else-if="error" role="alert" class="py-16 text-center text-sm text-red-700">
    <p>{{ t('admin_pages.load_failed') }}</p>
    <button type="button" class="mt-3 rounded border px-3 py-1.5" @click="$emit('retry')">{{ t('admin_pages.retry') }}</button>
  </div>
  <div v-else-if="empty" class="py-16 text-center text-sm text-slate-500">{{ t('common.no_records') }}</div>
  <slot v-else />
</template>
