<script setup lang="ts">
/**
 * 深入了解音乐: an open booklet, a photo on the left page and lyrics on the right. Hovering the card sings the lyrics
 * karaoke-style, one line after another.
 */
const LYRICS = [56, 44, 60, 36, 52, 40, 48].map((width, index) => ({ y: 28 + index * 12, width, delay: `${index * 260}ms` }))
</script>

<template>
  <svg viewBox="0 0 240 128" class="size-full" aria-hidden="true">
    <path d="M120 20L42 14V108L120 114Z" stroke-width="1" stroke-linejoin="round" class="fill-card stroke-line" />
    <path d="M120 20L198 14V108L120 114Z" stroke-width="1" stroke-linejoin="round" class="fill-card stroke-line" />
    <line x1="120" x2="120" y1="20" y2="114" stroke-width="1" class="stroke-line" />

    <rect x="52" y="24" width="58" height="40" rx="2" class="fill-(--accent-soft)" />
    <circle cx="98" cy="34" r="5" class="fill-(--accent)" />
    <path d="M52 64L70 44L82 56L90 48L110 64Z" class="fill-(--accent) opacity-70" />
    <rect x="52" y="74" width="50" height="3" rx="1.5" class="fill-faint" />
    <rect x="52" y="82" width="38" height="3" rx="1.5" class="fill-line" />
    <rect x="52" y="90" width="46" height="3" rx="1.5" class="fill-line" />

    <g v-for="(line, index) in LYRICS" :key="index">
      <rect x="130" :y="line.y" :width="line.width" height="4" rx="2" class="fill-line" />
      <rect x="130" :y="line.y" :width="line.width" height="4" rx="2" class="sing fill-(--accent)" :style="{ '--d': line.delay }" />
    </g>

    <path d="M182 12H189V34L185.5 30.5L182 34Z" class="ribbon fill-(--accent)" />
  </svg>
</template>

<style scoped>
.sing {
  transform-box: fill-box;
  transform-origin: left center;
  scale: 0 1;
  transition: scale 200ms ease-out;
}

.art-host:is(:hover, :focus-within) .sing {
  scale: 1 1;
  transition: scale 520ms linear var(--d);
}

.ribbon {
  transition: translate 400ms cubic-bezier(0.3, 0.7, 0.2, 1);
}

.art-host:is(:hover, :focus-within) .ribbon {
  translate: 0 4px;
}
</style>
