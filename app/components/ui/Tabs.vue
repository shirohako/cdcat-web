<script setup lang="ts" generic="T extends string | number">
import type { Component } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import { NuxtLink } from '#components'

export interface UiTabItem<V> {
  value: V
  label: string
  count?: number
  icon?: string | Component
  /** Makes the tab a link; the page then sets `v-model` from the route. */
  to?: RouteLocationRaw
  disabled?: boolean
}

/**
 * A set of tabs or filters. `pills` are vivia-style chips (the chosen one in the theme colour); `segmented` is a
 * compact switch for two to four views of the same thing, drawn by UiSegmented.
 */
withDefaults(defineProps<{
  items: UiTabItem<T>[]
  variant?: 'pills' | 'segmented'
  size?: 'sm' | 'md'
  label?: string
}>(), { variant: 'pills', size: 'md', label: undefined })

const model = defineModel<T>()
</script>

<template>
  <UiSegmented v-if="variant === 'segmented'" v-model="model" :items="items" :size="size" :label="label" semantics="tab" />
  <div v-else role="tablist" :aria-label="label" class="flex flex-wrap gap-2">
    <component
      :is="item.to && !item.disabled ? NuxtLink : 'button'"
      v-for="item in items"
      :key="item.value"
      :to="item.to && !item.disabled ? item.to : undefined"
      :type="item.to && !item.disabled ? undefined : 'button'"
      role="tab"
      :aria-selected="item.value === model"
      :disabled="item.to && !item.disabled ? undefined : item.disabled"
      class="chip"
      :class="{ 'chip-sm': size === 'sm', 'chip-selected': item.value === model }"
      @click="model = item.value"
    >
      <UiIcon v-if="item.icon" :icon="item.icon" class="size-4 shrink-0" />
      {{ item.label }}
      <span v-if="item.count !== undefined" class="tabular-nums opacity-60">{{ item.count }}</span>
    </component>
  </div>
</template>
