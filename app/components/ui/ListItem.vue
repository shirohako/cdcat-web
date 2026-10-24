<script setup lang="ts">
import type { Component } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import { NuxtLink } from '#components'

/**
 * A row in a list, after vivia's sidebar links: with `to` it is a link, and on hover the row takes a quiet background,
 * the text turns the theme colour and the content slides right a little (`shift`). `count` puts vivia's count box on
 * the right; the `leading` and `trailing` slots replace the icon and the count.
 */
withDefaults(defineProps<{
  to?: RouteLocationRaw
  active?: boolean
  icon?: string | Component
  count?: number | string
  shift?: boolean
}>(), { to: undefined, icon: undefined, count: undefined, shift: true })
</script>

<template>
  <component
    :is="to ? NuxtLink : 'div'"
    :to="to"
    :aria-current="to && active ? 'page' : undefined"
    class="group flex min-h-10 items-center gap-3 rounded-lg px-2 py-1.5 transition-[background-color,color,padding] duration-150 ease-out"
    :class="[
      active ? 'bg-ghost-hover font-semibold text-primary' : 'text-body',
      { 'hover:bg-ghost-hover hover:text-primary active:bg-ghost-active': to, 'hover:pl-3': to && shift },
    ]"
  >
    <slot name="leading">
      <UiIcon v-if="icon" :icon="icon" class="size-4 shrink-0" />
    </slot>
    <div class="min-w-0 flex-1">
      <slot />
    </div>
    <slot name="trailing">
      <UiCount v-if="count !== undefined" :value="count" />
    </slot>
  </component>
</template>
