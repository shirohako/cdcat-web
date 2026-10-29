<script setup lang="ts">
import { getAlbumRolePalette } from '~/utils/albumRolePalette'

/**
 * A credit role as a tag, in its category's colour (the 制作人员 card's palette). It only shows what it is given, so
 * it is cheap enough for every row of a tracklist: the caller passes the role's name and category.
 */
const props = withDefaults(defineProps<{
  label: string
  category: string
  size?: 'xs' | 'sm'
}>(), { size: 'sm' })

const SIZES = { xs: 'h-4 px-1 text-[10px]', sm: 'h-[1.125rem] px-1.5 text-[11px]' }
const badge = computed(() => getAlbumRolePalette(props.category).badge)
</script>

<template>
  <span class="inline-flex shrink-0 items-center rounded-[4px] font-semibold leading-none whitespace-nowrap" :class="[SIZES[size], badge]">{{ label }}</span>
</template>
