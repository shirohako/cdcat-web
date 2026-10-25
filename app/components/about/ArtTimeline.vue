<script setup lang="ts">
/**
 * 时间胶囊: a year of listening as a heat map, busier towards the right, with its legend. Hovering the card sends a
 * sparkle across it diagonally.
 */
const HEAT = [
  '00101021120212334',
  '01010210212123243',
  '10020112102231344',
  '00101201221323234',
  '01100120212232443',
  '00011021122313344',
  '10010102121233234',
]
const STEP = 13
const LEVEL_OPACITY = [1, 0.3, 0.55, 0.8, 1]

const cells = HEAT.flatMap((row, r) => [...row].map((level, c) => ({ c, r, x: 11 + c * STEP, y: 12 + r * STEP, level: Number(level) })))
</script>

<template>
  <svg viewBox="0 0 240 128" class="size-full" aria-hidden="true">
    <rect
      v-for="cell in cells"
      :key="`${cell.c}-${cell.r}`"
      :x="cell.x"
      :y="cell.y"
      width="10"
      height="10"
      rx="2"
      class="cell"
      :class="cell.level ? 'fill-(--accent)' : 'fill-line'"
      :style="{ '--c': cell.c, '--r': cell.r, fillOpacity: LEVEL_OPACITY[cell.level] }"
    />
    <rect x="11" y="110" width="36" height="3" rx="1.5" class="fill-line" />
    <rect
      v-for="level in 5"
      :key="level"
      :x="186 + (level - 1) * 9"
      y="108"
      width="7"
      height="7"
      rx="1.5"
      :class="level > 1 ? 'fill-(--accent)' : 'fill-line'"
      :style="{ fillOpacity: LEVEL_OPACITY[level - 1] }"
    />
  </svg>
</template>

<style scoped>
.cell {
  transform-box: fill-box;
  transform-origin: center;
}

.art-host:is(:hover, :focus-within) .cell {
  animation: sparkle 700ms ease-out backwards;
  animation-delay: calc((var(--c) + var(--r)) * 24ms);
}

@keyframes sparkle {
  35% {
    scale: 1.4;
    fill: var(--accent);
    fill-opacity: 1;
  }
}
</style>
