<script setup lang="ts">
/**
 * 提交新专辑与更正错误: a revision as a diff, one line struck out and one added, approved with a stamp. Hovering the
 * card strikes the old line, slides the new one in and stamps it again.
 */
</script>

<template>
  <svg viewBox="0 0 240 128" class="size-full" aria-hidden="true">
    <rect x="44" y="16" width="152" height="96" rx="3" stroke-width="1" class="fill-card stroke-line" />
    <rect x="56" y="27" width="50" height="4" rx="2" class="fill-faint" />
    <rect x="168" y="25" width="16" height="8" rx="2" class="fill-(--accent-soft)" />

    <rect x="60" y="44.5" width="70" height="3" rx="1.5" class="fill-line" />
    <rect x="134" y="44.5" width="28" height="3" rx="1.5" class="fill-line" />

    <rect x="44.5" y="54" width="151" height="12" class="fill-danger/12" />
    <line x1="50" x2="55" y1="60" y2="60" stroke-width="1.4" stroke-linecap="round" class="stroke-danger" />
    <rect x="60" y="58.5" width="82" height="3" rx="1.5" class="fill-danger/50" />
    <line x1="58" x2="144" y1="60" y2="60" stroke-width="1.2" pathLength="1" class="strike stroke-danger" />

    <g class="added">
      <rect x="44.5" y="68" width="151" height="12" class="fill-success/12" />
      <path d="M52.5 71.5v5m-2.5-2.5h5" stroke-width="1.4" stroke-linecap="round" class="fill-none stroke-success" />
      <rect x="60" y="72.5" width="92" height="3" rx="1.5" class="fill-success/60" />
    </g>

    <rect x="60" y="86.5" width="56" height="3" rx="1.5" class="fill-line" />
    <rect x="120" y="86.5" width="40" height="3" rx="1.5" class="fill-line" />
    <rect x="60" y="98.5" width="30" height="3" rx="1.5" class="fill-line" />

    <g class="stamp">
      <circle cx="184" cy="100" r="15" class="fill-(--accent)" />
      <path d="M177 100.5L182 105.5L191 95" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" pathLength="1" class="tick fill-none stroke-(--on-accent)" />
    </g>
  </svg>
</template>

<style scoped>
.strike {
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  transition: stroke-dashoffset 150ms ease-out;
}

.art-host:is(:hover, :focus-within) .strike {
  stroke-dashoffset: 0;
  transition: stroke-dashoffset 400ms ease-out 100ms;
}

.art-host:is(:hover, :focus-within) .added {
  animation: insert 450ms cubic-bezier(0.3, 0.7, 0.2, 1) 350ms backwards;
}

@keyframes insert {
  from { opacity: 0; translate: -10px 0; }
}

.stamp {
  transform-box: fill-box;
  transform-origin: center;
}

.art-host:is(:hover, :focus-within) .stamp {
  animation: stamp 450ms cubic-bezier(0.3, 0.7, 0.2, 1) 700ms backwards;
}

.tick {
  stroke-dasharray: 1;
  stroke-dashoffset: 0;
}

.art-host:is(:hover, :focus-within) .tick {
  animation: draw 350ms ease-out 900ms backwards;
}

@keyframes stamp {
  from { scale: 1.6; opacity: 0; }
}

@keyframes draw {
  from { stroke-dashoffset: 1; }
}
</style>
