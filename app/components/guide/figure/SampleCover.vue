<script setup lang="ts">
/** The cover of the guides' made-up album 星屑のアトラス: a night sky with a few stars and a moon, in the theme's colours. */
const STARS = [
  { x: 9, y: 11, r: 1.2 }, { x: 30, y: 7, r: 0.9 }, { x: 22, y: 18, r: 1.5 }, { x: 34, y: 26, r: 1 },
  { x: 7, y: 30, r: 0.8 }, { x: 15, y: 24, r: 0.7 }, { x: 27, y: 33, r: 1.1 },
]
</script>

<template>
  <svg viewBox="0 0 40 40" class="accent overflow-hidden" style="--shift: 200" aria-hidden="true">
    <rect width="40" height="40" class="fill-hero" />
    <rect width="40" height="40" class="fill-(--accent) opacity-20" />
    <path d="M0 31c8-4 15-5 22-3s12 2 18-1v13H0Z" class="fill-(--accent) opacity-35" />
    <circle v-for="(star, index) in STARS" :key="index" :cx="star.x" :cy="star.y" :r="star.r" class="fill-white" :opacity="0.55 + (index % 3) * 0.15" />
    <circle cx="30" cy="13" r="4.2" class="fill-white opacity-90" />
    <!-- The bite out of the moon is the sky again: the same two layers. -->
    <circle cx="31.8" cy="11.8" r="3.6" class="fill-hero" />
    <circle cx="31.8" cy="11.8" r="3.6" class="fill-(--accent) opacity-20" />
  </svg>
</template>
