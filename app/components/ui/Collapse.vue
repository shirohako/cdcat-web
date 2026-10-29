<script setup lang="ts">
/**
 * Opens and folds its content by height (grid rows 0fr ↔ 1fr). Opening grows the rows while the content fades in
 * and rises; folding fades the content first and then closes the rows, which is quicker. Folded content is inert.
 *
 * The inner box clips only while it moves or is folded (`overflow: clip`, never a scroll container), so open content
 * shows focus rings and sticky elements around it keep working. With `lazy`, the content mounts on the first opening
 * and then stays, so content that starts folded costs nothing until it is wanted (and isn't in the server render).
 */
const props = withDefaults(defineProps<{
  open: boolean
  lazy?: boolean
}>(), { lazy: false })

const mounted = ref(props.open || !props.lazy)
const settled = ref(props.open)
let settleTimer: ReturnType<typeof setTimeout> | undefined

watch(() => props.open, (open) => {
  if (open) mounted.value = true
  settled.value = false
  clearTimeout(settleTimer)
  // Longer than either transition; reduced motion has none and no transitionend to wait for.
  settleTimer = setTimeout(() => { settled.value = props.open }, 520)
})
onBeforeUnmount(() => clearTimeout(settleTimer))
</script>

<template>
  <!-- One column no wider than the space it is given, so long unwrapped lines inside truncate instead of widening it. -->
  <div class="ui-collapse grid min-w-0 grid-cols-[minmax(0,1fr)]" :class="open ? 'is-open grid-rows-[1fr]' : 'grid-rows-[0fr]'" :inert="!open">
    <div class="min-h-0 min-w-0" :class="settled ? 'overflow-visible' : 'overflow-clip'">
      <div class="ui-collapse-body">
        <slot v-if="mounted" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.ui-collapse {
  transition: grid-template-rows 380ms cubic-bezier(0.22, 1, 0.36, 1);
}

.ui-collapse:not(.is-open) {
  transition: grid-template-rows 260ms cubic-bezier(0.4, 0, 0.2, 1) 120ms;
}

.ui-collapse-body {
  transition: opacity 200ms ease-out 120ms, translate 260ms cubic-bezier(0.22, 1, 0.36, 1) 120ms;
}

.ui-collapse:not(.is-open) .ui-collapse-body {
  opacity: 0;
  translate: 0 4px;
  transition: opacity 120ms ease-in, translate 120ms ease-in;
}

@media (prefers-reduced-motion: reduce) {
  .ui-collapse,
  .ui-collapse:not(.is-open),
  .ui-collapse-body,
  .ui-collapse:not(.is-open) .ui-collapse-body {
    transition: none;
  }
}
</style>
