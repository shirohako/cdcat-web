<script setup lang="ts">
/** 一起把资料补全: a shelf with one empty, dashed slot. Hovering the card drops the missing spine into it. */
const SHELF = 104
const SPINES: { x: number, w: number, h: number, tone: 'plain' | 'soft', obi?: boolean }[] = [
  { x: 56, w: 14, h: 62, tone: 'plain' },
  { x: 73, w: 18, h: 72, tone: 'soft' },
  { x: 94, w: 14, h: 58, tone: 'plain', obi: true },
  { x: 132, w: 16, h: 66, tone: 'soft' },
  { x: 151, w: 14, h: 60, tone: 'plain' },
  { x: 168, w: 18, h: 74, tone: 'plain', obi: true },
]
</script>

<template>
  <svg viewBox="0 0 240 128" class="size-full" aria-hidden="true">
    <g v-for="(spine, index) in SPINES" :key="index">
      <rect
        :x="spine.x"
        :y="SHELF - spine.h"
        :width="spine.w"
        :height="spine.h"
        rx="1.5"
        stroke-width="1"
        :class="spine.tone === 'soft' ? 'fill-(--accent-soft) stroke-line' : 'fill-card stroke-line'"
      />
      <rect :x="spine.x + 3" :y="SHELF - spine.h + 7" :width="spine.w - 6" height="3" rx="1" class="fill-faint" />
      <rect v-if="spine.obi" :x="spine.x" :y="SHELF - 22" :width="spine.w" height="10" class="fill-(--accent)" />
    </g>

    <rect x="111.5" y="34.5" width="17" height="69" rx="1.5" stroke-width="1.25" stroke-dasharray="3 2.5" class="fill-none stroke-(--accent)" />
    <path d="M120 63v12m-6-6h12" stroke-width="1.75" stroke-linecap="round" class="plus fill-none stroke-(--accent)" />

    <g class="drop">
      <rect x="111" y="34" width="18" height="70" rx="1.5" class="fill-(--accent)" />
      <rect x="114" y="41" width="12" height="3" rx="1" class="fill-(--on-accent) opacity-60" />
      <rect x="111" y="82" width="18" height="10" class="fill-(--on-accent) opacity-25" />
    </g>

    <rect x="40" y="104" width="160" height="6" rx="1.5" stroke-width="1" class="fill-card stroke-line" />
  </svg>
</template>

<style scoped>
.drop {
  opacity: 0;
  translate: 0 -46px;
  transition: translate 250ms ease-in, opacity 200ms ease-in;
}

.art-host:is(:hover, :focus-within) .drop {
  opacity: 1;
  translate: 0 0;
  transition: translate 550ms cubic-bezier(0.34, 1.4, 0.64, 1), opacity 200ms ease-out;
}

.plus {
  transition: opacity 200ms ease-out;
}

.art-host:is(:hover, :focus-within) .plus {
  opacity: 0;
}
</style>
