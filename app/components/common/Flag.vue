<script setup lang="ts">
/**
 * A country or region flag from public/flags (Flag Icons by Lipis, MIT, from the Iconify "flag" set), by ISO 3166-1
 * alpha-2 code ("JP"), in the 4:3 drawing. Decorative: the name is always written next to it.
 */
const props = defineProps<{ code: string }>()

const src = computed(() => `/flags/${props.code.toLowerCase()}.svg`)
</script>

<template>
  <span class="inline-flex shrink-0 items-center justify-center">
    <img
      :src="src"
      alt=""
      loading="lazy"
      decoding="async"
      class="h-3 w-4 rounded-[2px] object-cover ring-1 ring-line"
    >
  </span>
</template>
