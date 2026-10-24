<script lang="ts">
import type { InjectionKey } from 'vue'

/** Lets a UiMenuItem close the menu it sits in. */
export const MENU_CLOSE: InjectionKey<() => void> = Symbol('ui-menu-close')
</script>

<script setup lang="ts">
/**
 * A dropdown menu. The `trigger` slot gets `open`, `toggle` and `attrs` (the aria attributes for its button); the
 * default slot holds UiMenuItem rows. Escape, a click outside, choosing an item or leaving the page closes it.
 */
withDefaults(defineProps<{
  align?: 'start' | 'end'
  width?: string
  label?: string
}>(), { align: 'start', width: 'w-52', label: undefined })

const open = ref(false)
const root = useTemplateRef<HTMLElement>('root')
const panelId = useId()

const close = () => { open.value = false }
const toggle = () => { open.value = !open.value }
provide(MENU_CLOSE, close)

const onPointerDown = (event: PointerEvent) => {
  if (!root.value?.contains(event.target as Node)) close()
}

const onKeydown = (event: KeyboardEvent) => {
  if (event.key !== 'Escape') return
  // A menu inside a dialog closes on its own, without the dialog (which listens on window).
  event.stopPropagation()
  close()
}

const listen = () => {
  document.addEventListener('pointerdown', onPointerDown)
  document.addEventListener('keydown', onKeydown)
}
const unlisten = () => {
  document.removeEventListener('pointerdown', onPointerDown)
  document.removeEventListener('keydown', onKeydown)
}

watch(open, (value) => {
  if (!import.meta.client) return
  if (value) listen()
  else unlisten()
})
onBeforeUnmount(unlisten)

const route = useRoute()
watch(() => route.fullPath, close)
</script>

<template>
  <div ref="root" class="relative inline-block">
    <slot
      name="trigger"
      :open="open"
      :toggle="toggle"
      :attrs="{ 'aria-haspopup': 'menu', 'aria-expanded': open, 'aria-controls': open ? panelId : undefined }"
    />
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="-translate-y-1 opacity-0"
      leave-active-class="transition duration-100 ease-in"
      leave-to-class="-translate-y-1 opacity-0"
    >
      <div
        v-if="open"
        :id="panelId"
        role="menu"
        :aria-label="label"
        class="absolute top-full z-40 mt-1.5 overflow-hidden rounded-xl bg-popover p-1 shadow-overlay ring-1 ring-line"
        :class="[width, align === 'end' ? 'right-0' : 'left-0']"
      >
        <slot />
      </div>
    </Transition>
  </div>
</template>
