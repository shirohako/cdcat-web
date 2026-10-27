<script setup lang="ts">
/**
 * One line of text cut off with an ellipsis when it is too long, and then, only then, the whole of it in a tooltip.
 * Whether it is cut off is measured when it mounts, when its box resizes and once web fonts have loaded, since the
 * tooltip decides as the pointer arrives. `tag` is the element drawn (span by default); classes go to it. `tooltip`
 * replaces the text in the tooltip, for a shortened line whose whole is longer (the first artists of several).
 */
defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  text: string
  tooltip?: string
  tag?: string
  placement?: 'top' | 'bottom'
}>(), { tooltip: undefined, tag: 'span', placement: 'top' })

const el = ref<HTMLElement | null>(null)
const clipped = ref(false)
const measure = () => {
  if (el.value) clipped.value = el.value.scrollWidth > el.value.clientWidth
}

let observer: ResizeObserver | null = null
onMounted(() => {
  measure()
  observer = new ResizeObserver(measure)
  if (el.value) observer.observe(el.value)
  void document.fonts?.ready.then(measure)
})
onBeforeUnmount(() => observer?.disconnect())
watch(() => props.text, () => nextTick(measure))
</script>

<template>
  <UiTooltip :text="tooltip ?? text" :placement="placement" :disabled="!clipped">
    <component :is="tag" ref="el" v-bind="$attrs" class="block truncate">{{ text }}</component>
  </UiTooltip>
</template>
