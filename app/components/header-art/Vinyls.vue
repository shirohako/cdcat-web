<script setup lang="ts">
/**
 * The vinyl list's header picture: a white turntable with a black tonearm, which keeps its colours in every theme, and
 * on its silver platter a record in the theme colour, the cat ghost printed on its pink label. When the page loads the
 * record spins up (the ghost on the label shows it turning) and the tonearm swings onto it; pointed at, the record
 * turns once more. Decorative: the heading names the page.
 */
</script>

<template>
  <!-- As tall as the title and the description together -->
  <svg class="header-art aspect-[56/40] h-14 w-auto shrink-0 overflow-visible sm:h-15" viewBox="0 0 56 40" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <g class="deck">
      <!-- The player keeps its own colours, a white deck with a black arm; the theme colour is the record's. -->
      <!-- the plinth, its feet and a shine on its corner -->
      <rect x="6" y="35.4" width="3.4" height="1.8" rx="0.6" fill="#cfccd9" />
      <rect x="46.6" y="35.4" width="3.4" height="1.8" rx="0.6" fill="#cfccd9" />
      <rect x="2.5" y="5" width="51" height="31" rx="3.2" fill="#f2f0f6" stroke="#cfccd9" stroke-width="0.8" />
      <path d="M 5.7 5.4 H 13 L 2.9 13 V 8.2 A 2.8 2.8 0 0 1 5.7 5.4 Z" fill="#ffffff" fill-opacity="0.7" />

      <!-- the silver platter; then the record in the theme colour: an edge that keeps a pale record off the platter,
           grooves and a shine in the colour that reads on it, the label (ringed, so a pink record keeps it apart)
           with the ghost, the spindle -->
      <circle cx="19.5" cy="20.5" r="13.6" fill="#d5d8e2" stroke="#a9adbd" stroke-width="0.8" />
      <g class="record">
        <circle cx="19.5" cy="20.5" r="12.5" class="fill-primary" stroke="#1f1d27" stroke-opacity="0.25" stroke-width="0.6" />
        <circle cx="19.5" cy="20.5" r="10.6" class="stroke-on-primary/15" stroke-width="0.5" />
        <circle cx="19.5" cy="20.5" r="8.7" class="stroke-on-primary/15" stroke-width="0.5" />
        <circle cx="19.5" cy="20.5" r="6.9" class="stroke-on-primary/10" stroke-width="0.5" />
        <path d="M 25.3 10.45 A 11.6 11.6 0 0 1 30.01 15.6 M 13.7 30.55 A 11.6 11.6 0 0 1 8.99 25.4" class="stroke-on-primary/35" stroke-width="0.9" />
        <circle cx="19.5" cy="20.5" r="4.6" fill="#f29db3" stroke="#f6f4fa" stroke-width="0.7" />
        <BrandGhost transform="translate(16.94 16.73) scale(0.32)" :float="false" />
        <circle cx="19.5" cy="20.5" r="0.55" fill="#f6f4fa" />
      </g>

      <!-- the speed buttons -->
      <rect x="39" y="30.6" width="4" height="2" rx="0.6" fill="#cfccd9" />
      <rect x="44.4" y="30.6" width="4" height="2" rx="0.6" fill="#f29db3" />

      <!-- the black tonearm, round its pivot: a weight, the arm, the head on the groove -->
      <g class="arm">
        <circle cx="45" cy="7.2" r="1.7" fill="#5b5668" />
        <path d="M 45 11 L 42 25 L 29.6 27.4" stroke="#2b2733" stroke-width="1.4" />
        <rect x="-2.6" y="-1.3" width="3.4" height="2.6" rx="0.6" transform="translate(29.6 27.4) rotate(-12)" fill="#2b2733" />
      </g>
      <circle cx="45" cy="11" r="3.1" fill="#d5d8e2" stroke="#a9adbd" stroke-width="0.6" />
      <circle cx="45" cy="11" r="1.4" fill="#2b2733" />
    </g>
  </svg>
</template>

<style scoped>
.deck {
  transform-box: fill-box;
  transform-origin: 50% 100%;
  animation: deck-in 420ms cubic-bezier(0.34, 1.56, 0.64, 1) backwards;
}

/* Spins up from rest, slowing to a stop. Filling only backwards, so the hover's turn is a transition that plays. */
.record {
  transform-box: fill-box;
  transform-origin: center;
  animation: spin-up 1500ms cubic-bezier(0.22, 1, 0.36, 1) 150ms backwards;
  transition: rotate 1100ms cubic-bezier(0.22, 1, 0.36, 1);
}

.header-art:hover .record {
  rotate: 360deg;
}

.arm {
  transform-box: view-box;
  transform-origin: 45px 11px;
  animation: arm-on 600ms cubic-bezier(0.34, 1.56, 0.64, 1) 380ms backwards;
}

@keyframes deck-in {
  from { opacity: 0; scale: 0.88; }
}

@keyframes spin-up {
  from { rotate: -540deg; }
}

@keyframes arm-on {
  from { rotate: 26deg; }
}

@media (prefers-reduced-motion: reduce) {
  .deck,
  .record,
  .arm {
    animation: none;
    transition: none;
  }
}
</style>
