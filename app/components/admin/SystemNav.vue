<script setup lang="ts">
const { t } = useAdminI18n()
const route = useRoute()
const links = [
  { to: '/admin/system', label: 'admin_pages.system.status' },
  { to: '/admin/system/failed-jobs', label: 'admin_pages.system.failed_jobs' },
  { to: '/admin/system/logs', label: 'admin_pages.system.logs' },
]
</script>

<template>
  <nav class="flex gap-2 border-b border-slate-200 text-sm" :aria-label="t('admin_pages.system.title')">
    <NuxtLink v-for="link in links" :key="link.to" :to="link.to" class="-mb-px border-b-2 px-3 py-2" :class="route.path === link.to ? 'border-slate-900 font-semibold' : 'border-transparent text-slate-500'">{{ t(link.label) }}</NuxtLink>
  </nav>
</template>
