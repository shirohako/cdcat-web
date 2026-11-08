<script setup lang="ts">
/**
 * A fact sheet of CatalogInfoRow rows. `frame` (the default) is a table: a hairline frame and a hairline between rows,
 * the labels in a faint grey column. `lines` is a plain list with a hairline between rows and no frame, for a table
 * that may have one row only. CatalogAttributeList `rows` adds its attributes as rows of the same table.
 */
export type InfoTableVariant = 'frame' | 'lines'

/**
 * `fitLabels`: the label column is as wide as its widest label, up to 14rem (45% of the table on a narrow screen),
 * instead of the fixed 6–7rem; the rows share the table's columns (subgrid), so every value starts at one line. A
 * label wider than that is the caller's to cut short.
 */
const props = withDefaults(defineProps<{ variant?: InfoTableVariant, fitLabels?: boolean }>(), { variant: 'frame', fitLabels: false })
provide('infoTableVariant', toRef(props, 'variant'))
provide('infoTableFit', toRef(props, 'fitLabels'))
</script>

<template>
  <dl
    class="grid"
    :class="[
      variant === 'frame' && 'divide-y divide-line overflow-hidden rounded-md border border-line',
      fitLabels && ['@container grid-cols-[fit-content(14rem)_minmax(0,1fr)]', variant === 'lines' && 'gap-x-3'],
    ]"
  >
    <slot />
  </dl>
</template>
