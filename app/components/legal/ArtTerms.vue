<script setup lang="ts">
/**
 * 用户协议: a signed sheet of terms, sealed with a record. Hovering the host (.art-host) signs it again, then lifts the
 * seal and stamps it back down with a ripple. Draws with the theme tokens and --accent, like the about page's art.
 */
const LINES = [72, 66, 70, 50, 68, 38].map((width, index) => ({ y: 46 + index * 8, width }))
</script>

<template>
  <svg viewBox="0 0 240 128" class="size-full" aria-hidden="true">
    <rect x="78" y="14" width="96" height="106" rx="3" stroke-width="1" transform="rotate(5 126 67)" class="fill-card stroke-line opacity-70" />
    <g transform="rotate(-3 118 66)">
      <rect x="70" y="12" width="96" height="108" rx="3" stroke-width="1" class="fill-card stroke-line" />
      <rect x="82" y="24" width="44" height="5" rx="2" class="fill-faint" />
      <rect x="82" y="33" width="28" height="3" rx="1.5" class="fill-line" />
      <text x="150" y="31" font-size="11" class="fill-(--accent) font-mono font-bold">§</text>
      <rect v-for="(line, index) in LINES" :key="index" x="82" :y="line.y" :width="line.width" height="3" rx="1.5" class="fill-line" />
      <line x1="82" x2="128" y1="109" y2="109" stroke-width="1" class="stroke-line" />
      <path
        d="M84 105c3-7 7-9 8-3s2 7 6 0 6-6 7-1 3 4 7 0 5-3 8-1"
        pathLength="1"
        stroke-width="1.6"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="signature fill-none stroke-(--accent)"
      />
    </g>

    <circle cx="150" cy="100" r="17" stroke-width="1.5" class="ripple fill-none stroke-(--accent)" />
    <g class="seal">
      <circle cx="150" cy="100" r="17" class="fill-(--accent)" />
      <circle cx="150" cy="100" r="12.5" stroke-width="1" class="fill-none stroke-(--on-accent) opacity-35" />
      <circle cx="150" cy="100" r="8.5" stroke-width="1" class="fill-none stroke-(--on-accent) opacity-35" />
      <circle cx="150" cy="100" r="4.5" class="fill-card" />
      <circle cx="150" cy="100" r="1.5" class="fill-(--accent)" />
    </g>
  </svg>
</template>

<style scoped>
.signature {
  stroke-dasharray: 1;
  stroke-dashoffset: 0;
}

.art-host:is(:hover, :focus-within) .signature {
  animation: sign 700ms ease-out backwards;
}

.seal,
.ripple {
  transform-box: fill-box;
  transform-origin: center;
}

.art-host:is(:hover, :focus-within) .seal {
  animation: stamp 600ms cubic-bezier(0.3, 0.7, 0.2, 1) 550ms backwards;
}

.ripple {
  opacity: 0;
}

.art-host:is(:hover, :focus-within) .ripple {
  animation: ripple 700ms ease-out 880ms;
}

@keyframes sign {
  from { stroke-dashoffset: 1; }
}

@keyframes stamp {
  0% {
    opacity: 0;
    translate: 10px -18px;
    scale: 1.35;
  }
  55% {
    opacity: 1;
    translate: 0 0;
    scale: 0.9;
  }
  75% { scale: 1.04; }
}

@keyframes ripple {
  from { opacity: 0.7; }
  to {
    opacity: 0;
    scale: 1.9;
  }
}
</style>
