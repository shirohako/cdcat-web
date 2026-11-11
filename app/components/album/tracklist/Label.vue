<script setup lang="ts">
/**
 * A grey label in a tracklist: 纯音乐, 原曲, BPM … (roles are coloured CatalogRoleTags, in the same two sizes).
 * `mini` is the density after a 样式's name (清单 [舒适]): as small as 11px words allow, and lighter. `md` is `sm` at 12px,
 * for a label among credits and notes (原曲, 备注, ISRC, +N), the size of the names and role tags beside it.
 */
withDefaults(defineProps<{ size?: 'mini' | 'xs' | 'sm' | 'md' }>(), { size: 'sm' })

const SIZES = {
  mini: 'h-3.75 px-0.75 text-11 font-medium',
  xs: 'h-4 px-1 text-11 font-semibold',
  sm: 'h-[1.125rem] px-1.25 text-11 font-semibold',
  md: 'h-[1.125rem] px-1.25 text-xs font-semibold',
}
</script>

<template>
  <span class="inline-flex shrink-0 items-center rounded-sm bg-black/[0.05] leading-none whitespace-nowrap text-meta dark:bg-white/[0.08]" :class="SIZES[size]"><slot /></span>
</template>
