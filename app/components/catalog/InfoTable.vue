<script setup lang="ts">
/**
 * A fact sheet of CatalogInfoRow rows. `frame` (the default) is a table: a hairline frame and a hairline between rows,
 * the labels in a faint grey column. `lines` is a plain list with a hairline between rows and no frame, for a table
 * that may have one row only. CatalogAttributeList `rows` adds its attributes as rows of the same table.
 */
export type InfoTableVariant = 'frame' | 'lines'

const props = withDefaults(defineProps<{ variant?: InfoTableVariant }>(), { variant: 'frame' })
provide('infoTableVariant', toRef(props, 'variant'))
</script>

<template>
  <dl class="grid" :class="variant === 'frame' && 'divide-y divide-line overflow-hidden rounded-md border border-line'">
    <slot />
  </dl>
</template>
