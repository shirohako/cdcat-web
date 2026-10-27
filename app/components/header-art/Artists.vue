<script setup lang="ts">
/**
 * The artist list's header picture: a vintage stage microphone in the theme colour, and the cat ghost singing into it
 * while notes float up. When the page loads the microphone pops up from its stand; the notes keep rising and fading
 * one after the other; pointed at, the microphone leans towards the singer. Decorative: the heading names the page.
 */
</script>

<template>
  <!-- As tall as the title and the description together -->
  <svg class="header-art aspect-[56/40] h-14 w-auto shrink-0 overflow-visible sm:h-15" viewBox="0 0 56 40" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <g class="mic-in">
      <g class="mic">
        <!-- the stand and its base -->
        <ellipse cx="15" cy="36.6" rx="7.5" ry="1.9" class="fill-primary" />
        <rect x="14.2" y="27" width="1.6" height="9.6" class="fill-primary-strong" />
        <rect x="13.6" y="24.6" width="2.8" height="3" rx="0.6" class="fill-primary" />
        <!-- the yoke round the head -->
        <path d="M 9.4 16.5 Q 9.4 25.6 15 25.6 Q 20.6 25.6 20.6 16.5" class="stroke-primary" stroke-width="1.6" />
        <!-- the head: a capsule with its grille, a band, a light and a shine -->
        <rect x="9.2" y="3.5" width="11.6" height="18" rx="5.8" class="fill-primary" />
        <path d="M 10.8 7.5 H 19.2 M 10.4 10 H 19.6 M 10.4 12.5 H 19.6" class="stroke-on-primary/25" stroke-width="0.7" />
        <rect x="9.2" y="14.2" width="11.6" height="1.6" class="fill-primary-strong" />
        <circle cx="15" cy="18.4" r="0.8" fill="#f29db3" />
        <rect x="11" y="5.8" width="1.5" height="6.4" rx="0.75" class="fill-white/20" />
      </g>
    </g>

    <!-- The singer -->
    <BrandGhost transform="translate(26.5 15) rotate(-8 8 8.6)" mouth="sing" />

    <!-- Notes rising from the song -->
    <g class="note note-a">
      <g transform="translate(44.6 9.8)">
        <ellipse cx="0" cy="4" rx="1.8" ry="1.35" transform="rotate(-20 0 4)" fill="#f29db3" />
        <path d="M 1.55 3.6 V -2.6 Q 4 -1.6 4.1 0.8" stroke="#f29db3" stroke-width="1" />
      </g>
    </g>
    <g class="note note-b">
      <g transform="translate(50 3.6) scale(0.8)">
        <ellipse cx="0" cy="4" rx="1.8" ry="1.35" transform="rotate(-20 0 4)" fill="#b6a4f0" />
        <path d="M 1.55 3.6 V -2.6 Q 4 -1.6 4.1 0.8" stroke="#b6a4f0" stroke-width="1" />
      </g>
    </g>
  </svg>
</template>

<style scoped>
.mic-in,
.mic {
  transform-box: fill-box;
  transform-origin: 50% 100%;
}

.mic-in {
  animation: mic-in 520ms cubic-bezier(0.34, 1.56, 0.64, 1) backwards;
}

.mic {
  transition: rotate 450ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

.header-art:hover .mic {
  rotate: 7deg;
}

.note {
  animation: note-rise 2.8s ease-in-out infinite;
}

.note-b {
  animation-delay: 1.4s;
}

@keyframes mic-in {
  from { opacity: 0; scale: 0.8; }
}

@keyframes note-rise {
  0% { opacity: 0; translate: 0 2px; }
  25%,
  70% { opacity: 1; }
  100% { opacity: 0; translate: 0 -2.5px; }
}

@media (prefers-reduced-motion: reduce) {
  .mic-in,
  .note {
    animation: none;
  }

  .mic {
    transition: none;
  }
}
</style>
