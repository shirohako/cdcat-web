<script setup lang="ts">
/**
 * 如何从互联网寻找音乐资料: a magnifier beside a couple of pages about a release. Hovering the card moves it over the
 * page and marks the line it found.
 */
const LINES = [60, 52, 58, 40, 50].map((width, index) => ({ y: 64 + index * 8, width }))
</script>

<template>
  <svg viewBox="0 0 240 128" class="size-full" aria-hidden="true">
    <rect x="78" y="14" width="78" height="94" rx="3" stroke-width="1" transform="rotate(6 117 61)" class="fill-card stroke-line" />
    <rect x="66" y="20" width="80" height="96" rx="3" stroke-width="1" class="fill-card stroke-line" />

    <rect x="76" y="30" width="24" height="24" rx="1.5" class="fill-(--accent-soft)" />
    <circle cx="88" cy="42" r="7" stroke-width="1.2" class="fill-none stroke-(--accent)" />
    <circle cx="88" cy="42" r="1.6" class="fill-(--accent)" />
    <rect x="106" y="32" width="32" height="3" rx="1.5" class="fill-faint" />
    <rect x="106" y="39" width="24" height="3" rx="1.5" class="fill-line" />
    <rect x="106" y="46" width="28" height="3" rx="1.5" class="fill-line" />

    <rect x="73" y="76.5" width="66" height="9" rx="1.5" class="found fill-(--accent-soft)" />
    <rect v-for="(line, index) in LINES" :key="index" x="76" :y="line.y" :width="line.width" height="3" rx="1.5" class="fill-line" />

    <g class="lens">
      <line x1="184" y1="96" x2="198" y2="110" stroke-width="5" stroke-linecap="round" class="stroke-(--accent)" />
      <circle cx="172" cy="84" r="17" stroke-width="3" class="fill-(--accent-soft) stroke-(--accent)" />
      <path d="M162 79A11 11 0 0 1 169 73" stroke-width="2" stroke-linecap="round" class="fill-none stroke-card opacity-80" />
    </g>
  </svg>
</template>

<style scoped>
.lens {
  transition: translate 300ms ease-in-out;
}

.art-host:is(:hover, :focus-within) .lens {
  translate: -56px -3px;
  transition: translate 650ms cubic-bezier(0.3, 0.7, 0.2, 1);
}

.found {
  opacity: 0;
  transition: opacity 150ms ease-out;
}

.art-host:is(:hover, :focus-within) .found {
  opacity: 1;
  transition: opacity 300ms ease-out 450ms;
}
</style>
