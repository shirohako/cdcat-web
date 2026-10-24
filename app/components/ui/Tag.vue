<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'
import { NuxtLink } from '#components'

/** vivia's tag: a soft button-coloured label with a small dot. With `to` it is a link; `active` marks the chosen one. */
withDefaults(defineProps<{
  to?: RouteLocationRaw
  size?: 'sm' | 'md'
  active?: boolean
  dot?: boolean
}>(), { to: undefined, size: 'md', dot: true })

const SIZES = { sm: 'h-6 gap-1.5 px-2 text-xs', md: 'h-8 gap-2 px-3 text-sm' }
</script>

<template>
  <component
    :is="to ? NuxtLink : 'span'"
    :to="to"
    class="inline-flex max-w-full items-center rounded-lg font-medium transition-colors duration-150 ease-out"
    :class="[
      SIZES[size],
      active ? 'bg-primary text-on-primary' : 'bg-btn text-btn-content',
      { 'hover:bg-btn-hover active:bg-btn-active': to && !active },
    ]"
  >
    <span v-if="dot" class="size-1 shrink-0 rounded-full bg-current opacity-60" aria-hidden="true" />
    <span class="truncate"><slot /></span>
  </component>
</template>
