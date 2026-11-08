<script setup lang="ts">
/** A grey label in a tracklist: 纯音乐, 原曲, BPM … (roles are coloured CatalogRoleTags, in the same two sizes). */
withDefaults(defineProps<{ size?: 'xs' | 'sm' }>(), { size: 'sm' })

const SIZES = { xs: 'h-4 px-1 text-10', sm: 'h-[1.125rem] px-1.25 text-10.5' }
</script>

<template>
  <span class="inline-flex shrink-0 items-center rounded-sm bg-black/[0.05] font-semibold leading-none whitespace-nowrap text-meta dark:bg-white/[0.08]" :class="SIZES[size]"><slot /></span>
</template>
