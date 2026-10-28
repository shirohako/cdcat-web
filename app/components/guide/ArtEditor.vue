<script setup lang="ts">
/**
 * 提交新专辑与更正错误: the album editor in a small window, its section list on the left and the basic section on the
 * right. Hovering the host (.art-host) fills it in: the cover lands in its dashed slot, the fields type themselves
 * out one after another, and the required checklist ticks off.
 */
const SECTIONS = [20, 30, 40, 50, 60]
const FIELDS = [
  { y: 30, width: 62 },
  { y: 46, width: 40 },
  { y: 62, width: 52 },
]
const CHECKS = [84, 94, 104]
</script>

<template>
  <svg viewBox="0 0 240 128" class="size-full" aria-hidden="true">
    <rect x="30" y="10" width="180" height="110" rx="5" class="fill-card stroke-line" stroke-width="1" />
    <line x1="30" x2="210" y1="18" y2="18" class="stroke-line" stroke-width="1" />
    <circle v-for="x in [37, 43, 49]" :key="x" :cx="x" cy="14" r="1.5" class="fill-line" />

    <!-- The section list, the first one open. -->
    <rect x="36" :y="SECTIONS[0]! - 3" width="38" height="8" rx="2" class="fill-(--accent-soft)" />
    <rect v-for="(y, index) in SECTIONS" :key="y" x="40" :y="y" :width="index ? 24 : 28" height="2" rx="1" :class="index ? 'fill-line' : 'fill-(--accent)'" />
    <line x1="78" x2="78" y1="18" y2="120" class="stroke-line" stroke-width="1" />

    <!-- The required checklist under it. -->
    <g v-for="(y, index) in CHECKS" :key="`c${y}`" :style="{ '--d': `${700 + index * 160}ms` }">
      <circle cx="42" :cy="y" r="3.2" class="fill-none stroke-line" stroke-width="1" />
      <circle cx="42" :cy="y" r="3.2" class="tick-fill fill-success" />
      <path :d="`M40.4 ${y}l1.2 1.2 2.2-2.4`" pathLength="1" class="tick fill-none stroke-card" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round" />
      <rect x="49" :y="y - 1" width="20" height="2" rx="1" class="fill-line" />
    </g>

    <!-- The cover slot, and the cover dropping into it. -->
    <rect x="86" y="26" width="44" height="44" rx="3" class="fill-sunken stroke-faint" stroke-width="1" stroke-dasharray="3 2.5" />
    <g class="cover">
      <rect x="86" y="26" width="44" height="44" rx="3" class="fill-(--accent)" />
      <circle cx="120" cy="36" r="4.5" class="fill-card opacity-85" />
      <path d="M86 60l12-12 9 9 7-6 16 14v2a3 3 0 0 1-3 3H89a3 3 0 0 1-3-3Z" class="fill-card opacity-35" />
    </g>

    <g v-for="(field, index) in FIELDS" :key="`f${field.y}`" :style="{ '--d': `${200 + index * 160}ms` }">
      <rect x="138" :y="field.y - 6" width="64" height="12" rx="2.5" class="fill-card stroke-line" stroke-width="1" />
      <rect x="142" :y="field.y - 1" :width="field.width - 12" height="2" rx="1" class="typed fill-title" />
    </g>
    <rect x="138" y="80" width="64" height="12" rx="2.5" class="fill-card stroke-line" stroke-width="1" />
    <rect x="142" y="85" width="2" height="2" rx="1" class="caret fill-(--accent)" />

    <rect x="160" y="102" width="42" height="11" rx="2.5" class="fill-(--accent)" />
    <rect x="170" y="106.5" width="22" height="2" rx="1" class="fill-(--on-accent)" />
  </svg>
</template>

<style scoped>
.cover {
  transform-box: fill-box;
  transform-origin: center;
  opacity: 0;
  scale: 0.85;
  transition: opacity 200ms ease-out, scale 200ms ease-out;
}

.art-host:is(:hover, :focus-within) .cover {
  opacity: 1;
  scale: 1;
  transition: opacity 300ms ease-out, scale 450ms cubic-bezier(0.3, 1.4, 0.4, 1);
}

.typed {
  transform-box: fill-box;
  transform-origin: left;
  scale: 0 1;
  transition: scale 200ms ease-out;
}

.art-host:is(:hover, :focus-within) .typed {
  scale: 1 1;
  transition: scale 420ms steps(6, end) var(--d);
}

.tick-fill {
  opacity: 0;
  transition: opacity 150ms ease-out;
}

.tick {
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  transition: stroke-dashoffset 150ms ease-out;
}

.art-host:is(:hover, :focus-within) .tick-fill {
  opacity: 1;
  transition: opacity 200ms ease-out var(--d);
}

.art-host:is(:hover, :focus-within) .tick {
  stroke-dashoffset: 0;
  transition: stroke-dashoffset 250ms ease-out calc(var(--d) + 120ms);
}

.caret {
  animation: blink 1s steps(1, end) infinite;
}

@keyframes blink {
  50% { opacity: 0; }
}
</style>
