<script setup lang="ts">
const { t } = useAdminI18n()
</script>

<template>
  <section class="mb-5 flex flex-wrap items-end gap-3" :aria-label="t('admin_pages.filters')"><slot /></section>
</template>
