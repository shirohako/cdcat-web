<script setup lang="ts">
import type { Ref } from 'vue'
import type { InfoTableVariant } from './InfoTable.vue'

/**
 * One row of CatalogInfoTable: `label` (or the label slot) on the left, the default slot beside it; the table's
 * variant sets the look. On hover the row takes a neutral grey, darker than the page (over the label column's own
 * grey in `frame`); in `lines` the hairlines on either side of the row step aside.
 */
defineProps<{ label?: string }>()
const variant = inject<Ref<InfoTableVariant>>('infoTableVariant', ref('frame'))
</script>

<template>
  <div
    class="grid grid-cols-[6rem_minmax(0,1fr)] transition-colors duration-150 hover:bg-black/[0.06] sm:grid-cols-[7rem_minmax(0,1fr)] dark:hover:bg-white/[0.07]"
    :class="variant === 'lines' && 'info-line relative -mx-2 gap-3 rounded-md px-2 py-2.5'"
  >
    <dt
      class="text-xs font-medium leading-5 text-meta"
      :class="variant === 'frame' && 'bg-black/[0.03] px-3 py-2.5 dark:bg-white/[0.04]'"
    >
      <slot name="label">{{ label }}</slot>
    </dt>
    <dd class="min-w-0 text-sm leading-5 text-body" :class="variant === 'frame' && 'px-3 py-2.5'">
      <slot />
    </dd>
  </div>
</template>

<style scoped>
/* `lines`: a hairline above every row but the first, inset like the row's fill; it steps aside next to a hovered row. */
.info-line + .info-line::before {
  content: "";
  position: absolute;
  inset-inline: 0.5rem;
  top: 0;
  border-top: 1px solid var(--line);
  transition: border-color 150ms;
}
.info-line:hover::before,
.info-line:hover + .info-line::before {
  border-color: transparent;
}
</style>
