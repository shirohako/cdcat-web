<template>
  <section :class="['grid gap-6 rounded-2xl px-5 py-7 sm:p-8 xl:p-10', large ? 'grid-rows-[auto_1fr] md:row-span-2' : 'content-between', TONES[tone]]">
    <h2
      :class="[
        'landing-display whitespace-pre-line text-title',
        large ? 'text-[2rem] leading-[1.2] sm:text-[2.5rem]' : 'text-[1.625rem] leading-[1.25] sm:text-[1.875rem]'
      ]"
    >
      {{ title }}
    </h2>
    <div :class="large ? 'self-center' : 'w-[64%] justify-self-end'">
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
/**
 * A tile of the home page's collage: a display title over one of the exploded drawings (the default slot). The large
 * tile spans two rows beside the others and centres its drawing in the height it gets; the small ones keep their
 * drawing smaller, in the bottom corner.
 */
withDefaults(defineProps<{
  title: string
  /** The card colour, or a pastel tint of the page's palette (pages/index.vue). */
  tone?: 'card' | 'sky' | 'mint'
  large?: boolean
}>(), { tone: 'card', large: false })
</script>

<script lang="ts">
const TONES = {
  card: 'bg-card',
  sky: 'bg-(--landing-tile-sky)',
  mint: 'bg-(--landing-tile-mint)',
}
</script>
