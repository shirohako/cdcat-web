<script setup lang="ts">
/**
 * A round checkbox that splashes as it is ticked: the circle fills with the theme colour, six drops fly off it and
 * fade, then the tick draws itself in. Unticking clears it at once. The default slot is its label. The input itself
 * is the drawn circle, so keyboards and screen readers use it as usual.
 *
 * After Uiverse.io's Shoh2008/big-deer-80 (MIT, Copyright (c) 2023 Uiverse.io), in Tailwind and the theme's colours;
 * the splash is `ui-splash` in ui.css.
 */
const checked = defineModel<boolean>({ required: true })
</script>

<template>
  <label class="group inline-flex cursor-pointer select-none items-center gap-3 text-sm text-body transition-colors hover:text-title">
    <span class="relative size-6 shrink-0">
      <input
        v-model="checked"
        type="checkbox"
        class="peer absolute inset-0 m-0 size-6 cursor-pointer appearance-none rounded-full border-2 border-field-line outline-none transition-colors [-webkit-tap-highlight-color:transparent] group-hover:border-meta focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-card"
      >
      <span class="pointer-events-none absolute inset-0 rounded-full motion-safe:peer-checked:animate-[ui-splash_0.6s_ease_forwards] motion-reduce:peer-checked:bg-primary" aria-hidden="true" />
      <svg
        viewBox="0 0 15 14"
        fill="none"
        class="pointer-events-none absolute left-1 top-[5px] z-1 h-3.5 w-[15px] text-on-primary [stroke-dasharray:19] [stroke-dashoffset:19] peer-checked:[stroke-dashoffset:0] motion-safe:transition-[stroke-dashoffset] motion-safe:delay-200 motion-safe:duration-300"
        aria-hidden="true"
      >
        <path d="M2 8.36364L6.23077 12L13 2" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </span>
    <slot />
  </label>
</template>
