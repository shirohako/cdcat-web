<script setup lang="ts">
import type { Component } from 'vue'

/** What a list or section shows when it has nothing in it, with room for a next step in the `actions` slot. */
withDefaults(defineProps<{
  title: string
  description?: string
  icon?: string | Component
}>(), { description: undefined, icon: 'lucide:inbox' })
</script>

<template>
  <div class="flex flex-col items-center justify-center px-6 py-12 text-center">
    <UiIconTile :icon="icon" tone="neutral" size="lg" />
    <p class="mt-4 text-sm font-semibold text-title">{{ title }}</p>
    <p v-if="description" class="mt-1 max-w-sm text-sm leading-6 text-meta">{{ description }}</p>
    <div v-if="$slots.actions" class="mt-5 flex flex-wrap justify-center gap-2">
      <slot name="actions" />
    </div>
  </div>
</template>
