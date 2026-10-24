<script setup lang="ts">
import type { Component } from 'vue'

/**
 * A section heading after vivia's widget titles: bold, behind a short bar in the theme colour, or behind the
 * section's icon in that colour. The `actions` slot sits on the right, e.g. for a "view all" link.
 */
withDefaults(defineProps<{
  title: string
  as?: string
  icon?: string | Component
  count?: number | string
  description?: string
  size?: 'sm' | 'md' | 'lg'
}>(), { as: 'h2', icon: undefined, count: undefined, description: undefined, size: 'md' })

const SIZES = { sm: 'text-base leading-6', md: 'text-lg leading-7', lg: 'text-xl leading-7' }
</script>

<template>
  <div class="flex gap-3" :class="description ? 'items-start' : 'items-center'">
    <div class="min-w-0 flex-1">
      <component :is="as" class="flex items-center gap-2.5 font-bold text-title" :class="SIZES[size]">
        <UiIcon v-if="icon" :icon="icon" class="size-[1.05em] shrink-0 text-primary" />
        <span v-else class="h-[0.7em] w-1 shrink-0 rounded-full bg-primary" aria-hidden="true" />
        <span class="min-w-0 truncate">{{ title }}</span>
        <UiCount v-if="count !== undefined" :value="count" size="sm" />
      </component>
      <p v-if="description" class="mt-1 text-xs leading-5 text-meta">{{ description }}</p>
    </div>
    <div v-if="$slots.actions" class="flex shrink-0 flex-wrap items-center justify-end gap-2 text-sm">
      <slot name="actions" />
    </div>
  </div>
</template>
