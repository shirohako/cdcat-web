<script setup lang="ts">
/**
 * A connection on the guide's relation map: a line between the blocks either side of it (or above and below it,
 * `vertical`) with what joins them written on it. `lit` turns it the theme colour while one of its blocks is hovered;
 * `dashed` is for the series' own albums, a link that skips the entries.
 */
defineProps<{ label?: string, lit?: boolean, vertical?: boolean, dashed?: boolean }>()
</script>

<template>
  <div class="relative flex items-center justify-center" :class="vertical ? 'flex-col py-1' : 'px-1'" aria-hidden="true">
    <span
      class="absolute transition-colors duration-200 ease-out"
      :class="[
        vertical ? 'inset-y-1 left-1/2 w-0 border-l' : 'inset-x-1 top-1/2 h-0 border-t',
        dashed ? 'border-dashed' : '',
        lit ? 'border-primary' : 'border-faint/60',
      ]"
    />
    <span
      v-for="end in ['start', 'end']"
      :key="end"
      class="absolute size-1.5 rounded-full transition-colors duration-200 ease-out"
      :class="[
        lit ? 'bg-primary' : 'bg-faint',
        vertical ? (end === 'start' ? 'top-0.5 left-1/2 -translate-x-1/2' : 'bottom-0.5 left-1/2 -translate-x-1/2') : (end === 'start' ? 'left-0.5 top-1/2 -translate-y-1/2' : 'right-0.5 top-1/2 -translate-y-1/2'),
      ]"
    />
    <span
      v-if="label"
      class="relative max-w-full rounded-sm bg-sunken px-1 text-center text-[10px] leading-[0.875rem] transition-colors duration-200 ease-out"
      :class="lit ? 'text-title' : 'text-meta'"
    >{{ label }}</span>
  </div>
</template>
