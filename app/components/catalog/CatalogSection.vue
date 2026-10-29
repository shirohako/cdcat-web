<template>
  <section class="card" :class="clip ? 'overflow-clip' : 'overflow-hidden'">
    <!-- sm: the album page's card title, 16px on a 20px line -->
    <UiSectionTitle :title="title" :icon="icon" :description="description" :size="size" class="px-5 pb-2 pt-4" :class="size === 'sm' && '[&_h2]:leading-5'">
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
  size?: 'sm' | 'md'
  /** Clip with `overflow: clip`, which is no scroll container, so sticky headers inside stick to the page. */
  clip?: boolean
}>(), {
  description: undefined,
  size: 'md',
})
</script>
