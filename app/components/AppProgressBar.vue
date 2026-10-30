<template>
  <!-- The fill grows by width, so the gradient spans the filled part and the bright tip stays at its leading edge. -->
  <div
    class="app-progress"
    :class="{ 'app-progress--visible': shown && visible, 'app-progress--instant': shown && instant }"
    aria-hidden="true"
  >
    <div class="app-progress__fill" :style="{ width: `${value}%` }" />
  </div>
</template>

<script setup lang="ts">
const { progress, visible, instant } = useProgressBar()

// Requests made by client plugins before hydration (such as /v1/me) already move the bar, but
// the server rendered it idle; match that until mounted so hydration sees the same markup.
const shown = ref(false)
onMounted(() => { shown.value = true })
const value = computed(() => shown.value ? progress.value : 0)
</script>

<style scoped>
.app-progress {
  position: fixed;
  inset: 0 0 auto;
  z-index: 100;
  height: 3px;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.4s;
}

.app-progress--visible {
  opacity: 1;
}

.app-progress__fill {
  position: absolute;
  inset: 0 auto 0 0;
  /* sky-400 → indigo-500 → violet-500 */
  background: linear-gradient(to right, oklch(74.6% 0.16 232.661), oklch(58.5% 0.233 277.117) 70%, oklch(60.6% 0.25 292.717));
  box-shadow: 0 0 8px oklch(58.5% 0.233 277.117 / 55%);
  transition: width 0.2s ease-out;
}

.app-progress--instant .app-progress__fill {
  transition: none;
}

/* Bright tip at the leading edge. */
.app-progress__fill::before {
  content: '';
  position: absolute;
  inset-block: 0;
  right: 0;
  width: 96px;
  max-width: 100%;
  background: linear-gradient(to right, transparent, rgb(255 255 255 / 60%));
}

/* Sheen sweeping along the bar. */
.app-progress__fill::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(to right, transparent, rgb(255 255 255 / 45%), transparent) 0 0 / 40% 100% no-repeat;
  animation: app-progress-sheen 1.4s linear infinite;
}

@keyframes app-progress-sheen {
  from { background-position: -100% 0; }
  to { background-position: 200% 0; }
}

@media (prefers-reduced-motion: reduce) {
  .app-progress__fill::after {
    display: none;
  }
}
</style>
