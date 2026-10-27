<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'

/**
 * A "new" link drawn as a plus in a circle in the theme colour: hovered, it turns a quarter round and fills in with a
 * tint of it; pressed, the tint deepens at once. After Uiverse.io's mRcOol7/hot-fox-27, a take on
 * catraco/fluffy-quail-74 (both MIT, Copyright (c) 2023 Uiverse.io). `label` names it for screen readers and shows in
 * a tooltip.
 */
defineProps<{
  to: RouteLocationRaw
  label: string
}>()
</script>

<template>
  <UiTooltip :text="label" placement="bottom">
    <NuxtLink :to="to" :aria-label="label" class="group inline-grid shrink-0 place-items-center rounded-full duration-300 hover:rotate-90 motion-reduce:hover:rotate-0">
      <svg
        viewBox="0 0 24 24"
        class="size-10 fill-none stroke-primary duration-300 group-hover:fill-primary/10 group-active:fill-primary/20 group-active:stroke-primary-strong group-active:duration-0 sm:size-11"
        aria-hidden="true"
      >
        <path d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z" stroke-width="1.5" />
        <path d="M8 12H16" stroke-width="1.5" />
        <path d="M12 16V8" stroke-width="1.5" />
      </svg>
    </NuxtLink>
  </UiTooltip>
</template>
