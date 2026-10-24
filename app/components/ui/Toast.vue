<script setup lang="ts">
import type { Component } from 'vue'
import { TOASTER, type ToastAction as ToastActionItem, type ToastColor } from '~/composables/useToast'

/**
 * One toast, after Nuxt UI's Toast: an icon, the title and description, actions, a close button and a bar counting
 * down the time left. It closes itself when the time runs out (paused while the toaster says so or while it is
 * being swiped), on a swipe to the right past SWIPE_THRESHOLD, or on Escape while focused. UiToaster lays them out;
 * pages call useToast().
 */
const props = withDefaults(defineProps<{
  title?: string
  description?: string
  icon?: string | Component | false
  color?: 'primary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'
  orientation?: 'vertical' | 'horizontal'
  actions?: ToastActionItem[]
  /** Milliseconds before it closes; 0 keeps it open. Defaults to the toaster's. */
  duration?: number
  close?: boolean
  progress?: boolean
}>(), {
  title: undefined,
  description: undefined,
  icon: undefined,
  color: 'primary',
  orientation: 'vertical',
  actions: () => [],
  duration: undefined,
  close: true,
  progress: true,
})

const open = defineModel<boolean>('open', { default: true })

// Whole class strings, so Tailwind finds them.
const COLORS: Record<ToastColor, { root: string, icon: string, bar: string, action: string }> = {
  primary: { root: 'outline-primary/25 focus-visible:ring-primary', icon: 'text-primary', bar: 'bg-primary', action: 'bg-primary/15 text-primary hover:bg-primary/25' },
  success: { root: 'outline-success/25 focus-visible:ring-success', icon: 'text-success', bar: 'bg-success', action: 'bg-success/15 text-success hover:bg-success/25' },
  info: { root: 'outline-info/25 focus-visible:ring-info', icon: 'text-info', bar: 'bg-info', action: 'bg-info/15 text-info hover:bg-info/25' },
  warning: { root: 'outline-warning/25 focus-visible:ring-warning', icon: 'text-warning', bar: 'bg-warning', action: 'bg-warning/15 text-warning hover:bg-warning/25' },
  error: { root: 'outline-danger/25 focus-visible:ring-danger', icon: 'text-danger', bar: 'bg-danger', action: 'bg-danger/15 text-danger hover:bg-danger/25' },
  neutral: { root: 'outline-title/25 focus-visible:ring-title', icon: 'text-title', bar: 'bg-title', action: 'bg-btn text-btn-content hover:bg-btn-hover' },
}
const ICONS: Partial<Record<ToastColor, string>> = {
  success: 'lucide:circle-check',
  info: 'lucide:info',
  warning: 'lucide:triangle-alert',
  error: 'lucide:circle-alert',
}
const ACTION = 'inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold transition-colors duration-150 ease-out'

const shownIcon = computed(() => props.icon === false ? null : props.icon ?? ICONS[props.color] ?? null)
const hasActions = computed(() => props.actions.length > 0)

const dismiss = () => { open.value = false }

const runAction = (action: ToastActionItem, event: MouseEvent) => {
  action.onClick?.(event)
  if (action.closeOnClick !== false) dismiss()
}

// The countdown: `remaining` drops frame by frame while the toast is open and not paused.
const toaster = inject(TOASTER, null)
const total = computed(() => props.duration ?? toaster?.duration.value ?? 5000)
const remaining = ref(total.value)
const swiping = ref(false)
const running = computed(() => open.value && total.value > 0 && !swiping.value && !toaster?.paused.value)
let frame = 0
let last = 0

const tick = (now: number) => {
  remaining.value -= now - last
  last = now
  if (remaining.value <= 0) {
    remaining.value = 0
    dismiss()
    return
  }
  frame = requestAnimationFrame(tick)
}

const restart = () => {
  cancelAnimationFrame(frame)
  if (!running.value) return
  last = performance.now()
  frame = requestAnimationFrame(tick)
}
watch(running, restart)
// update() may give the toast a new lifetime: it starts again.
watch(total, (value) => { remaining.value = value })

// Swiping right: past the threshold it slides out and closes, short of it it springs back.
const SWIPE_THRESHOLD = 50
const swipe = ref<'move' | 'cancel' | 'end'>()
const swipeX = ref(0)
let start: { x: number, y: number } | null = null
let swallowClick = false

const onPointerdown = (event: PointerEvent) => {
  if (event.button !== 0) return
  start = { x: event.clientX, y: event.clientY }
}

const onPointermove = (event: PointerEvent) => {
  if (!start) return
  const dx = event.clientX - start.x
  const dy = event.clientY - start.y
  if (!swiping.value) {
    // A small or mostly vertical move is not a swipe yet.
    if (Math.abs(dx) < 10 || Math.abs(dx) < Math.abs(dy)) return
    swiping.value = true
    ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
  }
  swipeX.value = Math.max(0, dx)
  swipe.value = 'move'
}

const onPointerup = () => {
  start = null
  if (!swiping.value) return
  swiping.value = false
  swallowClick = true
  if (swipeX.value >= SWIPE_THRESHOLD) {
    swipe.value = 'end'
    dismiss()
  } else {
    swipe.value = 'cancel'
    swipeX.value = 0
  }
}

// The click that ends a swipe must not also count as a click on the toast.
const onClickCapture = (event: MouseEvent) => {
  if (!swallowClick) return
  swallowClick = false
  event.stopImmediatePropagation()
}

const onKeydown = (event: KeyboardEvent) => {
  if (event.key !== 'Escape' || event.target !== event.currentTarget) return
  event.stopPropagation()
  dismiss()
}

const root = useTemplateRef<HTMLElement>('root')
const height = ref(0)
onMounted(() => {
  remaining.value = total.value
  height.value = root.value?.getBoundingClientRect().height ?? 0
  restart()
})
onBeforeUnmount(() => cancelAnimationFrame(frame))
defineExpose({ height })
</script>

<template>
  <li
    ref="root"
    tabindex="0"
    :data-state="open ? 'open' : 'closed'"
    :data-swipe="swipe"
    :data-orientation="orientation"
    class="group relative flex touch-pan-y gap-2.5 overflow-hidden rounded-lg bg-popover p-4 shadow-overlay ring-1 ring-line focus-visible:outline-3"
    :class="[COLORS[color].root, orientation === 'horizontal' ? 'items-center' : 'items-start']"
    :style="{ '--height': height, '--toast-swipe-move-x': `${swipeX}px`, '--toast-swipe-end-x': `${swipeX}px` }"
    @pointerdown="onPointerdown"
    @pointermove="onPointermove"
    @pointerup="onPointerup"
    @pointercancel="onPointerup"
    @click.capture="onClickCapture"
    @keydown="onKeydown"
  >
    <UiIcon v-if="shownIcon" :icon="shownIcon" class="size-5 shrink-0" :class="COLORS[color].icon" />

    <div class="flex w-0 flex-1 flex-col">
      <p v-if="title" class="text-sm font-medium text-title">{{ title }}</p>
      <p v-if="description" class="text-sm text-meta" :class="{ 'mt-1': title }">{{ description }}</p>

      <div v-if="orientation === 'vertical' && hasActions" class="mt-2.5 flex shrink-0 items-start gap-1.5">
        <button
          v-for="(action, index) in actions"
          :key="index"
          type="button"
          :class="[ACTION, COLORS[color].action]"
          @click.stop="runAction(action, $event)"
        >
          <UiIcon v-if="action.icon" :icon="action.icon" class="size-3.5" />
          {{ action.label }}
        </button>
      </div>
    </div>

    <div v-if="(orientation === 'horizontal' && hasActions) || close" class="flex shrink-0 items-center gap-1.5">
      <template v-if="orientation === 'horizontal'">
        <button
          v-for="(action, index) in actions"
          :key="index"
          type="button"
          :class="[ACTION, COLORS[color].action]"
          @click.stop="runAction(action, $event)"
        >
          <UiIcon v-if="action.icon" :icon="action.icon" class="size-3.5" />
          {{ action.label }}
        </button>
      </template>
      <button
        v-if="close"
        type="button"
        class="grid size-5 place-items-center rounded text-meta transition-colors duration-150 ease-out hover:text-title"
        :aria-label="$t('common.close')"
        @click.stop="dismiss"
      >
        <Icon name="lucide:x" class="size-5" />
      </button>
    </div>

    <div v-if="progress && open && total > 0 && remaining > 0" class="absolute inset-x-0 bottom-0 h-1 overflow-hidden bg-line" aria-hidden="true">
      <div class="size-full rounded-full" :class="COLORS[color].bar" :style="{ transform: `translateX(-${100 - remaining / total * 100}%)` }" />
    </div>
  </li>
</template>
