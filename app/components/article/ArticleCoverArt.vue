<script setup lang="ts">
/**
 * The stand-in for an article without a cover: one artwork for every article, drawn from the theme tokens so it
 * follows the theme and its colour. A glow of the theme colour, a dot field and two sound waves on the left, a vinyl
 * record cropped on the right whose sheen turns when the card (`group`) is hovered, and a little grain over it all.
 */
const id = useId()

// The record's centre and radius, in the 320 × 180 view box.
const CX = 238
const CY = 96
const R = 88
const GROOVES = Array.from({ length: 11 }, (_, index) => 35 + index * 4.8)

/** A ring segment of the record, from angle `from` to `to` (degrees, clockwise from 3 o'clock). */
const sector = (from: number, to: number, inner: number, outer: number) => {
  const point = (radius: number, angle: number) => {
    const radians = angle * Math.PI / 180
    return `${(CX + radius * Math.cos(radians)).toFixed(2)} ${(CY + radius * Math.sin(radians)).toFixed(2)}`
  }
  return `M ${point(outer, from)} A ${outer} ${outer} 0 0 1 ${point(outer, to)} L ${point(inner, to)} A ${inner} ${inner} 0 0 0 ${point(inner, from)} Z`
}
const SHEEN = [sector(200, 248, 36, R - 3), sector(20, 68, 36, R - 3)]

// Four-pointed sparkles: x, y, size.
const SPARKLES = [[46, 40, 7], [118, 26, 4.5], [86, 72, 3.5]] as const
const SPARKLE = 'M0 -1 C0.12 -0.12 0.12 -0.12 1 0 C0.12 0.12 0.12 0.12 0 1 C-0.12 0.12 -0.12 0.12 -1 0 C-0.12 -0.12 -0.12 -0.12 0 -1 Z'

const background = {
  backgroundImage: [
    'radial-gradient(circle at 14% 20%, color-mix(in oklch, var(--primary) 38%, transparent), transparent 58%)',
    `radial-gradient(circle at ${(CX / 320 * 100).toFixed(0)}% ${(CY / 180 * 100).toFixed(0)}%, color-mix(in oklch, var(--primary-strong) 45%, transparent), transparent 62%)`,
    'linear-gradient(160deg, var(--sunken), var(--card))',
  ].join(', '),
}
</script>

<template>
  <div class="relative size-full overflow-hidden" :style="background" aria-hidden="true">
    <svg viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" class="absolute inset-0 size-full">
      <defs>
        <pattern :id="`${id}-dots`" width="12" height="12" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1" class="fill-primary" />
        </pattern>
        <linearGradient :id="`${id}-fade`" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#fff" stop-opacity="0.9" />
          <stop offset="0.55" stop-color="#fff" stop-opacity="0" />
        </linearGradient>
        <mask :id="`${id}-mask`">
          <rect width="320" height="180" :fill="`url(#${id}-fade)`" />
        </mask>
        <filter :id="`${id}-shadow`" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
        <filter :id="`${id}-grain`">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
      </defs>

      <!-- Dot field, fading out from the top left -->
      <rect width="320" height="180" :fill="`url(#${id}-dots)`" :mask="`url(#${id}-mask)`" class="opacity-40" />

      <!-- Sound waves -->
      <path d="M -10 136 C 25 114, 55 158, 92 136 S 160 112, 196 136 S 250 160, 290 132" class="fill-none stroke-primary/70" stroke-width="1.6" stroke-linecap="round" />
      <path d="M -10 148 C 30 132, 62 166, 100 148 S 168 128, 206 150" class="fill-none stroke-primary/35" stroke-width="1.1" stroke-linecap="round" />

      <!-- Sparkles -->
      <path
        v-for="([x, y, size], index) in SPARKLES"
        :key="index"
        :d="SPARKLE"
        :transform="`translate(${x} ${y}) scale(${size})`"
        class="fill-primary/80"
      />

      <!-- The record -->
      <circle :cx="CX + 4" :cy="CY + 9" :r="R" :filter="`url(#${id}-shadow)`" class="fill-black/35" />
      <circle :cx="CX" :cy="CY" :r="R" class="fill-hero" />
      <circle v-for="radius in GROOVES" :key="radius" :cx="CX" :cy="CY" :r="radius" class="fill-none stroke-on-media/8" stroke-width="0.6" />
      <g
        class="transition-[rotate] duration-[1400ms] ease-out group-hover:rotate-[75deg] motion-reduce:transition-none"
        :style="{ transformOrigin: `${CX}px ${CY}px` }"
      >
        <path v-for="(d, index) in SHEEN" :key="index" :d="d" class="fill-on-media/7" />
      </g>
      <circle :cx="CX" :cy="CY" :r="R - 0.5" class="fill-none stroke-on-media/15" stroke-width="1" />
      <circle :cx="CX" :cy="CY" r="29" class="fill-primary" />
      <circle :cx="CX" :cy="CY" r="23" class="fill-none stroke-on-primary/30" stroke-width="0.8" />
      <circle :cx="CX" :cy="CY" r="3.5" class="fill-sunken" />

      <!-- Grain -->
      <rect width="320" height="180" :filter="`url(#${id}-grain)`" class="opacity-15 mix-blend-overlay" />
    </svg>
  </div>
</template>
