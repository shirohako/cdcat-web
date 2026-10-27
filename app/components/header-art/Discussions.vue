<script setup lang="ts">
/**
 * The forum's header picture: the cat ghost chatting, a speech bubble in the theme colour (lines of text and a pink
 * heart) coming from it, and a pink reply bubble whose three dots bounce as someone types. When the page loads the
 * bubble pops out from its tail and the reply follows; pointed at, both bubbles bounce. Decorative: the heading names
 * the page.
 */
</script>

<template>
  <!-- As tall as the title and the description together -->
  <svg class="header-art aspect-[56/40] h-14 w-auto shrink-0 overflow-visible sm:h-15" viewBox="0 0 56 40" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <BrandGhost transform="translate(3 19) rotate(-6 8 8.6)" />

    <!-- The speech bubble, its tail towards the ghost -->
    <g class="pop said">
      <g class="bounce">
        <path d="M 24.5 4 H 45.5 A 4.5 4.5 0 0 1 50 8.5 V 17.5 A 4.5 4.5 0 0 1 45.5 22 H 30 L 21.5 27.2 L 24.5 22 A 4.5 4.5 0 0 1 20 17.5 V 8.5 A 4.5 4.5 0 0 1 24.5 4 Z" class="fill-primary" />
        <path d="M 24.5 4 H 31 L 20 12.5 V 8.5 A 4.5 4.5 0 0 1 24.5 4 Z" class="fill-white/10" />
        <rect x="24" y="8.6" width="15" height="1.8" rx="0.9" class="fill-on-primary/80" />
        <rect x="24" y="12.4" width="21.5" height="1.4" rx="0.7" class="fill-on-primary/45" />
        <rect x="24" y="15.8" width="12" height="1.4" rx="0.7" class="fill-on-primary/45" />
        <path d="M 45.2 10.9 C 43.4 9.7, 43.6 8, 44.6 8 C 44.95 8, 45.15 8.25, 45.2 8.5 C 45.25 8.25, 45.45 8, 45.8 8 C 46.8 8, 47 9.7, 45.2 10.9 Z" fill="#f29db3" />
      </g>
    </g>

    <!-- The reply, still being typed -->
    <g class="pop reply">
      <g class="bounce" style="animation-delay: 90ms">
        <path d="M 35 25 H 45 A 4 4 0 0 1 49 29 V 31 A 4 4 0 0 1 45 35 L 48.6 38.4 L 41 35 H 35 A 4 4 0 0 1 31 31 V 29 A 4 4 0 0 1 35 25 Z" fill="#f29db3" />
        <circle class="dot" cx="36.6" cy="30" r="1.15" fill="#ffffff" />
        <circle class="dot" cx="40" cy="30" r="1.15" fill="#ffffff" style="animation-delay: 160ms" />
        <circle class="dot" cx="43.4" cy="30" r="1.15" fill="#ffffff" style="animation-delay: 320ms" />
      </g>
    </g>
  </svg>
</template>

<style scoped>
/* Each bubble grows out of its tail. */
.pop {
  transform-box: fill-box;
  animation: pop 480ms cubic-bezier(0.34, 1.56, 0.64, 1) backwards;
}

.said {
  transform-origin: 0% 100%;
}

.reply {
  transform-origin: 100% 100%;
  animation-delay: 380ms;
}

.dot {
  animation: typing 1.2s ease-in-out infinite;
}

.bounce {
  transform-box: fill-box;
  transform-origin: 50% 100%;
}

.header-art:hover .bounce {
  animation: bounce 420ms ease-out;
}

@keyframes pop {
  from { opacity: 0; scale: 0.4; }
}

@keyframes typing {
  0%,
  60%,
  100% { translate: 0 0; opacity: 0.6; }
  30% { translate: 0 -1px; opacity: 1; }
}

@keyframes bounce {
  40% { scale: 1.06; }
}

@media (prefers-reduced-motion: reduce) {
  .pop,
  .dot,
  .header-art:hover .bounce {
    animation: none;
  }
}
</style>
