<script setup lang="ts">
const route = useRoute()
const links = [
  { to: '/admin/system', label: '运行状态' },
  { to: '/admin/system/failed-jobs', label: '失败任务' },
  { to: '/admin/system/logs', label: '应用日志' },
]
</script>

<template>
  <nav class="flex gap-2 border-b border-slate-200 text-sm" aria-label="运维">
    <NuxtLink v-for="link in links" :key="link.to" :to="link.to" class="-mb-px border-b-2 px-3 py-2" :class="route.path === link.to ? 'border-slate-900 font-semibold' : 'border-transparent text-slate-500'">{{ link.label }}</NuxtLink>
  </nav>
</template>
