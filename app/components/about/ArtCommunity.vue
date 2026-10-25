<script setup lang="ts">
/**
 * 综合音乐社区: two speech bubbles, one sharing a track. Hovering the card sets the equaliser bouncing and the notes
 * floating up.
 */
const BARS = [14, 22, 10, 26, 18, 12, 24, 16].map((height, index) => ({
  x: 140 + index * 7,
  height,
  duration: `${700 + (index % 3) * 160}ms`,
  delay: `${index * 70}ms`,
}))
const NOTES = [
  { x: 166, y: 34, delay: '0ms' },
  { x: 188, y: 26, delay: '600ms' },
]
</script>

<template>
  <svg viewBox="0 0 240 128" class="size-full" aria-hidden="true">
    <g class="bubble">
      <path d="M37 18H121Q128 18 128 25V63Q128 70 121 70H58L42 82L46 70H37Q30 70 30 63V25Q30 18 37 18Z" class="fill-(--accent-soft)" />
      <rect x="42" y="31" width="62" height="4" rx="2" class="fill-(--accent) opacity-60" />
      <rect x="42" y="41" width="72" height="4" rx="2" class="fill-(--accent) opacity-60" />
      <rect x="42" y="51" width="40" height="4" rx="2" class="fill-(--accent) opacity-60" />
    </g>

    <path
      d="M113 54H201Q208 54 208 61V101Q208 108 201 108H196L200 119L184 108H113Q106 108 106 101V61Q106 54 113 54Z"
      stroke-width="1"
      class="fill-card stroke-line"
    />
    <circle cx="123" cy="81" r="9" class="fill-(--accent)" />
    <path d="M120 76.5L128 81L120 85.5Z" class="fill-(--on-accent)" />
    <rect
      v-for="(bar, index) in BARS"
      :key="index"
      :x="bar.x"
      :y="94 - bar.height"
      width="4"
      :height="bar.height"
      rx="1.5"
      class="bar"
      :class="index % 2 ? 'fill-(--accent) opacity-60' : 'fill-(--accent)'"
      :style="{ '--duration': bar.duration, '--d': bar.delay }"
    />

    <g v-for="(note, index) in NOTES" :key="index" :transform="`translate(${note.x} ${note.y})`">
      <g class="note" :style="{ '--d': note.delay }">
        <ellipse rx="3.4" ry="2.6" transform="rotate(-20)" class="fill-(--accent)" />
        <path d="M3 -1V-14Q8 -12 8 -7" stroke-width="1.4" stroke-linecap="round" class="fill-none stroke-(--accent)" />
      </g>
    </g>
  </svg>
</template>

<style scoped>
.bubble {
  transition: translate 400ms cubic-bezier(0.3, 0.7, 0.2, 1);
}

.art-host:is(:hover, :focus-within) .bubble {
  translate: 0 -3px;
}

.bar {
  transform-box: fill-box;
  transform-origin: bottom;
}

.art-host:is(:hover, :focus-within) .bar {
  animation: bounce var(--duration) ease-in-out var(--d) infinite alternate;
}

@keyframes bounce {
  to { scale: 1 0.35; }
}

.note {
  opacity: 0.55;
  transition: opacity 300ms ease-out;
}

.art-host:is(:hover, :focus-within) .note {
  animation: float 1.8s ease-out var(--d) infinite;
}

@keyframes float {
  from { opacity: 0; translate: 0 6px; }
  30% { opacity: 1; }
  to { opacity: 0; translate: 0 -12px; }
}
</style>
