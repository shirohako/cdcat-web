<script setup lang="ts">
import { TOASTER, type Toast } from '~/composables/useToast'

/**
 * Where useToast()'s toasts appear, after Nuxt UI's Toaster: bottom right, newest at the bottom. With `expand` off
 * they stack like cards and spread out while hovered or focused from the keyboard. Hovering, keyboard focus or
 * leaving the window pauses their timers; a swipe to the right dismisses one; F8 moves focus to them. New toasts
 * are read out through a live region. The stacking and animation rules are `.ui-toaster` / `.ui-toast` in
 * assets/css/main.css. Mounted once, in app.vue, and rendered only in the browser.
 */
const props = withDefaults(defineProps<{
  expand?: boolean
  /** Default lifetime in milliseconds; a toast's own `duration` wins. */
  duration?: number
  progress?: boolean
}>(), { expand: true, duration: 5000, progress: true })

const { toasts, remove } = useToast()
const { t } = useI18n()

const hovered = ref(false)
const focused = ref(false)
const focusWithin = ref(false)
const windowBlurred = ref(false)
const expanded = computed(() => props.expand || hovered.value || focused.value)
const paused = computed(() => hovered.value || focusWithin.value || windowBlurred.value)
provide(TOASTER, { paused, duration: toRef(props, 'duration') })

// Only keyboard focus spreads the stack; a click is already covered by the hover.
const onFocusin = (event: FocusEvent) => {
  focusWithin.value = true
  focused.value = (event.target as HTMLElement).matches(':focus-visible')
}
const onFocusout = (event: FocusEvent) => {
  if ((event.currentTarget as HTMLElement).contains(event.relatedTarget as Node | null)) return
  focusWithin.value = false
  focused.value = false
}

const viewport = useTemplateRef<HTMLElement>('viewport')
const onKeydown = (event: KeyboardEvent) => {
  if (event.key === 'F8' && toasts.value.length) {
    event.preventDefault()
    viewport.value?.focus()
  }
}
const onBlur = () => { windowBlurred.value = true }
const onFocus = () => { windowBlurred.value = false }

const mounted = ref(false)
onMounted(() => {
  mounted.value = true
  window.addEventListener('keydown', onKeydown)
  window.addEventListener('blur', onBlur)
  window.addEventListener('focus', onFocus)
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  window.removeEventListener('blur', onBlur)
  window.removeEventListener('focus', onFocus)
})

// Read each new toast out once: errors interrupt, the rest wait their turn.
const politeMessage = ref('')
const assertiveMessage = ref('')
const announced = new Set<string | number>()
watch(toasts, (list) => {
  for (const toast of list) {
    if (!toast.open || announced.has(toast.id)) continue
    announced.add(toast.id)
    const text = [toast.title, toast.description].filter(Boolean).join('. ')
    if (toast.color === 'error') assertiveMessage.value = text
    else politeMessage.value = text
  }
  for (const id of announced) if (!list.some(toast => toast.id === id)) announced.delete(id)
}, { deep: true })

const items = ref<{ height: number }[]>([])
const GAP = 16
const height = computed(() => items.value.reduce((sum, item) => sum + item.height + GAP, 0))
const frontHeight = computed(() => items.value.at(-1)?.height ?? 0)
const offset = (index: number) => items.value.slice(index + 1).reduce((sum, item) => sum + item.height + GAP, 0)

const onUpdateOpen = (value: boolean, toast: Toast) => {
  if (!value) remove(toast.id)
}
</script>

<template>
  <Teleport v-if="mounted" to="body">
    <div class="sr-only" role="status" aria-live="polite" aria-atomic="true">{{ politeMessage }}</div>
    <div class="sr-only" role="alert" aria-live="assertive" aria-atomic="true">{{ assertiveMessage }}</div>
    <ol
      ref="viewport"
      tabindex="-1"
      :aria-label="`${t('notifications.title')} (F8)`"
      class="ui-toaster"
      :data-expanded="expanded"
      :style="{ '--front-height': `${frontHeight}px`, '--height': `${height}px` }"
      @mouseenter="hovered = true"
      @mouseleave="hovered = false"
      @focusin="onFocusin"
      @focusout="onFocusout"
    >
      <UiToast
        v-for="(toast, index) of toasts"
        :key="toast.id"
        ref="items"
        :open="toast.open"
        :title="toast.title"
        :description="toast.description"
        :icon="toast.icon"
        :color="toast.color"
        :orientation="toast.orientation"
        :actions="toast.actions"
        :duration="toast.duration"
        :close="toast.close ?? true"
        :progress="progress && toast.progress !== false"
        class="ui-toast"
        :class="{ 'cursor-pointer': toast.onClick }"
        :data-collapsed="!expanded"
        :data-front="!expanded && index === toasts.length - 1"
        :data-pulsing="toast._duplicate ? (toast._duplicate % 2 === 0 ? 'even' : 'odd') : undefined"
        :style="{
          '--index': index,
          '--before': toasts.length - 1 - index,
          '--offset': offset(index),
          '--scale': expanded ? '1' : 'calc(1 - var(--before) * var(--scale-factor))',
          '--translate': expanded ? 'calc(var(--offset) * var(--translate-factor))' : 'calc(var(--before) * var(--gap))',
          '--transform': 'translateY(var(--translate)) scale(var(--scale))',
        }"
        @update:open="onUpdateOpen($event, toast)"
        @click="toast.onClick?.(toast)"
      />
    </ol>
  </Teleport>
</template>
