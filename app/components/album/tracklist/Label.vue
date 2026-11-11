<script setup lang="ts">
/**
 * A grey label in a tracklist: 纯音乐, 原曲, BPM … (roles are coloured CatalogRoleTags, in the same two sizes).
 * `mini` is the density after a 样式's name (清单 [舒适]): as small as 11px words allow, and lighter. `flag` is 纯音乐
 * after a title: 16px tall, 10px words, the one label under the 11px floor (user asks, 2026-11-11: `sm` read too big,
 * `mini`'s tight box looked cramped, then `sm`'s box with 10px words was still too big). `md` is `sm` at 12px,
 * for a label among credits and notes (原曲, 备注, ISRC, +N), the size of the names and role tags beside it.
 */
withDefaults(defineProps<{ size?: 'mini' | 'flag' | 'xs' | 'sm' | 'md' }>(), { size: 'sm' })

const SIZES = {
  mini: 'h-3.75 px-0.75 text-11 font-medium',
  flag: 'h-4 px-1 text-10 font-semibold',
  xs: 'h-4 px-1 text-11 font-semibold',
  sm: 'h-[1.125rem] px-1.25 text-11 font-semibold',
  md: 'h-[1.125rem] px-1.25 text-xs font-semibold',
}
</script>

<template>
  <span class="inline-flex shrink-0 items-center rounded-sm bg-black/[0.05] leading-none whitespace-nowrap text-meta dark:bg-white/[0.08]" :class="SIZES[size]"><slot /></span>
</template>
