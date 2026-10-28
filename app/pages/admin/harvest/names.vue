<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })
useHead({ title: '名字对照' })
</script>

<template>
  <div class="mx-auto max-w-7xl space-y-4 p-4 sm:p-8">
    <h1 class="text-2xl font-bold">名字对照</h1>
    <AdminHarvestNamesPanel />
  </div>
</template>
