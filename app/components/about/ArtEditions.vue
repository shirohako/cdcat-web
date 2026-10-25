<script setup lang="ts">
/**
 * 创作者友好: three editions of one release fanned out (a plain disc, a download, and the limited one in front with
 * an obi and a bonus tag). Hovering the card spreads the fan, lifts the front and swings the tag.
 */
const SPARKLE = 'M0 -6L1.5 -1.5L6 0L1.5 1.5L0 6L-1.5 1.5L-6 0L-1.5 -1.5Z'
</script>

<template>
  <svg viewBox="0 0 240 128" class="size-full" aria-hidden="true">
    <!-- Placed by the group, so the path spins about its own centre. -->
    <g transform="translate(40 24)"><path :d="SPARKLE" class="sparkle fill-(--accent)" /></g>
    <g transform="translate(206 30) scale(0.7)"><path :d="SPARKLE" class="sparkle fill-(--accent)" style="--d: 120ms" /></g>

    <g class="card left">
      <rect x="89" y="26" width="62" height="78" rx="3" stroke-width="1" class="fill-card stroke-line" />
      <circle cx="120" cy="56" r="15" stroke-width="1" class="fill-none stroke-line" />
      <circle cx="120" cy="56" r="4" stroke-width="1" class="fill-sunken stroke-line" />
      <rect x="100" y="84" width="34" height="3" rx="1.5" class="fill-line" />
      <rect x="100" y="91" width="22" height="3" rx="1.5" class="fill-line" />
    </g>

    <g class="card right">
      <rect x="89" y="26" width="62" height="78" rx="3" stroke-width="1" class="fill-card stroke-line" />
      <circle cx="120" cy="56" r="14" class="fill-(--accent-soft)" />
      <path d="M120 48v14m-5.5-5.5L120 62l5.5-5.5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="fill-none stroke-(--accent)" />
      <rect x="100" y="84" width="30" height="3" rx="1.5" class="fill-line" />
      <rect x="100" y="91" width="40" height="3" rx="1.5" class="fill-line" />
    </g>

    <g class="card front">
      <rect x="89" y="26" width="62" height="78" rx="3" stroke-width="1" class="fill-card stroke-line" />
      <rect x="89.5" y="26.5" width="9" height="77" class="fill-(--accent)" />
      <circle cx="125" cy="56" r="16" stroke-width="1.5" class="fill-(--accent-soft) stroke-(--accent)" />
      <circle cx="125" cy="56" r="4" stroke-width="1.5" class="fill-card stroke-(--accent)" />
      <rect x="106" y="84" width="34" height="3" rx="1.5" class="fill-faint" />
      <rect x="106" y="91" width="24" height="3" rx="1.5" class="fill-line" />
      <g class="tag">
        <path d="M150 29L156 22H177V36H156Z" class="fill-(--accent)" />
        <circle cx="157" cy="29" r="1.8" class="fill-card" />
        <rect x="162" y="26.5" width="11" height="2" rx="1" class="fill-(--on-accent) opacity-60" />
        <rect x="162" y="30.5" width="7" height="2" rx="1" class="fill-(--on-accent) opacity-60" />
      </g>
    </g>
  </svg>
</template>

<style scoped>
.card {
  transform-box: view-box;
  transform-origin: 120px 118px;
  transition: rotate 500ms cubic-bezier(0.3, 0.7, 0.2, 1), translate 500ms cubic-bezier(0.3, 0.7, 0.2, 1);
}

.left { rotate: -16deg; }
.right { rotate: 16deg; }

.art-host:is(:hover, :focus-within) .left { rotate: -26deg; translate: -6px 0; }
.art-host:is(:hover, :focus-within) .right { rotate: 26deg; translate: 6px 0; }
.art-host:is(:hover, :focus-within) .front { translate: 0 -6px; }

.tag {
  transform-box: view-box;
  transform-origin: 157px 29px;
}

.art-host:is(:hover, :focus-within) .tag {
  animation: swing 900ms ease-in-out 150ms;
}

@keyframes swing {
  30% { rotate: 14deg; }
  60% { rotate: -6deg; }
  80% { rotate: 3deg; }
}

.sparkle {
  transform-box: fill-box;
  transform-origin: center;
  opacity: 0.5;
  transition: opacity 300ms ease-out;
}

.art-host:is(:hover, :focus-within) .sparkle {
  opacity: 1;
  animation: twinkle 1.4s ease-in-out var(--d, 0ms) infinite;
}

@keyframes twinkle {
  50% { scale: 0.55; rotate: 45deg; }
}
</style>
