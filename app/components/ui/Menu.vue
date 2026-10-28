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
    <UiDropdown :id="panelId" :open="open" :align="align" role="menu" :aria-label="label" class="p-1" :class="width">
      <slot />
    </UiDropdown>
  </div>
</template>
