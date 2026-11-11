<script setup lang="ts">
import { getAlbumRolePalette } from '~/utils/albumRolePalette'

/**
 * A credit role as a tag, in its category's colour (the 制作人员 card's palette). It only shows what it is given, so
 * it is cheap enough for every row of a tracklist: the caller passes the role's name and category. With a printed job
 * title as `label`, `tip` is its tooltip (useCatalogSchema roleTip: the job title and the role, on two lines). `sm` is
 * 12px, the size of the name tags it goes with (user ask, 2026-11-11: it was 11px beside 12px names).
 */
defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  label: string
  category: string
  size?: 'xs' | 'sm'
  tip?: string
}>(), { size: 'sm', tip: undefined })

const SIZES = { xs: 'h-4 px-1 text-11', sm: 'h-[1.125rem] px-1.5 text-xs' }
const badge = computed(() => getAlbumRolePalette(props.category).badge)
</script>

<template>
  <UiTooltip v-if="tip" :text="tip" class="whitespace-pre-line">
    <span v-bind="$attrs" class="inline-flex shrink-0 items-center rounded-sm font-semibold leading-none whitespace-nowrap" :class="[SIZES[size], badge]">{{ label }}</span>
  </UiTooltip>
  <span v-else v-bind="$attrs" class="inline-flex shrink-0 items-center rounded-sm font-semibold leading-none whitespace-nowrap" :class="[SIZES[size], badge]">{{ label }}</span>
</template>
