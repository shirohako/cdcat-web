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
  link: [
    { rel: 'icon', href: '/favicon.ico', sizes: 'any' },
    { rel: 'icon', href: '/icon.png', type: 'image/png', sizes: '192x192' },
    { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
  ],
})
</script>
