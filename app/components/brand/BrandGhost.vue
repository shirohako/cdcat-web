<script setup lang="ts">
/**
 * CDCat's mascot, a little cat ghost, as an SVG group for the list headers' pictures (HeaderArt*): white with a dark
 * line, pink ears and cheeks, two dot eyes, and a ω smile or, singing, an open mouth. It is drawn in a 16 × 17.3 box
 * from its top-left corner; place it with `transform` (translate, rotate round 8 8.6, scale). It floats gently
 * unless `float` is off, blinks `blinkDelay` ms after mounting, and blinks again whenever the picture it is in
 * (`.header-art`) is pointed at. Its colours are its own, the same in both themes.
 */
withDefaults(defineProps<{
  mouth?: 'smile' | 'sing'
  float?: boolean
  blinkDelay?: number
}>(), { mouth: 'smile', float: true, blinkDelay: 1300 })
</script>

<template>
  <g>
    <g :class="{ 'ghost-float': float }">
      <path
        d="M 0 16 C 0 11.2, -0.1 6.8, 0.4 4.2 L 1.6 0 L 4.8 2.5 C 6.9 2, 9.1 2, 11.2 2.5 L 14.4 0 L 15.6 4.2 C 16.1 6.8, 16 11.2, 16 16 Q 14 18.6 12 16 Q 10 18.6 8 16 Q 6 18.6 4 16 Q 2 18.6 0 16 Z"
        fill="#ffffff"
        stroke="#1f1d27"
        stroke-width="1.1"
        stroke-linejoin="round"
      />
      <path d="M 1.94 1.12 L 3.54 2.37 L 1.34 3.22 Z" fill="#f6b6c6" />
      <path d="M 14.06 1.12 L 12.46 2.37 L 14.66 3.22 Z" fill="#f6b6c6" />
      <!-- Two groups: the blink on mounting and the one on pointing, so neither replays the other -->
      <g class="blink-load" :style="{ animationDelay: `${blinkDelay}ms` }">
        <g class="blink-hover" fill="#1f1d27">
          <ellipse cx="5.2" cy="8.2" rx="1.3" ry="1.65" />
          <ellipse cx="10.8" cy="8.2" rx="1.3" ry="1.65" />
        </g>
      </g>
      <ellipse cx="3.8" cy="10.7" rx="1" ry="0.55" fill="#f6b6c6" />
      <ellipse cx="12.2" cy="10.7" rx="1" ry="0.55" fill="#f6b6c6" />
      <ellipse v-if="mouth === 'sing'" cx="8" cy="10.6" rx="0.75" ry="0.95" fill="#1f1d27" />
      <path v-else d="M 7.2 10.1 Q 7.6 10.6 8 10.2 Q 8.4 10.6 8.8 10.1" fill="none" stroke="#1f1d27" stroke-width="0.6" stroke-linecap="round" stroke-linejoin="round" />
    </g>
  </g>
</template>

<style scoped>
.ghost-float {
  animation: ghost-float 3.2s ease-in-out infinite;
}

.blink-load,
.blink-hover {
  transform-box: fill-box;
  transform-origin: center;
}

.blink-load {
  animation: ghost-blink 260ms ease-in-out;
}

.header-art:hover .blink-hover {
  animation: ghost-blink 260ms ease-in-out;
}

@keyframes ghost-float {
  50% { translate: 0 -0.9px; }
}

@keyframes ghost-blink {
  50% { scale: 1 0.1; }
}

@media (prefers-reduced-motion: reduce) {
  .ghost-float,
  .blink-load,
  .header-art:hover .blink-hover {
    animation: none;
  }
}
</style>
