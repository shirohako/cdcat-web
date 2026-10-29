<script setup lang="ts">
import type { Placement } from '@floating-ui/dom'

/**
 * The card a hover-card region shows (see useHoverCard): a UiPopover anchored on the hovered element, as the venue
 * map's booth card is. It never takes focus. Moving the pointer into the card keeps it open, so its links can be
 * used; Escape, a press elsewhere or leaving the page closes it. Attributes go to the card, e.g. a width.
 */
defineOptions({ inheritAttrs: false })

withDefaults(defineProps<{
  anchor: HTMLElement | null
  placement?: Placement
  /** Names the card for screen readers */
  label?: string
}>(), { placement: 'bottom-start', label: undefined })

const emit = defineEmits<{ enter: [], leave: [], close: [] }>()
</script>

<template>
  <UiPopover
    :reference="anchor"
    :open="Boolean(anchor)"
    :placement="placement"
    :offset="6"
    :label="label"
    v-bind="$attrs"
    @update:open="value => value || emit('close')"
    @pointerenter="emit('enter')"
    @pointerleave="emit('leave')"
  >
    <slot />
  </UiPopover>
</template>
