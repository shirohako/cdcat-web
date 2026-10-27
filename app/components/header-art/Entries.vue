<script setup lang="ts">
/**
 * The entry list's header picture (games, anime and the other works albums belong to): a retro television in the
 * theme colour with the cat ghost on its screen, two knobs, a speaker and a pink and lavender antenna. When the page
 * loads the set pops in and its screen comes on like a CRT, a bright line opening into the picture; pointed at, the
 * antenna wobbles. Decorative: the heading names the page.
 */
</script>

<template>
  <!-- As tall as the title and the description together -->
  <svg class="header-art aspect-[56/40] h-14 w-auto shrink-0 overflow-visible sm:h-15" viewBox="0 0 56 40" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <g class="tv">
      <!-- the antenna, behind the set -->
      <g class="antenna">
        <path d="M 28 9 L 21.5 2.6 M 28 9 L 35.5 2.4" class="stroke-primary" stroke-width="1.2" />
        <circle cx="21.5" cy="2.6" r="1.1" fill="#f29db3" />
        <circle cx="35.5" cy="2.4" r="1.1" fill="#b6a4f0" />
      </g>
      <path d="M 25.6 9 A 2.4 2.4 0 0 1 30.4 9 Z" class="fill-primary-strong" />

      <!-- the set, its feet and a shine on its corner -->
      <rect x="12" y="34.6" width="3" height="2.8" rx="0.8" class="fill-primary-strong" />
      <rect x="41" y="34.6" width="3" height="2.8" rx="0.8" class="fill-primary-strong" />
      <rect x="7" y="9" width="42" height="26" rx="4" class="fill-primary" />
      <path d="M 11 9 H 17 L 7 17 V 13 A 4 4 0 0 1 11 9 Z" class="fill-white/10" />

      <!-- the screen, with the ghost on it, faint scanlines and a glare -->
      <rect x="10" y="12" width="26" height="20" rx="3" class="fill-primary-strong" />
      <rect x="11" y="13" width="24" height="18" rx="2.4" fill="#eeeaf8" />
      <BrandGhost transform="translate(16.44 15.41) scale(0.82)" />
      <path d="M 11.5 16 H 34.5 M 11 19 H 35 M 11 22 H 35 M 11 25 H 35 M 11 28 H 35" stroke="#1f1d27" stroke-opacity="0.05" stroke-width="0.6" />
      <path d="M 13.4 13 H 21 L 11 21.5 V 15.4 A 2.4 2.4 0 0 1 13.4 13 Z" class="fill-white/50" />
      <!-- the picture coming on -->
      <rect class="crt" x="11" y="13" width="24" height="18" rx="2.4" fill="#ffffff" />

      <!-- the controls: a light, two knobs and the speaker -->
      <circle cx="45.2" cy="12.6" r="0.8" fill="#f29db3" />
      <circle cx="42" cy="17" r="2.3" class="fill-primary-strong" />
      <path d="M 42 17 V 15.2" class="stroke-on-primary/60" stroke-width="0.7" />
      <circle cx="42" cy="23.5" r="2.3" class="fill-primary-strong" />
      <path d="M 42 23.5 L 43.4 22.4" class="stroke-on-primary/60" stroke-width="0.7" />
      <path d="M 39.6 28 H 44.4 M 39.6 29.6 H 44.4 M 39.6 31.2 H 44.4" class="stroke-on-primary/30" stroke-width="0.8" />
    </g>
  </svg>
</template>

<style scoped>
.tv {
  transform-box: fill-box;
  transform-origin: 50% 100%;
  animation: tv-in 460ms cubic-bezier(0.34, 1.56, 0.64, 1) backwards;
}

/* A bright line that opens into the picture and fades, as an old set warming up. */
.crt {
  opacity: 0;
  transform-box: fill-box;
  transform-origin: center;
  animation: crt-on 700ms ease-out 320ms backwards;
}

.antenna {
  transform-box: view-box;
  transform-origin: 28px 9px;
}

.header-art:hover .antenna {
  animation: wobble 600ms ease-in-out;
}

@keyframes tv-in {
  from { opacity: 0; scale: 0.85; }
}

@keyframes crt-on {
  0% { opacity: 1; scale: 1 0.04; }
  45% { opacity: 1; scale: 1 1; }
  100% { opacity: 0; scale: 1 1; }
}

@keyframes wobble {
  25% { rotate: -9deg; }
  60% { rotate: 6deg; }
  85% { rotate: -2deg; }
}

@media (prefers-reduced-motion: reduce) {
  .tv,
  .crt,
  .header-art:hover .antenna {
    animation: none;
  }
}
</style>
