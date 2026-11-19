<script setup lang="ts">
/**
 * A country or region flag from public/flags (Flag Icons by Lipis, MIT, from the Iconify "flag" set), by ISO 3166-1
 * alpha-2 code ("JP"), in the 4:3 drawing. Decorative: the name is always written next to it, so screen readers skip
 * the picture; its alt text (the code) is for crawlers, which count an empty one as missing.
 */
const props = defineProps<{ code: string }>()

const src = computed(() => `/flags/${props.code.toLowerCase()}.svg`)
</script>

<template>
  <span class="inline-flex shrink-0 items-center justify-center">
    <img
      :src="src"
      :alt="code.toUpperCase()"
      aria-hidden="true"
      loading="lazy"
      decoding="async"
      class="h-3 w-4 rounded-xs object-cover ring-1 ring-line"
    >
  </span>
</template>
