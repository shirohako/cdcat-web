<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'

/**
 * A "new" link drawn as a bold plus in a ring in the theme colour: hovered, it turns a quarter round and fills in
 * solid, the plus turning to the colour on it; pressed, it shrinks a little and darkens. After Uiverse.io's
 * mRcOol7/hot-fox-27, a take on catraco/fluffy-quail-74 (both MIT, Copyright (c) 2023 Uiverse.io). `label` names it
 * for screen readers and shows in a tooltip.
 */
defineProps<{
  to: RouteLocationRaw
  label: string
}>()
</script>

<template>
  <UiTooltip :text="label" placement="bottom">
    <NuxtLink
      :to="to"
      :aria-label="label"
      class="group inline-grid shrink-0 place-items-center rounded-full transition-[rotate,scale] duration-300 ease-out hover:rotate-90 active:scale-95 motion-reduce:hover:rotate-0"
    >
      <svg viewBox="0 0 24 24" class="size-7 fill-none sm:size-8" stroke-linecap="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" class="fill-transparent stroke-primary transition-[fill,stroke] duration-300 group-hover:fill-primary group-active:fill-primary-strong group-active:stroke-primary-strong group-active:duration-0" stroke-width="2.2" />
        <path d="M8 12H16M12 8V16" class="stroke-primary transition-[stroke] duration-300 group-hover:stroke-on-primary" stroke-width="2.2" />
      </svg>
    </NuxtLink>
  </UiTooltip>
</template>
