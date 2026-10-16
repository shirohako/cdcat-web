<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const { t } = useI18n()
useHead({ title: computed(() => t('catalog.contribute.series_title')) })
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div class="container mx-auto px-4 md:px-8 py-10 max-w-6xl 2xl:max-w-7xl">
      <RevisionSeriesCreateHeader />

      <div class="max-w-5xl">
        <RevisionSeriesForm />
      </div>
    </div>
  </div>
</template>
