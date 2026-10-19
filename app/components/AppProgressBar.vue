<template>
  <!-- Styled after NuxtLoadingIndicator: the bar grows with scaleX while the background is
       stretched by the inverse, so the gradient spans the whole viewport and is uncovered from the left. -->
  <div
    class="app-progress"
    :class="{ 'app-progress--visible': shown && visible, 'app-progress--instant': shown && instant }"
    :style="{ transform: `scaleX(${value / 100})`, backgroundSize: `${value > 0 ? 100 / value * 100 : 0}% auto` }"
    aria-hidden="true"
  />
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
  background: repeating-linear-gradient(to right, #eab308 0%, #22c55e 25%, #06b6d4 50%, #3b82f6 75%, #a855f7 100%);
  transform-origin: left;
  transition: transform 0.1s, opacity 0.4s;
}

.app-progress--visible {
  opacity: 1;
}

.app-progress--instant {
  transition: opacity 0.4s;
}
</style>
