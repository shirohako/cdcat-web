<template>
  <AppProgressBar />
  <NuxtLayout>
    <ErrorSheet :status="status" />
  </NuxtLayout>
  <AppConfirm />
  <UiToaster />
</template>

<script setup lang="ts">
import type { NuxtError } from '#app'

/**
 * The site's error page, in the site's shell: a 404 for an address or a record that doesn't exist (pages opt in
 * through usePageData's `notFound`), anything else as a failure. Nuxt renders it in place of app.vue.
 */
const props = defineProps<{ error: NuxtError }>()
useAppHead()
const status = computed(() => props.error.statusCode || 500)
</script>
