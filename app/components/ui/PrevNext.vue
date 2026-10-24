<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'

interface Neighbour {
  to: RouteLocationRaw
  title: string
}

/** vivia's previous/next buttons at the foot of a page: two wide cards, each with an arrow in the theme colour. */
withDefaults(defineProps<{
  prev?: Neighbour | null
  next?: Neighbour | null
  prevLabel?: string
  nextLabel?: string
}>(), { prev: null, next: null, prevLabel: undefined, nextLabel: undefined })
</script>

<template>
  <nav v-if="prev || next" class="grid gap-4 sm:grid-cols-2">
    <NuxtLink
      v-if="prev"
      :to="prev.to"
      rel="prev"
      class="card group flex min-h-15 items-center gap-4 px-5 py-3 transition-colors duration-150 ease-out hover:bg-card-hover active:bg-card-active"
    >
      <Icon name="lucide:chevron-left" class="size-5 shrink-0 text-primary transition-transform duration-150 ease-out group-hover:-translate-x-0.5" />
      <span class="min-w-0">
        <span class="block text-xs text-meta">{{ prevLabel ?? $t('common.previous') }}</span>
        <span class="block truncate font-bold text-body">{{ prev.title }}</span>
      </span>
    </NuxtLink>
    <NuxtLink
      v-if="next"
      :to="next.to"
      rel="next"
      class="card group flex min-h-15 items-center justify-end gap-4 px-5 py-3 text-right transition-colors duration-150 ease-out hover:bg-card-hover active:bg-card-active sm:col-start-2"
    >
      <span class="min-w-0">
        <span class="block text-xs text-meta">{{ nextLabel ?? $t('common.next') }}</span>
        <span class="block truncate font-bold text-body">{{ next.title }}</span>
      </span>
      <Icon name="lucide:chevron-right" class="size-5 shrink-0 text-primary transition-transform duration-150 ease-out group-hover:translate-x-0.5" />
    </NuxtLink>
  </nav>
</template>
