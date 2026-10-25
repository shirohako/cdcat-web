<script setup lang="ts">
/**
 * 开发者友好: an API response in a code window, keys in the card's colour. Hovering the card types the values out
 * again, line by line, and sets the cursor blinking.
 */
const ROWS: { x: number, key?: number, values: number[], bracket?: boolean }[] = [
  { x: 46, values: [], bracket: true },
  { x: 54, key: 26, values: [50] },
  { x: 54, key: 20, values: [64] },
  { x: 54, key: 30, values: [22, 18] },
  { x: 54, key: 24, values: [], bracket: true },
  { x: 62, values: [58, 24] },
  { x: 46, values: [], bracket: true },
]

const rows = ROWS.map((row, index) => {
  const y = 44 + index * 10
  let x = row.x
  const key = row.key ? { x, width: row.key } : null
  if (key) x += key.width + 4
  const bracket = row.bracket ? { x, width: 6 } : null
  if (bracket) x += 10
  const values = row.values.map((width) => {
    const value = { x, width }
    x += width + 4
    return value
  })
  return { y, key, bracket, values, end: x - 1 }
})
const cursor = rows[5]!
</script>

<template>
  <svg viewBox="0 0 240 128" class="size-full" aria-hidden="true">
    <rect x="34" y="14" width="172" height="100" rx="4" stroke-width="1" class="fill-card stroke-line" />
    <circle cx="46" cy="25" r="2.4" class="fill-danger/60" />
    <circle cx="55" cy="25" r="2.4" class="fill-warning/60" />
    <circle cx="64" cy="25" r="2.4" class="fill-success/60" />
    <text x="76" y="27.4" font-size="7" class="fill-meta font-mono">GET /v1/albums/42</text>
    <rect x="179" y="19.5" width="19" height="11" rx="2" class="fill-success/15" />
    <text x="188.5" y="27.2" font-size="6.5" text-anchor="middle" class="fill-success font-mono">200</text>
    <line x1="34" x2="206" y1="36" y2="36" stroke-width="1" class="stroke-line" />

    <g v-for="(row, index) in rows" :key="index">
      <rect v-if="row.key" :x="row.key.x" :y="row.y" :width="row.key.width" height="4" rx="2" class="fill-(--accent)" />
      <rect v-if="row.bracket" :x="row.bracket.x" :y="row.y" :width="row.bracket.width" height="4" rx="2" class="fill-meta" />
      <rect
        v-for="(value, column) in row.values"
        :key="column"
        :x="value.x"
        :y="row.y"
        :width="value.width"
        height="4"
        rx="2"
        class="value fill-faint"
        :style="{ '--d': `${index * 90 + column * 60}ms` }"
      />
    </g>
    <rect :x="cursor.end + 2" :y="cursor.y - 2" width="2" height="8" class="cursor fill-(--accent)" />
  </svg>
</template>

<style scoped>
.value {
  transform-box: fill-box;
  transform-origin: left center;
}

.art-host:is(:hover, :focus-within) .value {
  animation: type 420ms cubic-bezier(0.3, 0.7, 0.2, 1) var(--d) backwards;
}

.art-host:is(:hover, :focus-within) .cursor {
  animation: blink 1s steps(1) infinite;
}

@keyframes type {
  from { scale: 0 1; }
}

@keyframes blink {
  50% { opacity: 0; }
}
</style>
