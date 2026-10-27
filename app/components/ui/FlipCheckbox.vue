<script setup lang="ts">
/**
 * A checkbox whose box flips round as it is ticked: it turns a full circle on two axes, grows a little and fills in
 * with the theme colour, the tick showing white on it; the fill fades in more slowly than the flip, so the box lands
 * before its colour does. Pointed at while unticked, it grows a touch and greys in. The default slot is its label.
 * The real input stays in the page (hidden, still focusable), so keyboards and screen readers use it as usual.
 *
 * After Uiverse.io's KhaledMatalkah/tame-owl-66 (MIT, Copyright (c) 2023 Uiverse.io), in Tailwind and the theme's
 * colours.
 */
withDefaults(defineProps<{
  size?: 'sm' | 'md'
}>(), { size: 'md' })

const checked = defineModel<boolean>({ required: true })

const SIZES = {
  sm: { label: 'gap-2 text-xs', box: 'size-4 rounded-[4px] border-[1.5px]', tick: 'size-2.5' },
  md: { label: 'gap-2.5 text-sm', box: 'size-5 rounded-[5px] border-2', tick: 'size-3' },
}
</script>

<template>
  <label class="group inline-flex cursor-pointer select-none items-center text-body transition-colors duration-300 hover:text-title" :class="SIZES[size].label">
    <input v-model="checked" type="checkbox" class="peer sr-only">
    <span
      class="grid shrink-0 place-items-center border-body text-transparent transform-3d [transition:background-color_1.3s,border-color_1.3s,color_1.3s,scale_0.3s,rotate_0.3s,transform_0.3s] group-hover:peer-[:not(:checked)]:scale-105 group-hover:peer-[:not(:checked)]:border-meta group-hover:peer-[:not(:checked)]:bg-black/5 peer-checked:scale-110 peer-checked:rotate-[360deg] peer-checked:rotate-y-[360deg] peer-checked:border-primary peer-checked:bg-primary peer-checked:text-on-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary/40 peer-focus-visible:ring-offset-1 peer-focus-visible:ring-offset-card motion-reduce:transition-none dark:group-hover:peer-[:not(:checked)]:bg-white/10"
      :class="SIZES[size].box"
      aria-hidden="true"
    >
      <svg viewBox="0 0 12 12" :class="SIZES[size].tick" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M 2.5 6.3 L 5 8.6 L 9.6 3.6" />
      </svg>
    </span>
    <slot />
  </label>
</template>
