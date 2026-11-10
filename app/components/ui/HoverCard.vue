<script setup lang="ts">
import type { Placement } from '@floating-ui/dom'

/**
 * The card a hover-card region shows (see useHoverCard): a UiPopover anchored on the hovered element, as the venue
 * map's booth card is. It never takes focus. Moving the pointer into the card keeps it open, so its links can be
 * used; Escape, a press elsewhere or leaving the page closes it (a finger lifting off the card doesn't). Attributes go to the card, e.g. a width. With
 * `textInset` (the card's own left padding), the card's content starts where the hovered element's text does, so a
 * name and the card about it line up.
 */
defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  anchor: HTMLElement | null
  placement?: Placement
  /** Names the card for screen readers */
  label?: string
  textInset?: number
  /** A point on the card's edge aimed at the hovered element (UiPopover `arrow`); the card sits a little further off */
  arrow?: boolean
}>(), { placement: 'bottom-start', label: undefined, textInset: undefined, arrow: false })

const offset = computed(() => {
  const gap = props.arrow ? 9 : 6
  if (props.textInset === undefined || !props.anchor) return gap
  const style = getComputedStyle(props.anchor)
  return { mainAxis: gap, crossAxis: (Number.parseFloat(style.paddingLeft) || 0) + (Number.parseFloat(style.borderLeftWidth) || 0) - props.textInset }
})

const emit = defineEmits<{ enter: [], leave: [], close: [] }>()
</script>

<template>
  <UiPopover
    :reference="anchor"
    :open="Boolean(anchor)"
    :placement="placement"
    :offset="offset"
    :label="label"
    :arrow="arrow"
    v-bind="$attrs"
    @update:open="value => value || emit('close')"
    @pointerenter="emit('enter')"
    @pointerleave="(event: PointerEvent) => event.pointerType === 'touch' || emit('leave')"
  >
    <slot />
  </UiPopover>
</template>
