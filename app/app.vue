<template>
  <AppProgressBar />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <AppConfirm />
</template>

<script setup lang="ts">
useHead({
  titleTemplate: (titleChunk) => titleChunk ? `${titleChunk} | CDCAT` : 'CDCAT',
})
</script>
