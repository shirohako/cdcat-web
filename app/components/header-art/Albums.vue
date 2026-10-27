<script setup lang="ts">
/**
 * The album list's header picture: a square album case in the theme colour, with an obi down its left side and a
 * little cat ghost printed on the cover, and a silver CD half out of it. Thin rainbow arcs on the disc show it
 * turning. The ghost, the obi and the disc keep their own colours, as printed things do; the case follows the theme.
 * When the page loads the case pops in and the disc rolls halfway out of it, turning once; pointed at, the disc turns
 * once more. The ghost (BrandGhost) floats and blinks on its own. Decorative: the heading next to it names the page.
 */
</script>

<template>
  <!-- As tall as the title and the description together -->
  <svg class="header-art album-art aspect-[56/40] h-14 w-auto shrink-0 overflow-visible sm:h-15" viewBox="0 0 56 40" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <!-- The disc, its centre on the case's edge so half of it is out -->
    <g class="disc">
      <circle cx="38" cy="20" r="16.5" fill="#e4e7ee" stroke="#a9adbd" stroke-width="0.9" />
      <!-- The shimmer a CD throws: two opposite sets of thin rainbow arcs, flat colours, which show it turning -->
      <g stroke-width="1.5">
        <path d="M 43.09 7.39 A 13.6 13.6 0 0 1 50.61 14.91 M 32.91 32.61 A 13.6 13.6 0 0 1 25.39 25.1" stroke="#f4a6c6" />
        <path d="M 42.35 9.24 A 11.6 11.6 0 0 1 48.76 15.66 M 33.65 30.76 A 11.6 11.6 0 0 1 27.24 24.35" stroke="#b6a4f0" />
        <path d="M 41.6 11.1 A 9.6 9.6 0 0 1 46.9 16.4 M 34.4 28.9 A 9.6 9.6 0 0 1 29.1 23.6" stroke="#84cdf2" />
      </g>
      <!-- the clear hub, small as on a real disc, and the hole -->
      <circle cx="38" cy="20" r="4.2" fill="#f2f3f7" stroke="#b9bccb" stroke-width="0.5" />
      <circle cx="38" cy="20" r="3" stroke="#cdd0db" stroke-width="0.45" />
      <circle cx="38" cy="20" r="1.7" class="fill-card" stroke="#a9adbd" stroke-width="0.6" />
    </g>

    <!-- The case -->
    <g class="case">
      <rect x="2" y="2" width="36" height="36" rx="2.5" class="fill-primary" />
      <!-- the cover under the lid, a shade off the frame, with a gloss in its corner and the title under the ghost -->
      <rect x="11.6" y="3.6" width="24.8" height="32.8" rx="0.8" class="fill-primary-strong" />
      <path d="M 27.5 3.6 H 35.6 Q 36.4 3.6 36.4 4.4 V 12.5 Z" class="fill-white/10" />
      <rect x="15.2" y="28.4" width="17.6" height="1.4" rx="0.7" class="fill-on-primary/70" />
      <rect x="19.2" y="31" width="9.6" height="1.1" rx="0.55" class="fill-on-primary/40" />

      <!-- the obi, wrapped round the spine: a pink mark and a column of text -->
      <rect x="4.4" y="2" width="6.2" height="36" fill="#f6f4fa" />
      <rect x="5.3" y="4.4" width="4.4" height="3.2" rx="0.6" fill="#f29db3" />
      <g fill="#3a3542">
        <rect x="6.6" y="9.4" width="1.8" height="0.9" rx="0.45" />
        <rect x="6.6" y="11.2" width="1.8" height="0.9" rx="0.45" />
        <rect x="6.6" y="13" width="1.8" height="0.9" rx="0.45" />
        <rect x="6.6" y="14.8" width="1.8" height="0.9" rx="0.45" />
        <rect x="6.6" y="16.6" width="1.8" height="0.9" rx="0.45" />
        <rect x="6.6" y="18.4" width="1.8" height="0.9" rx="0.45" />
        <g opacity="0.5">
          <rect x="6.6" y="22.2" width="1.8" height="0.9" rx="0.45" />
          <rect x="6.6" y="24" width="1.8" height="0.9" rx="0.45" />
          <rect x="6.6" y="25.8" width="1.8" height="0.9" rx="0.45" />
          <rect x="5.6" y="33.2" width="3.8" height="0.7" rx="0.35" />
        </g>
      </g>

      <!-- The cat ghost printed on the cover -->
      <BrandGhost transform="translate(16 7.4) rotate(-5 8 8.6)" />
    </g>
  </svg>
</template>

<style scoped>
.album-art .case,
.album-art .disc {
  transform-box: fill-box;
  transform-origin: center;
}

.album-art .case {
  animation: case-in 380ms cubic-bezier(0.34, 1.56, 0.64, 1) backwards;
}

/* From inside the case to halfway out, turning once and overshooting a little. Filling only backwards: an animation
   that kept holding `rotate` after it ended would override the hover's transition, and the disc would jump. */
.album-art .disc {
  animation: disc-out 1000ms cubic-bezier(0.22, 1, 0.36, 1) 200ms backwards;
  transition: rotate 1000ms cubic-bezier(0.22, 1, 0.36, 1);
}

.album-art:hover .disc {
  rotate: 360deg;
}

@keyframes case-in {
  from { opacity: 0; scale: 0.85; }
}

@keyframes disc-out {
  0% { translate: -16.5px 0; rotate: -360deg; }
  75% { translate: 1.5px 0; rotate: 10deg; }
  100% { translate: 0 0; rotate: 0deg; }
}

@media (prefers-reduced-motion: reduce) {
  .album-art .case,
  .album-art .disc {
    animation: none;
    transition: none;
  }
}
</style>
