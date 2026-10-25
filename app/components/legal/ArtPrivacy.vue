<script setup lang="ts">
/**
 * 隐私政策: a CD case whose track list holds your details, guarded by a shield with a padlock. Hovering the host
 * (.art-host) clicks the padlock shut, sends a pulse round the shield and blacks the track list out line by line.
 */
const TRACKS = [44, 36, 48, 30, 40].map((width, index) => ({ y: 36 + index * 13, width, delay: `${300 + index * 90}ms` }))
const SHIELD = 'M156 34L182 44V68Q182 92 156 106Q130 92 130 68V44Z'
</script>

<template>
  <svg viewBox="0 0 240 128" class="size-full" aria-hidden="true">
    <rect x="52" y="20" width="84" height="88" rx="3" stroke-width="1" class="fill-card stroke-line" />
    <rect x="52.5" y="20.5" width="9" height="87" class="fill-sunken" />
    <g v-for="(track, index) in TRACKS" :key="index">
      <circle cx="72" :cy="track.y + 2" r="2" class="fill-faint" />
      <rect x="78" :y="track.y" :width="track.width" height="4" rx="2" class="fill-line" />
      <rect x="77" :y="track.y - 1.5" :width="track.width + 2" height="7" rx="1.5" class="redact fill-(--accent)" :style="{ '--d': track.delay }" />
    </g>

    <path :d="SHIELD" stroke-width="2" class="halo fill-none stroke-(--accent)" />
    <path :d="SHIELD" stroke-width="2" stroke-linejoin="round" class="fill-card stroke-(--accent)" />
    <path d="M149.5 66V60.5a6.5 6.5 0 0 1 13 0V66" stroke-width="3" stroke-linecap="round" class="shackle fill-none stroke-(--accent)" />
    <rect x="145" y="65" width="22" height="18" rx="2.5" class="fill-(--accent)" />
    <circle cx="156" cy="72.5" r="2.2" class="fill-(--on-accent)" />
    <rect x="155.1" y="73.5" width="1.8" height="4.5" rx="0.9" class="fill-(--on-accent)" />
  </svg>
</template>

<style scoped>
.redact {
  transform-box: fill-box;
  transform-origin: left center;
  scale: 0 1;
  transition: scale 200ms ease-in;
}

.art-host:is(:hover, :focus-within) .redact {
  scale: 1 1;
  transition: scale 350ms cubic-bezier(0.3, 0.7, 0.2, 1) var(--d);
}

.art-host:is(:hover, :focus-within) .shackle {
  animation: click 500ms cubic-bezier(0.3, 0.7, 0.2, 1);
}

.halo {
  transform-box: fill-box;
  transform-origin: center;
  opacity: 0;
}

.art-host:is(:hover, :focus-within) .halo {
  animation: pulse 800ms ease-out 420ms;
}

@keyframes click {
  35% { translate: 0 -5px; }
  70% { translate: 0 0.8px; }
}

@keyframes pulse {
  from { opacity: 0.7; }
  to {
    opacity: 0;
    scale: 1.3;
  }
}
</style>
