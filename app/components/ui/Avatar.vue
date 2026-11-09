<script setup lang="ts">
/**
 * A round avatar (UiImage: a sweep while it loads, then a fade), or the name's first letter on a colour picked from the
 * name (the same name gets the same colour); a picture that fails shows the letter on grey.
 */
const props = withDefaults(defineProps<{
  src?: string | null
  name?: string | null
  alt?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
}>(), { src: undefined, name: undefined, alt: undefined, size: 'md' })

const SIZES = { xs: 'size-6 text-10', sm: 'size-8 text-xs', md: 'size-10 text-sm', lg: 'size-14 text-lg', xl: 'size-20 text-2xl' }

const initial = computed(() => (props.name ?? '').trim().charAt(0).toUpperCase() || '?')
// One of twelve hues round the colour wheel, at a lightness that reads in both themes.
const hue = computed(() => {
  let hash = 0
  for (const char of props.name ?? '') hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return (hash % 12) * 30
})
</script>

<template>
  <span
    class="inline-grid shrink-0 place-items-center overflow-hidden rounded-full bg-sunken font-semibold"
    :class="SIZES[size]"
    :style="src ? undefined : { backgroundColor: `oklch(0.72 0.11 ${hue})`, color: `oklch(0.25 0.04 ${hue})` }"
  >
    <UiImage v-if="src" :src="src" :alt="alt ?? name ?? ''" no-referrer class="size-full">
      <template #fallback><span aria-hidden="true">{{ initial }}</span></template>
    </UiImage>
    <span v-else aria-hidden="true">{{ initial }}</span>
  </span>
</template>
