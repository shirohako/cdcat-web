<script setup lang="ts">
import type { Component } from 'vue'

/**
 * A button floating over the page, after the right-side buttons of the hexo theme Butterfly: a small square in the
 * theme colour with an icon, or anything in the default slot (a number), and its name in a tooltip to its left.
 * `label` names it for screen readers; `tooltip` shows other text instead. Attributes go to the button.
 */
defineOptions({ inheritAttrs: false })

withDefaults(defineProps<{
  label: string
  tooltip?: string
  icon?: string | Component
}>(), { tooltip: undefined, icon: undefined })
</script>

<template>
  <UiTooltip :text="tooltip ?? label" placement="left">
    <button
      type="button"
      class="group/float grid size-10 place-items-center rounded-md bg-primary text-on-primary shadow-overlay transition-[background-color,scale] duration-150 ease-out hover:bg-primary-strong active:scale-95 sm:size-9"
      :aria-label="label"
      v-bind="$attrs"
    >
      <UiIcon v-if="icon" :icon="icon" class="size-5 transition-transform duration-200 ease-out motion-safe:group-hover/float:-translate-y-0.5" />
      <slot />
    </button>
  </UiTooltip>
</template>
