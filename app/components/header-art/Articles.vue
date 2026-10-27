<script setup lang="ts">
/**
 * The article list's header picture: a clipboard in the theme colour holding a cream page (a pink heading and lines
 * of text), and the cat ghost writing on it with a lavender pencil. When the page loads the writer drifts in and the
 * lines write themselves in from the left, one after another; pointed at, the pencil scribbles. Decorative: the
 * heading names the page.
 */
const LINES = [
  { y: 16.2, width: 16.5 },
  { y: 18.8, width: 15 },
  { y: 21.4, width: 16.5 },
  { y: 24, width: 10 },
  { y: 28, width: 14 },
  { y: 30.6, width: 6.6 },
]
</script>

<template>
  <!-- As tall as the title and the description together -->
  <svg class="header-art aspect-[56/40] h-14 w-auto shrink-0 overflow-visible sm:h-15" viewBox="0 0 56 40" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <g class="board">
      <!-- the board, its shine, the page and the clip -->
      <rect x="4" y="5" width="28" height="32.5" rx="2.6" class="fill-primary" />
      <path d="M 6.6 5 H 12 L 4 12 V 7.6 A 2.6 2.6 0 0 1 6.6 5 Z" class="fill-white/10" />
      <rect x="7" y="9" width="22" height="26" rx="1" fill="#f6f4fa" />
      <rect x="12" y="3" width="12" height="5.6" rx="1.6" fill="#e4e7ee" stroke="#a9adbd" stroke-width="0.7" />
      <rect x="15.6" y="4.3" width="4.8" height="1.6" rx="0.8" class="fill-primary" />

      <!-- the heading and the text, written in -->
      <rect class="line" x="9.5" y="12" width="11" height="1.8" rx="0.9" fill="#f29db3" style="animation-delay: 300ms" />
      <rect
        v-for="(line, index) in LINES"
        :key="line.y"
        class="line"
        x="9.5"
        :y="line.y"
        :width="line.width"
        height="1"
        rx="0.5"
        fill="#3a3542"
        fill-opacity="0.45"
        :style="{ animationDelay: `${380 + index * 90}ms` }"
      />
    </g>

    <!-- The writer: the pencil, the ghost's arm and hand on it, the ghost -->
    <g class="writer">
      <g class="scribble">
        <g transform="translate(16.5 31.1) rotate(-35)">
          <path d="M 0 0 L 1.3 -0.6 L 1.3 0.6 Z" fill="#1f1d27" />
          <path d="M 1.3 -0.6 L 3.1 -1.3 L 3.1 1.3 L 1.3 0.6 Z" fill="#f3dcb4" />
          <rect x="3.1" y="-1.3" width="7.9" height="2.6" fill="#b6a4f0" />
          <rect x="11" y="-1.3" width="1.4" height="2.6" fill="#cdd0db" />
          <rect x="12.4" y="-1.3" width="1.8" height="2.6" rx="0.6" fill="#f6b6c6" />
        </g>
        <path d="M 33.6 22.4 L 28.6 23.2" stroke="#1f1d27" stroke-width="3.3" />
        <path d="M 33.6 22.4 L 28.6 23.2" stroke="#ffffff" stroke-width="2.2" />
        <BrandGhost transform="translate(31 14.5) rotate(-6 8 8.6)" />
      </g>
    </g>
  </svg>
</template>

<style scoped>
.board {
  transform-box: fill-box;
  transform-origin: 50% 100%;
  animation: board-in 440ms cubic-bezier(0.34, 1.56, 0.64, 1) backwards;
}

.line {
  transform-box: fill-box;
  transform-origin: left center;
  animation: write 380ms ease-out backwards;
}

.writer {
  animation: drift-in 520ms cubic-bezier(0.22, 1, 0.36, 1) 200ms backwards;
}

.header-art:hover .scribble {
  animation: scribble 520ms ease-in-out;
}

@keyframes board-in {
  from { opacity: 0; scale: 0.88; }
}

@keyframes write {
  from { scale: 0 1; }
}

@keyframes drift-in {
  from { opacity: 0; translate: 6px 0; }
}

@keyframes scribble {
  20% { translate: -1px 0.4px; }
  45% { translate: 0.7px -0.3px; }
  70% { translate: -0.7px 0.3px; }
}

@media (prefers-reduced-motion: reduce) {
  .board,
  .line,
  .writer,
  .header-art:hover .scribble {
    animation: none;
  }
}
</style>
