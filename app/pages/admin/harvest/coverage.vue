<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })
useHead({ title: '社团覆盖' })
</script>

<template>
  <div class="mx-auto max-w-7xl space-y-4 p-4 sm:p-8">
    <h1 class="text-2xl font-bold">社团覆盖</h1>
    <AdminHarvestCoveragePanel />
  </div>
</template>
