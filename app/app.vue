<template>
  <AppProgressBar />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <AppConfirm />
  <UiToaster />
</template>

<script setup lang="ts">
const { appliedTheme, appliedHue } = useAppearance()

useHead({
  titleTemplate: (titleChunk) => titleChunk ? `${titleChunk} | CDCAT` : 'CDCAT',
  htmlAttrs: {
    'data-theme': () => appliedTheme.value,
    // A string: a numeric 0 would be dropped as empty.
    style: () => `--hue: ${appliedHue.value}`,
  },
  link: [
    { rel: 'icon', href: '/favicon.ico', sizes: 'any' },
    { rel: 'icon', href: '/icon.png', type: 'image/png', sizes: '192x192' },
    { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
  ],
})
</script>
