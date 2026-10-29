<script setup lang="ts">
/** A grey label in a tracklist: 纯音乐, 原曲, BPM … (roles are coloured CatalogRoleTags, in the same two sizes). */
withDefaults(defineProps<{ size?: 'xs' | 'sm' }>(), { size: 'sm' })

const SIZES = { xs: 'h-4 px-1 text-[10px]', sm: 'h-[1.125rem] px-[5px] text-[10.5px]' }
</script>

<template>
  <span class="inline-flex shrink-0 items-center rounded-[4px] bg-black/[0.05] font-semibold leading-none whitespace-nowrap text-meta dark:bg-white/[0.08]" :class="SIZES[size]"><slot /></span>
</template>
