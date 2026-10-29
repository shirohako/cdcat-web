<script lang="ts">
import type { Placement } from '@floating-ui/dom'
import type { Theme } from '~/composables/useAppearance'
import { autoUpdate, computePosition, flip, hide as hideMiddleware, offset as offsetMiddleware, shift } from '@floating-ui/dom'

// One tooltip shows at a time, and right after one closes the next opens without waiting, so moving along a row of
// icons reads their names straight away.
let closeShown: (() => void) | null = null
let closedAt = 0
const SKIP_DELAY = 300
/** Where the bubble of a grouped tooltip was when it closed, for the next tooltip of its group to glide on from. */
let lastBubble: { group: string, x: number, y: number, width: number, height: number, drop: () => void } | null = null
const LONG_PRESS = 500
/** Triggers whose tap does something of their own; on touch screens their tooltip waits for a long press instead. */
const ACTIONABLE = 'a[href], button, input, select, textarea, label, summary, [contenteditable="true"], '
  + '[role="button"], [role="link"], [role="checkbox"], [role="switch"], [role="tab"], [role="menuitem"], [role="option"]'
</script>

<script setup lang="ts">
/**
 * A tooltip in the inverted theme: light on dark pages, dark on light ones. `text` shows one short line; the `content`
 * slot takes any layout (covers, badges, lists …) and gets a wider bubble with more padding. The bubble carries the
 * opposite `data-theme`, so the usual tokens and Ui components in it come out right without `dark:` classes.
 *
 * It shows after `delay` when the pointer rests on the trigger, at once on keyboard focus, and on touch screens on a
 * tap, or on a long press when the trigger is a button or link (its tap keeps doing what it does); a tap elsewhere
 * closes it then. It never takes the pointer or focus, so anything to click belongs in a UiPopover instead. A click on
 * the trigger or Escape closes it.
 *
 * The default slot is the trigger and gets no box of its own: its first element anchors the bubble and is described by
 * it (aria-describedby) while it shows, unless its aria-label already says the same. Attributes (class …) go to the
 * bubble, e.g. a width for the `content` slot.
 *
 * Tooltips with the same `group` (the parts of a bar, a row of icons …) pass one bubble along: when one opens right
 * after another of its group closed, it starts where that bubble was and glides over to its own trigger.
 */
defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  text?: string
  placement?: Placement
  /** Gap between the trigger and the bubble, in pixels */
  offset?: number
  /** How long the pointer rests on the trigger before the tooltip shows, in milliseconds */
  delay?: number
  disabled?: boolean
  /** Tooltips of one group glide from one to the next instead of closing and opening again */
  group?: string
}>(), { text: undefined, placement: 'top', offset: 8, delay: 400, group: undefined })

const slots = useSlots()
const id = useId()
const root = ref<HTMLElement | null>(null)
const bubble = ref<HTMLElement | null>(null)
const open = ref(false)
// The teleported bubble stays rendered until its leave transition ends, and isn't rendered at all before the first show.
const rendered = ref(false)
const layer = ref<HTMLElement | 'body'>('body')
const theme = ref<Theme>('light')
const position = reactive({ x: 0, y: 0, placement: props.placement as Placement, placed: false, hidden: false })
// Set while the bubble took over from another of its group: no pop-in. `moving` then turns on the transition that
// carries it to its place, once it stands where the last bubble was.
const gliding = ref(false)
const moving = ref(false)

const rich = computed(() => Boolean(slots.content))
const anchor = () => triggerIn(root.value)

let showTimer: ReturnType<typeof setTimeout> | undefined
let pressTimer: ReturnType<typeof setTimeout> | undefined
let stopAutoUpdate: (() => void) | null = null
let described: Element | null = null
// After a click on the trigger the tooltip stays away until the pointer leaves.
let suppressed = false
// The touch that began on the trigger (on something tappable or not, and where), and whether it became a long press.
let touchPress: { actionable: boolean, x: number, y: number } | null = null
let longPressed = false

const place = () => {
  const reference = anchor()
  const floating = bubble.value
  if (!reference || !floating) return
  void computePosition(reference, floating, {
    strategy: 'fixed',
    placement: props.placement,
    middleware: [offsetMiddleware(props.offset), flip({ padding: 8 }), shift({ padding: 8 }), hideMiddleware()],
  }).then(({ x, y, placement, middlewareData }) => {
    Object.assign(position, { x: Math.round(x), y: Math.round(y), placement, placed: true, hidden: Boolean(middlewareData.hide?.referenceHidden) })
  })
}

const describe = (reference: Element | null) => {
  if (described) {
    const rest = (described.getAttribute('aria-describedby') ?? '').split(' ').filter(token => token && token !== id)
    if (rest.length) described.setAttribute('aria-describedby', rest.join(' '))
    else described.removeAttribute('aria-describedby')
  }
  described = null
  if (!reference || (props.text && reference.getAttribute('aria-label') === props.text)) return
  const tokens = (reference.getAttribute('aria-describedby') ?? '').split(' ').filter(Boolean)
  reference.setAttribute('aria-describedby', [...tokens, id].join(' '))
  described = reference
}

const show = async () => {
  clearTimeout(showTimer)
  const reference = anchor()
  if (open.value || props.disabled || !reference || !(props.text || rich.value)) return
  closeShown?.()
  closeShown = hide
  const from = props.group && lastBubble?.group === props.group && Date.now() - closedAt < SKIP_DELAY ? lastBubble : null
  lastBubble = null
  // The bubble it takes over from goes at once rather than fading out under this one.
  from?.drop()
  gliding.value = Boolean(from)
  layer.value = floatingLayer(reference)
  theme.value = invertedTheme(reference)
  position.placed = false
  rendered.value = true
  open.value = true
  describe(reference)
  document.addEventListener('keydown', onKeydown)
  document.addEventListener('pointerdown', onOutsidePointerDown, true)
  await nextTick()
  if (!open.value || !bubble.value) return
  if (from) {
    // Start centred on where the last bubble was, without the transition: with it, the bubble would glide in from
    // wherever it stood before (the corner of the screen, the first time). That style has to be in before the move.
    const { width, height } = bubble.value.getBoundingClientRect()
    Object.assign(position, { x: Math.round(from.x + (from.width - width) / 2), y: Math.round(from.y + (from.height - height) / 2), placed: true, hidden: false })
    await nextTick()
    if (!open.value || !bubble.value) return
    bubble.value.getBoundingClientRect()
    moving.value = true
  }
  stopAutoUpdate = autoUpdate(reference, bubble.value, place)
}

function hide() {
  clearTimeout(showTimer)
  clearTimeout(pressTimer)
  if (!open.value) return
  const leaving = bubble.value
  if (props.group && leaving && position.placed) {
    const { width, height } = leaving.getBoundingClientRect()
    lastBubble = { group: props.group, x: position.x, y: position.y, width, height, drop: () => { leaving.style.display = 'none' } }
  }
  open.value = false
  gliding.value = false
  moving.value = false
  closedAt = Date.now()
  if (closeShown === hide) closeShown = null
  stopAutoUpdate?.()
  stopAutoUpdate = null
  describe(null)
  document.removeEventListener('keydown', onKeydown)
  document.removeEventListener('pointerdown', onOutsidePointerDown, true)
}

const scheduleShow = () => {
  if (open.value || props.disabled) return
  clearTimeout(showTimer)
  if (closeShown || Date.now() - closedAt < SKIP_DELAY || props.delay <= 0) void show()
  else showTimer = setTimeout(show, props.delay)
}

function onKeydown(event: KeyboardEvent) {
  if (event.key !== 'Escape' || event.isComposing) return
  // Only the tooltip closes: a dialog around it listens on window, which this keeps the key from reaching.
  event.stopPropagation()
  hide()
}

function onOutsidePointerDown(event: PointerEvent) {
  if (!root.value?.contains(event.target as Node)) hide()
}

const within = (node: EventTarget | null) => node instanceof Node && Boolean(root.value?.contains(node))

const onPointerOver = (event: PointerEvent) => {
  if (event.pointerType === 'touch' || suppressed || within(event.relatedTarget)) return
  scheduleShow()
}

const onPointerOut = (event: PointerEvent) => {
  if (event.pointerType === 'touch' || within(event.relatedTarget)) return
  suppressed = false
  hide()
}

const onPointerDown = (event: PointerEvent) => {
  longPressed = false
  if (event.pointerType !== 'touch') {
    hide()
    suppressed = true
    touchPress = null
    return
  }
  const actionable = Boolean((event.target as Element).closest?.(ACTIONABLE))
  touchPress = { actionable, x: event.clientX, y: event.clientY }
  if (!actionable) return
  // A tap on a button or link does its own thing; a long press shows the tooltip.
  hide()
  clearTimeout(pressTimer)
  pressTimer = setTimeout(() => {
    longPressed = true
    void show()
  }, LONG_PRESS)
}

const onPointerMove = (event: PointerEvent) => {
  if (!touchPress || event.pointerType !== 'touch') return
  if (Math.hypot(event.clientX - touchPress.x, event.clientY - touchPress.y) > 10) clearTimeout(pressTimer)
}

const endPress = () => clearTimeout(pressTimer)

const onClick = (event: MouseEvent) => {
  // The click that ends a long press must not also follow the link or press the button.
  if (longPressed) {
    longPressed = false
    event.preventDefault()
    event.stopPropagation()
    return
  }
  if (touchPress && !touchPress.actionable) {
    if (open.value) hide()
    else void show()
  }
  touchPress = null
}

const onContextMenu = (event: MouseEvent) => {
  // Android opens its link menu (or selects text) on a long press; the tooltip shows instead.
  if (!touchPress?.actionable) return
  event.preventDefault()
  clearTimeout(pressTimer)
  longPressed = true
  void show()
}

const onFocusIn = (event: FocusEvent) => {
  // Keyboard focus only: a button focused by a click shouldn't pop its tooltip.
  if ((event.target as Element).matches?.(':focus-visible')) void show()
}

const onFocusOut = (event: FocusEvent) => {
  if (!within(event.relatedTarget)) hide()
}

watch(() => props.disabled, (disabled) => {
  if (disabled) hide()
})
watch(() => props.placement, () => open.value && place())

const route = useRoute()
watch(() => route.fullPath, hide)

onBeforeUnmount(hide)
</script>

<template>
  <span
    ref="root"
    data-ui-trigger
    class="contents [-webkit-touch-callout:none]"
    @pointerover="onPointerOver"
    @pointerout="onPointerOut"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="endPress"
    @pointercancel="endPress"
    @click.capture="onClick"
    @contextmenu="onContextMenu"
    @focusin="onFocusIn"
    @focusout="onFocusOut"
  >
    <slot />
  </span>

  <!-- Placed with `translate` from the top-left corner, so its width never shrinks near the right edge, and the
       enter animation's `scale` doesn't move it. -->
  <Teleport v-if="rendered" :to="layer">
    <Transition
      appear
      :enter-active-class="gliding ? '' : 'transition-[opacity,scale] duration-150 ease-out motion-reduce:transition-none'"
      :enter-from-class="gliding ? '' : 'scale-95 opacity-0'"
      leave-active-class="transition-opacity duration-100 ease-in motion-reduce:transition-none"
      leave-to-class="opacity-0"
      @after-leave="rendered = false"
    >
      <div
        v-if="open"
        :id="id"
        ref="bubble"
        role="tooltip"
        :data-theme="theme"
        v-bind="$attrs"
        class="pointer-events-none fixed left-0 top-0 z-[90] bg-popover shadow-lg"
        :class="[rich
          ? 'max-w-[min(22rem,calc(100vw-1rem))] rounded-[10px] p-3 text-sm text-body'
          : 'max-w-60 rounded-md px-2.5 py-1.5 text-xs font-medium leading-4 text-title',
        moving && 'transition-[translate] duration-200 ease-out motion-reduce:transition-none']"
        :style="{
          translate: `${position.x}px ${position.y}px`,
          visibility: position.placed && !position.hidden ? 'visible' : 'hidden',
          transformOrigin: placementOrigin(position.placement),
        }"
        @transitionend.self="event => event.propertyName === 'translate' && (moving = false)"
      >
        <slot name="content">{{ text }}</slot>
      </div>
    </Transition>
  </Teleport>
</template>
