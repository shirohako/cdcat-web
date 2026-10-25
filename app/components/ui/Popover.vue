<script setup lang="ts">
import type { Placement } from '@floating-ui/dom'
import { autoUpdate, computePosition, flip, offset as offsetMiddleware, shift, size as fitSize } from '@floating-ui/dom'

/**
 * A card that opens on a click and holds anything, links, buttons and fields included: the counterpart of UiTooltip
 * for content meant to be used. It follows the theme, in the floating-layer style. The `trigger` slot gets `open`,
 * `toggle` and `attrs` (the aria attributes for its button), as in UiMenu; the default slot is the card's content and
 * gets `close`. A click outside, Escape or leaving the page closes it.
 *
 * Opening it from the trigger moves focus into the card; Tab past its end goes on to whatever follows the trigger and
 * Shift+Tab before its start goes back to the trigger, as if the card sat right after it. Escape returns focus to the
 * trigger too.
 *
 * Without a trigger, pass `reference` (the element to anchor on) and drive `v-model:open` yourself, as the venue map
 * does on hover; focus then stays where it is. Attributes (class, listeners …) go to the card, e.g. a width. The card
 * is teleported to <body> (or into the open modal <dialog>) and placed with floating-ui, flipping and shrinking to fit
 * the screen; layers opened from inside it, such as a select's list, count as part of it.
 */
defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  placement?: Placement
  /** Gap between the trigger and the card, in pixels */
  offset?: number
  /** An element to anchor on instead of the trigger slot */
  reference?: Element | null
  /** Names the card for screen readers */
  label?: string
}>(), { placement: 'bottom', offset: 8, reference: null, label: undefined })

const open = defineModel<boolean>('open', { default: false })

const panelId = useId()
const root = ref<HTMLElement | null>(null)
const panel = ref<HTMLElement | null>(null)
const rendered = ref(false)
const layer = ref<HTMLElement | 'body'>('body')
const position = reactive({ x: 0, y: 0, placement: props.placement as Placement, placed: false, maxHeight: 0 })

let stopAutoUpdate: (() => void) | null = null
let focusOnOpen = false
let refocus = false

const anchor = () => props.reference ?? triggerIn(root.value)
const triggerElement = () => (props.reference ? null : triggerIn(root.value) as HTMLElement | null)

const place = () => {
  const reference = anchor()
  const floating = panel.value
  if (!reference || !floating) return
  void computePosition(reference, floating, {
    strategy: 'fixed',
    placement: props.placement,
    middleware: [
      offsetMiddleware(props.offset),
      flip({ padding: 8 }),
      shift({ padding: 8 }),
      fitSize({ padding: 8, apply: ({ availableHeight }) => { position.maxHeight = Math.max(160, availableHeight) } }),
    ],
  }).then(({ x, y, placement }) => {
    Object.assign(position, { x: Math.round(x), y: Math.round(y), placement, placed: true })
  })
}

const track = () => {
  stopAutoUpdate?.()
  stopAutoUpdate = null
  const reference = anchor()
  if (reference && panel.value) stopAutoUpdate = autoUpdate(reference, panel.value, place)
}

const toggle = () => {
  if (open.value) {
    open.value = false
    return
  }
  focusOnOpen = true
  open.value = true
}

const close = (returnFocus = true) => {
  if (!open.value) return
  refocus = returnFocus
  open.value = false
}

const onKeydown = (event: KeyboardEvent) => {
  if (event.key !== 'Escape' || event.isComposing) return
  // Only the card closes: a dialog around it listens on window, which this keeps the key from reaching.
  event.stopPropagation()
  event.preventDefault()
  close()
}

const onPanelKeydown = (event: KeyboardEvent) => {
  if (event.key !== 'Tab' || !panel.value) return
  const items = tabbableIn(panel.value)
  const current = document.activeElement
  const trigger = triggerElement()
  if (event.shiftKey && (current === panel.value || current === items[0] || !items.length)) {
    event.preventDefault()
    close(Boolean(trigger))
  } else if (!event.shiftKey && (current === items.at(-1) || !items.length)) {
    event.preventDefault()
    close(false)
    if (trigger) focusAfter(trigger, panel.value)
  }
}

const onPointerDown = (event: PointerEvent) => {
  const target = event.target as Element
  if (panel.value?.contains(target) || root.value?.contains(target) || props.reference?.contains(target)) return
  // A layer opened later from inside the card (a select's list, a nested card) sits after it in the document.
  const other = target.closest?.('[data-ui-layer]')
  if (other && panel.value && panel.value.compareDocumentPosition(other) & Node.DOCUMENT_POSITION_FOLLOWING) return
  close(false)
}

const listen = () => {
  document.addEventListener('keydown', onKeydown)
  document.addEventListener('pointerdown', onPointerDown, true)
}
const unlisten = () => {
  document.removeEventListener('keydown', onKeydown)
  document.removeEventListener('pointerdown', onPointerDown, true)
}

const opened = async () => {
  const reference = anchor()
  if (!reference) return
  layer.value = floatingLayer(reference)
  position.placed = false
  rendered.value = true
  listen()
  await nextTick()
  if (open.value) {
    track()
    if (focusOnOpen) panel.value?.focus({ preventScroll: true })
  }
  focusOnOpen = false
}

const closed = () => {
  unlisten()
  stopAutoUpdate?.()
  stopAutoUpdate = null
  if (refocus) triggerElement()?.focus({ preventScroll: true })
  refocus = false
}

watch(open, value => (value ? void opened() : closed()))
onMounted(() => {
  if (open.value) void opened()
})

watch(() => [props.reference, props.placement], () => open.value && nextTick(track))

const route = useRoute()
watch(() => route.fullPath, () => close(false))

onBeforeUnmount(() => {
  unlisten()
  stopAutoUpdate?.()
})

const triggerAttrs = computed(() => ({
  'aria-haspopup': 'dialog' as const,
  'aria-expanded': open.value,
  'aria-controls': open.value ? panelId : undefined,
}))
</script>

<template>
  <span v-if="$slots.trigger" ref="root" data-ui-trigger class="contents">
    <slot name="trigger" :open="open" :toggle="toggle" :attrs="triggerAttrs" />
  </span>

  <!-- Placed with `translate` from the top-left corner, so its width never shrinks near the right edge, and the
       enter animation's `scale` doesn't move it. -->
  <Teleport v-if="rendered" :to="layer">
    <Transition
      appear
      enter-active-class="transition-[opacity,scale] duration-150 ease-out motion-reduce:transition-none"
      enter-from-class="scale-[0.97] opacity-0"
      leave-active-class="transition-[opacity,scale] duration-100 ease-in motion-reduce:transition-none"
      leave-to-class="scale-[0.97] opacity-0"
      @after-leave="rendered = false"
    >
      <div
        v-if="open"
        :id="panelId"
        ref="panel"
        role="dialog"
        :aria-label="label"
        tabindex="-1"
        data-ui-layer
        v-bind="$attrs"
        class="fixed left-0 top-0 z-[80] max-w-[calc(100vw-1rem)] overflow-y-auto overscroll-contain rounded-xl bg-popover p-4 text-sm text-body shadow-overlay outline-none ring-1 ring-line"
        :style="{
          translate: `${position.x}px ${position.y}px`,
          maxHeight: position.maxHeight ? `${position.maxHeight}px` : undefined,
          visibility: position.placed ? 'visible' : 'hidden',
          transformOrigin: placementOrigin(position.placement),
        }"
        @keydown="onPanelKeydown"
      >
        <slot :close="() => close()" />
      </div>
    </Transition>
  </Teleport>
</template>
