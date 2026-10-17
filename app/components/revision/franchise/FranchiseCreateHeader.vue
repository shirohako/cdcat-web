<template>
  <div class="mb-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
    <div>
      <p class="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-600">
        <Sparkles class="h-4 w-4" />
        {{ badge || $t('catalog.contribute.series_badge') }}
      </p>
      <h1 class="mt-3 text-3xl font-bold text-gray-900 md:text-4xl">
        {{ title || $t('catalog.contribute.series_title') }}
      </h1>
      <p class="mt-2 text-gray-600">
        {{ description || $t('catalog.contribute.series_desc') }}
      </p>
    </div>

    <NuxtLink class="btn btn-outline btn-sm" :to="backTo">
      {{ backLabel || $t('catalog.contribute.series_back') }}
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
import { Sparkles } from '@lucide/vue'

withDefaults(defineProps<{
  badge?: string
  title?: string
  description?: string
  backTo?: string
  backLabel?: string
}>(), {
  badge: '',
  title: '',
  description: '',
  backTo: '/franchises',
  backLabel: '',
})
</script>
