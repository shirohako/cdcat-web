<script setup lang="ts">
defineProps<{ pending: boolean, error?: unknown, empty?: boolean }>()
defineEmits<{ retry: [] }>()
</script>

<template>
  <div v-if="pending" role="status" class="py-16 text-center text-sm text-slate-500">加载中…</div>
  <div v-else-if="error" role="alert" class="py-16 text-center text-sm text-red-700">
    <p>加载失败，请重试。</p>
    <UiButton size="sm" class="mt-3" @click="$emit('retry')">重试</UiButton>
  </div>
  <div v-else-if="empty" class="py-16 text-center text-sm text-slate-500">暂无记录</div>
  <slot v-else />
</template>
