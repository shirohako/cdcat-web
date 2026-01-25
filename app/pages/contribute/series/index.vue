<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

useHead({
  title: '创建系列'
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div class="container mx-auto px-4 md:px-8 py-10 max-w-6xl">
      <SeriesCreateHeader />

      <div class="max-w-5xl">
        <SeriesForm />
      </div>
    </div>
  </div>
</template>
