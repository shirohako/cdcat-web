<template>
  <section class="card overflow-hidden">
    <UiSectionTitle :title="title" :icon="icon" :description="description" class="px-5 pb-2 pt-4">
      <template v-if="$slots.actions" #actions>
        <div class="flex flex-wrap items-center justify-end gap-2 text-xs text-meta">
          <slot name="actions" />
        </div>
      </template>
    </UiSectionTitle>
    <slot />
  </section>
</template>

<script setup lang="ts">
import type { Component } from 'vue'

withDefaults(defineProps<{
  title: string
  icon: Component
  /** What the section is for, under the title. */
  description?: string
}>(), {
  description: undefined,
})
</script>
