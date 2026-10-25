<script setup lang="ts">
/**
 * 完善的关联: a disc at the centre of a small graph whose nodes (games, anime, films …) each take their own hue,
 * turned from the card's by --k degrees. Hovering the card lights each link in its node's colour, outwards, while
 * the centre pings.
 */
const CENTRE = { x: 120, y: 64 }
const NODES = [
  { x: 46, y: 40, k: 70 },
  { x: 96, y: 17, k: 30 },
  { x: 176, y: 20, k: -70 },
  { x: 202, y: 82, k: 200 },
  { x: 140, y: 112, k: -140 },
  { x: 64, y: 104, k: 140 },
]
const CROSS_LINKS: [number, number][] = [[0, 1], [2, 3], [4, 5]]
</script>

<template>
  <svg viewBox="0 0 240 128" class="size-full" aria-hidden="true">
    <line
      v-for="([from, to], index) in CROSS_LINKS"
      :key="`cross-${index}`"
      :x1="NODES[from]!.x"
      :y1="NODES[from]!.y"
      :x2="NODES[to]!.x"
      :y2="NODES[to]!.y"
      stroke-width="1"
      stroke-dasharray="2 3"
      class="stroke-line"
    />
    <g v-for="(node, index) in NODES" :key="index" :style="{ '--k': node.k, '--d': `${index * 70}ms` }" class="hued">
      <line :x1="CENTRE.x" :y1="CENTRE.y" :x2="node.x" :y2="node.y" stroke-width="1.25" class="stroke-line" />
      <line :x1="CENTRE.x" :y1="CENTRE.y" :x2="node.x" :y2="node.y" stroke-width="1.75" stroke-linecap="round" pathLength="1" class="glow" />
    </g>

    <circle :cx="CENTRE.x" :cy="CENTRE.y" r="15" stroke-width="1.5" class="ping fill-none stroke-(--accent)" />
    <circle :cx="CENTRE.x" :cy="CENTRE.y" r="15" class="fill-(--accent)" />
    <circle :cx="CENTRE.x" :cy="CENTRE.y" r="9" stroke-width="1" class="fill-none stroke-(--on-accent) opacity-40" />
    <circle :cx="CENTRE.x" :cy="CENTRE.y" r="3" class="fill-card" />

    <g v-for="(node, index) in NODES" :key="`node-${index}`" :style="{ '--k': node.k, '--d': `${index * 70 + 120}ms` }" class="hued">
      <g class="node">
        <circle :cx="node.x" :cy="node.y" r="9" stroke-width="1.5" class="node-ring" />
        <circle :cx="node.x" :cy="node.y" r="3" class="node-dot" />
      </g>
    </g>
  </svg>
</template>

<style scoped>
.hued {
  --node: oklch(var(--accent-l) var(--accent-c) calc(var(--hue) + var(--shift, 0) + var(--k)));
}

.glow {
  fill: none;
  stroke: var(--node);
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  transition: stroke-dashoffset 200ms ease-out;
}

.art-host:is(:hover, :focus-within) .glow {
  stroke-dashoffset: 0;
  transition: stroke-dashoffset 450ms cubic-bezier(0.3, 0.7, 0.2, 1) var(--d);
}

.node {
  transform-box: fill-box;
  transform-origin: center;
  transition: scale 300ms cubic-bezier(0.3, 0.7, 0.2, 1);
}

.art-host:is(:hover, :focus-within) .node {
  scale: 1.18;
  transition-delay: var(--d);
}

.node-ring {
  fill: color-mix(in oklab, var(--node) 22%, var(--card));
  stroke: var(--node);
}

.node-dot {
  fill: var(--node);
}

.ping {
  transform-box: fill-box;
  transform-origin: center;
  opacity: 0;
}

.art-host:is(:hover, :focus-within) .ping {
  animation: ping 1.6s cubic-bezier(0, 0, 0.2, 1) infinite;
}

@keyframes ping {
  from { opacity: 0.8; }
  to { scale: 2; opacity: 0; }
}
</style>
