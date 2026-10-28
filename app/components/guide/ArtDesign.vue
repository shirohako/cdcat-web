<script setup lang="ts">
/**
 * 了解 CDCat 的设计: a blueprint. A disc on graph paper with a dimension line over it, and four blocks around it
 * (artists, events, entries, series), each in its own hue, wired to the disc with right-angled leads. Hovering the
 * host (.art-host) draws the leads in their blocks' colours, outwards, while the disc turns and the blocks lift.
 */
const CENTRE = { x: 120, y: 66 }
const NODES = [
  { x: 44, y: 32, k: 70, lead: 'M94 58H66V32H56' },
  { x: 44, y: 100, k: -70, lead: 'M94 74H66V100H56' },
  { x: 196, y: 32, k: 150, lead: 'M146 58H174V32H184' },
  { x: 196, y: 100, k: -150, lead: 'M146 74H174V100H184' },
]
const GRID = Array.from({ length: 21 }, (_, index) => index * 12)
</script>

<template>
  <svg viewBox="0 0 240 128" class="size-full" aria-hidden="true">
    <g class="stroke-line opacity-50" stroke-width="0.5">
      <line v-for="x in GRID" :key="`x${x}`" :x1="x" :x2="x" y1="0" y2="128" />
      <line v-for="y in GRID.slice(0, 11)" :key="`y${y}`" x1="0" x2="240" :y1="y" :y2="y" />
    </g>

    <!-- The dimension line: ticks at the disc's edges, a label box in the middle. -->
    <g class="stroke-faint" stroke-width="0.75">
      <line x1="94" x2="146" y1="24" y2="24" />
      <line x1="94" x2="94" y1="20" y2="28" />
      <line x1="146" x2="146" y1="20" y2="28" />
      <line x1="94" x2="94" y1="28" y2="40" stroke-dasharray="1.5 2" />
      <line x1="146" x2="146" y1="28" y2="40" stroke-dasharray="1.5 2" />
    </g>
    <rect x="110" y="19" width="20" height="10" rx="2" class="fill-card stroke-line" stroke-width="0.75" />
    <rect x="114" y="23" width="12" height="2" rx="1" class="fill-(--accent)" />

    <g v-for="(node, index) in NODES" :key="index" :style="{ '--k': node.k, '--d': `${index * 80}ms` }" class="hued">
      <path :d="node.lead" stroke-width="1" class="fill-none stroke-line" />
      <path :d="node.lead" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" pathLength="1" class="lead" />
    </g>

    <g class="disc">
      <circle :cx="CENTRE.x" :cy="CENTRE.y" r="26" class="fill-card stroke-line" stroke-width="1" />
      <circle :cx="CENTRE.x" :cy="CENTRE.y" r="19" class="fill-none stroke-line" stroke-width="0.75" />
      <path d="M134 47.6A23 23 0 0 1 143 66" class="fill-none stroke-(--accent)" stroke-width="2" stroke-linecap="round" />
      <circle :cx="CENTRE.x" :cy="CENTRE.y" r="9" class="fill-sunken stroke-line" stroke-width="0.75" />
      <circle :cx="CENTRE.x" :cy="CENTRE.y" r="2.5" class="fill-page stroke-line" stroke-width="0.75" />
    </g>

    <g v-for="(node, index) in NODES" :key="`node${index}`" :style="{ '--k': node.k, '--d': `${index * 80 + 160}ms` }" class="hued">
      <g class="block-node">
        <rect :x="node.x - 14" :y="node.y - 10" width="28" height="20" rx="3" stroke-width="1" class="node-box" />
        <circle :cx="node.x - 6" :cy="node.y - 2" r="3" class="node-ink" />
        <rect :x="node.x - 1" :y="node.y - 4" width="10" height="2" rx="1" class="node-ink" />
        <rect :x="node.x - 9" :y="node.y + 4" width="18" height="2" rx="1" class="fill-line" />
      </g>
    </g>
  </svg>
</template>

<style scoped>
.hued {
  --node: oklch(var(--accent-l) var(--accent-c) calc(var(--hue) + var(--shift, 0) + var(--k)));
}

.lead {
  fill: none;
  stroke: var(--node);
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  transition: stroke-dashoffset 200ms ease-out;
}

.art-host:is(:hover, :focus-within) .lead {
  stroke-dashoffset: 0;
  transition: stroke-dashoffset 450ms cubic-bezier(0.3, 0.7, 0.2, 1) var(--d);
}

.node-box {
  fill: color-mix(in oklab, var(--node) 16%, var(--card));
  stroke: var(--node);
}

.node-ink {
  fill: var(--node);
}

.block-node {
  transform-box: fill-box;
  transform-origin: center;
  transition: translate 300ms cubic-bezier(0.3, 0.7, 0.2, 1);
}

.art-host:is(:hover, :focus-within) .block-node {
  translate: 0 -2px;
  transition-delay: var(--d);
}

.disc {
  transform-box: fill-box;
  transform-origin: center;
  transition: rotate 700ms ease-out;
}

.art-host:is(:hover, :focus-within) .disc {
  rotate: 120deg;
}
</style>
