<script setup lang="ts">
/**
 * The series list's header picture: three numbered volumes of one series on a shelf, in the theme colour with cream
 * labels (the middle one banded in pink), and the cat ghost leaning on them. When the page loads the volumes drop
 * onto the shelf one after another and the ghost drifts in; pointed at, they hop in a wave. Decorative: the heading
 * names the page.
 */
</script>

<template>
  <!-- As tall as the title and the description together -->
  <svg class="header-art aspect-[56/40] h-14 w-auto shrink-0 overflow-visible sm:h-15" viewBox="0 0 56 40" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <rect x="4" y="35.6" width="48" height="1.8" rx="0.9" class="fill-primary-strong" />

    <!-- Each volume drops in (outer group) and hops when pointed at (inner group) -->
    <g class="drop" style="animation-delay: 0ms">
      <g class="hop" style="animation-delay: 0ms">
        <rect x="7" y="14" width="8.6" height="21.6" rx="1" class="fill-primary" />
        <rect x="7" y="16.4" width="8.6" height="1" class="fill-on-primary/25" />
        <rect x="7" y="31.8" width="8.6" height="1" class="fill-on-primary/25" />
        <rect x="8.6" y="20" width="5.4" height="6" rx="0.8" fill="#f6f4fa" />
        <text x="11.3" y="24.75" text-anchor="middle" font-size="4.4" font-weight="700" fill="#3a3542">1</text>
      </g>
    </g>
    <g class="drop" style="animation-delay: 90ms">
      <g class="hop" style="animation-delay: 70ms">
        <rect x="16.3" y="9.5" width="9.4" height="26.1" rx="1" class="fill-primary-strong" />
        <rect x="16.3" y="12" width="9.4" height="1" fill="#f29db3" />
        <rect x="16.3" y="32.2" width="9.4" height="1" fill="#f29db3" />
        <rect x="18" y="17.4" width="6" height="6.4" rx="0.8" fill="#f6f4fa" />
        <text x="21" y="22.35" text-anchor="middle" font-size="4.6" font-weight="700" fill="#3a3542">2</text>
        <rect x="17.4" y="10.6" width="0.8" height="23.6" rx="0.4" class="fill-white/15" />
      </g>
    </g>
    <g class="drop" style="animation-delay: 180ms">
      <g class="hop" style="animation-delay: 140ms">
        <rect x="26.4" y="16" width="8.2" height="19.6" rx="1" class="fill-primary" />
        <rect x="26.4" y="18.4" width="8.2" height="1" class="fill-on-primary/25" />
        <rect x="26.4" y="31.8" width="8.2" height="1" class="fill-on-primary/25" />
        <rect x="27.8" y="21.6" width="5.4" height="6" rx="0.8" fill="#f6f4fa" />
        <text x="30.5" y="26.35" text-anchor="middle" font-size="4.4" font-weight="700" fill="#3a3542">3</text>
      </g>
    </g>

    <!-- The ghost, leaning on the last volume -->
    <g class="lean">
      <BrandGhost transform="translate(35.4 18.2) rotate(-10 8 8.6)" />
    </g>
  </svg>
</template>

<style scoped>
.drop {
  animation: drop-in 520ms cubic-bezier(0.34, 1.56, 0.64, 1) backwards;
}

.lean {
  animation: drift-in 520ms cubic-bezier(0.22, 1, 0.36, 1) 420ms backwards;
}

.header-art:hover .hop {
  animation: hop 420ms ease-out;
}

@keyframes drop-in {
  from { opacity: 0; translate: 0 -8px; }
}

@keyframes drift-in {
  from { opacity: 0; translate: 5px 0; }
}

@keyframes hop {
  40% { translate: 0 -1.8px; }
}

@media (prefers-reduced-motion: reduce) {
  .drop,
  .lean,
  .header-art:hover .hop {
    animation: none;
  }
}
</style>
