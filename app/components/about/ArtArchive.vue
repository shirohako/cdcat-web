<script setup lang="ts">
/**
 * 音乐档案馆: a shelf of CD spines, some wearing an obi, the last one leaning on its neighbour. Hovering the card
 * (.art-host) lifts the spines one after another, the coloured one highest, as if being pulled out.
 *
 * Like every About illustration, it draws with the card's --accent, --accent-soft and --on-accent.
 */
const SHELF = 160
const TONES = {
  plain: 'fill-card stroke-line',
  soft: 'fill-(--accent-soft) stroke-line',
  accent: 'fill-(--accent) stroke-(--accent)',
}

const spines = (() => {
  const specs: { w: number, h: number, tone: keyof typeof TONES, obi?: boolean, lift?: boolean }[] = [
    { w: 16, h: 100, tone: 'plain' },
    { w: 20, h: 112, tone: 'soft' },
    { w: 14, h: 94, tone: 'plain', obi: true },
    { w: 18, h: 106, tone: 'plain' },
    { w: 22, h: 120, tone: 'accent', obi: true, lift: true },
    { w: 14, h: 98, tone: 'plain' },
    { w: 18, h: 110, tone: 'soft', obi: true },
    { w: 16, h: 92, tone: 'plain' },
    { w: 20, h: 114, tone: 'plain' },
    { w: 14, h: 102, tone: 'soft' },
    { w: 18, h: 96, tone: 'plain', obi: true },
  ]
  let x = 50
  return specs.map((spec) => {
    const spine = { ...spec, x, y: SHELF - spec.h }
    x += spec.w + 3
    return spine
  })
})()
</script>

<template>
  <svg viewBox="0 0 360 200" class="size-full" aria-hidden="true">
    <g
      v-for="(spine, index) in spines"
      :key="index"
      class="spine"
      :class="{ lift: spine.lift }"
      :style="{ '--d': `${index * 35}ms` }"
    >
      <rect :x="spine.x" :y="spine.y" :width="spine.w" :height="spine.h" rx="1.5" stroke-width="1" :class="TONES[spine.tone]" />
      <rect
        :x="spine.x + 3"
        :y="spine.y + 8"
        :width="spine.w - 6"
        height="3"
        rx="1"
        :class="spine.tone === 'accent' ? 'fill-(--on-accent) opacity-60' : 'fill-faint'"
      />
      <rect
        :x="spine.x + 3"
        :y="spine.y + 15"
        :width="(spine.w - 6) * 0.6"
        height="2"
        rx="1"
        :class="spine.tone === 'accent' ? 'fill-(--on-accent) opacity-40' : 'fill-line'"
      />
      <rect
        v-if="spine.obi"
        :x="spine.x"
        :y="SHELF - 30"
        :width="spine.w"
        height="13"
        :class="spine.tone === 'accent' ? 'fill-(--on-accent) opacity-25' : 'fill-(--accent)'"
      />
    </g>

    <g class="lean">
      <rect x="295" y="62" width="16" height="98" rx="1.5" stroke-width="1" class="fill-card stroke-line" />
      <rect x="298" y="70" width="10" height="3" rx="1" class="fill-faint" />
      <rect x="295" y="130" width="16" height="13" class="fill-(--accent-soft)" />
    </g>

    <rect x="30" y="160" width="300" height="7" rx="1.5" stroke-width="1" class="fill-card stroke-line" />
    <rect x="34" y="167" width="292" height="3" class="fill-line" />
  </svg>
</template>

<style scoped>
.spine {
  transition: translate 450ms cubic-bezier(0.3, 0.7, 0.2, 1);
}

.art-host:is(:hover, :focus-within) .spine {
  translate: 0 -5px;
  transition-delay: var(--d);
}

.art-host:is(:hover, :focus-within) .spine.lift {
  translate: 0 -26px;
}

.lean {
  transform-box: view-box;
  transform-origin: 295px 160px;
  rotate: -14deg;
  transition: rotate 500ms cubic-bezier(0.3, 0.7, 0.2, 1);
}

.art-host:is(:hover, :focus-within) .lean {
  rotate: -10deg;
  transition-delay: 380ms;
}
</style>
