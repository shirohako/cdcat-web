<script setup lang="ts">
/**
 * The box a menu or a small panel drops into from the button that opens it: the floating-layer look (corners,
 * background, shadow, ring) and the slide-in, kept here so every dropdown looks the same. The parent owns `open` and
 * the closing (UiMenu, the navbar's menus, the discussion menus) and puts the box in a `relative` wrapper with its
 * button; attributes such as width, padding, role or listeners go to the box. `side="top"` opens it above the button.
 * With `screen`, phones get it spanning the screen under the navbar instead, for panels too wide to hang from a button
 * that isn't at the edge.
 */
defineOptions({ inheritAttrs: false })

withDefaults(defineProps<{
  open: boolean
  align?: 'start' | 'end'
  side?: 'bottom' | 'top'
  screen?: boolean
}>(), { align: 'start', side: 'bottom' })
</script>

<template>
  <Transition
    enter-active-class="transition duration-150 ease-out motion-reduce:transition-none"
    :enter-from-class="side === 'top' ? 'translate-y-1 opacity-0' : '-translate-y-1 opacity-0'"
    leave-active-class="transition duration-100 ease-in motion-reduce:transition-none"
    :leave-to-class="side === 'top' ? 'translate-y-1 opacity-0' : '-translate-y-1 opacity-0'"
  >
    <div
      v-if="open"
      v-bind="$attrs"
      class="z-40 overflow-hidden rounded-md bg-popover shadow-overlay ring-1 ring-line"
      :class="[
        side === 'top' ? 'absolute bottom-full mb-2' : screen ? 'max-sm:fixed max-sm:inset-x-4 max-sm:top-16 sm:absolute sm:top-full sm:mt-2' : 'absolute top-full mt-2',
        align === 'end' ? (screen ? 'sm:right-0' : 'right-0') : (screen ? 'sm:left-0' : 'left-0'),
      ]"
    >
      <slot />
    </div>
  </Transition>
</template>
