<script setup lang="ts">
/**
 * 用户组、权限与审核流程: three people on rising steps, the top one in the card's colour with a shield. Hovering the
 * card makes them hop in turn and redraws the shield's tick.
 */
const STEPS = [
  { x: 58, top: 88, person: 'fill-faint', step: 'fill-card stroke-line' },
  { x: 101, top: 72, person: 'fill-(--accent) opacity-50', step: 'fill-card stroke-line' },
  { x: 144, top: 56, person: 'fill-(--accent)', step: 'fill-(--accent-soft) stroke-line' },
].map((step, index) => ({ ...step, cx: step.x + 19, delay: `${index * 130}ms` }))
</script>

<template>
  <svg viewBox="0 0 240 128" class="size-full" aria-hidden="true">
    <g v-for="(step, index) in STEPS" :key="index">
      <rect :x="step.x" :y="step.top" width="38" :height="112 - step.top" stroke-width="1" :class="step.step" />
      <g class="person" :style="{ '--d': step.delay }">
        <circle :cx="step.cx" :cy="step.top - 17" r="5" :class="step.person" />
        <path :d="`M${step.cx - 8} ${step.top - 1}C${step.cx - 8} ${step.top - 10} ${step.cx + 8} ${step.top - 10} ${step.cx + 8} ${step.top - 1}Z`" :class="step.person" />
      </g>
    </g>
    <rect x="70" y="98" width="14" height="3" rx="1.5" class="fill-line" />
    <rect x="113" y="86" width="14" height="3" rx="1.5" class="fill-line" />

    <path d="M163 74L171 77.5V83Q171 89.5 163 93Q155 89.5 155 83V77.5Z" stroke-width="1.4" stroke-linejoin="round" class="fill-card stroke-(--accent)" />
    <path d="M159.5 83.5L162 86L166.5 80.5" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" pathLength="1" class="tick fill-none stroke-(--accent)" />

    <line x1="44" x2="196" y1="112" y2="112" stroke-width="1" class="stroke-line" />
  </svg>
</template>

<style scoped>
.art-host:is(:hover, :focus-within) .person {
  animation: hop 480ms cubic-bezier(0.3, 0.7, 0.2, 1) var(--d);
}

@keyframes hop {
  40% { translate: 0 -8px; }
}

.tick {
  stroke-dasharray: 1;
  stroke-dashoffset: 0;
}

.art-host:is(:hover, :focus-within) .tick {
  animation: draw 500ms ease-out 380ms backwards;
}

@keyframes draw {
  from { stroke-dashoffset: 1; }
}
</style>
