<script setup lang="ts">
/**
 * The event list's header picture: an event ticket in the theme colour (a title, a pink badge, a perforated stub with
 * a barcode), and the cat ghost peeking over it, its paws on the stub's edge. When the page loads the ticket slides in
 * and the ghost pops up behind it; pointed at, the stub tips away along the perforation, as if torn off. Decorative:
 * the heading names the page.
 */
</script>

<template>
  <!-- As tall as the title and the description together -->
  <svg class="header-art aspect-[56/40] h-14 w-auto shrink-0 overflow-visible sm:h-15" viewBox="0 0 56 40" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <!-- The ghost, behind the ticket so only its ears and eyes show -->
    <g class="peek">
      <BrandGhost transform="translate(33 2.6) rotate(-8 8 8.6)" />
    </g>

    <g class="ticket">
      <!-- The ticket, notched at both sides, its body and its stub split along the perforation -->
      <path d="M 5 13 H 33.2 A 1.8 1.8 0 0 0 35 14.8 V 33.2 A 1.8 1.8 0 0 0 33.2 35 H 5 A 2 2 0 0 1 3 33 V 26.4 A 2.4 2.4 0 0 0 3 21.6 V 15 A 2 2 0 0 1 5 13 Z" class="fill-primary" />
      <path d="M 5 13 H 13 L 3 20.5 V 15 A 2 2 0 0 1 5 13 Z" class="fill-white/10" />
      <rect x="7.5" y="17" width="15" height="2" rx="1" class="fill-on-primary/80" />
      <rect x="7.5" y="20.8" width="10" height="1.4" rx="0.7" class="fill-on-primary/45" />
      <rect x="7.5" y="29.2" width="5" height="1.2" rx="0.6" class="fill-on-primary/35" />
      <rect x="14" y="29.2" width="7" height="1.2" rx="0.6" class="fill-on-primary/35" />
      <!-- a pink badge with a heart -->
      <circle cx="28.4" cy="24" r="3.6" fill="#f29db3" />
      <path d="M 28.4 25.9 C 26.2 24.4, 26.4 22.4, 27.6 22.4 C 28 22.4, 28.3 22.7, 28.4 23 C 28.5 22.7, 28.8 22.4, 29.2 22.4 C 30.4 22.4, 30.6 24.4, 28.4 25.9 Z" fill="#ffffff" />

      <g class="stub">
        <path d="M 36.8 13 H 45 A 2 2 0 0 1 47 15 V 21.6 A 2.4 2.4 0 0 0 47 26.4 V 33 A 2 2 0 0 1 45 35 H 36.8 A 1.8 1.8 0 0 0 35 33.2 V 14.8 A 1.8 1.8 0 0 0 36.8 13 Z" class="fill-primary-strong" />
        <g class="fill-on-primary/55">
          <rect x="38.4" y="18" width="0.7" height="12" />
          <rect x="39.6" y="18" width="0.4" height="12" />
          <rect x="40.4" y="18" width="1" height="12" />
          <rect x="41.9" y="18" width="0.4" height="12" />
          <rect x="42.8" y="18" width="0.7" height="12" />
          <rect x="44" y="18" width="0.5" height="12" />
        </g>
        <!-- the ghost's paws on the top edge -->
        <ellipse cx="38.2" cy="13.1" rx="1.7" ry="1.15" fill="#ffffff" stroke="#1f1d27" stroke-width="0.9" />
        <ellipse cx="44.2" cy="13.1" rx="1.7" ry="1.15" fill="#ffffff" stroke="#1f1d27" stroke-width="0.9" />
      </g>
      <!-- the perforation, as holes -->
      <path d="M 35 15.4 V 32.6" class="stroke-card" stroke-width="0.7" stroke-dasharray="1 1.1" />
    </g>
  </svg>
</template>

<style scoped>
.ticket {
  animation: ticket-in 560ms cubic-bezier(0.22, 1, 0.36, 1) backwards;
}

.peek {
  animation: peek-up 480ms cubic-bezier(0.34, 1.56, 0.64, 1) 420ms backwards;
}

/* The stub tips round the foot of the perforation. */
.stub {
  transform-box: view-box;
  transform-origin: 35px 35px;
  transition: rotate 400ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

.header-art:hover .stub {
  rotate: 9deg;
}

@keyframes ticket-in {
  from { opacity: 0; translate: -6px 0; rotate: -6deg; }
}

@keyframes peek-up {
  from { translate: 0 7px; }
}

@media (prefers-reduced-motion: reduce) {
  .ticket,
  .peek {
    animation: none;
  }

  .stub {
    transition: none;
  }
}
</style>
