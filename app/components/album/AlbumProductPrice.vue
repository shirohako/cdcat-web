<template>
  <!-- One button however many prices there are: the first in display order and how many more, all of them on a click. -->
  <UiPopover v-if="first" placement="bottom-end" :label="$t('album.products.all_prices')" class="w-max p-3!">
    <template #trigger="{ toggle, attrs }">
      <UiButton variant="outline" size="xs" :icon-right="ChevronDown" icon-class="size-3" class="gap-1 text-left dark:[--ui-btn-bg:oklch(1_0_0/0.08)]" :class="tag ? 'h-5 min-h-5 px-1.5 py-0 text-[11px]' : 'h-6 min-h-6 px-2 text-xs'" v-bind="attrs" @click="toggle">
        <span class="font-semibold tabular-nums text-title">{{ amount(first) }}</span>
        <span class="font-normal tabular-nums text-meta">+{{ prices.length - 1 }}</span>
      </UiButton>
    </template>
    <ul class="w-64 divide-y divide-line whitespace-normal text-left text-[13px]">
      <li v-for="(price, i) in prices" :key="i" class="flex items-center justify-between gap-6 py-2 first:pt-0 last:pb-0">
        <div class="min-w-0">
          <p class="text-xs leading-5 text-body">{{ kindLabel(price.kind) }}</p>
          <p v-if="price.note" class="text-[11px] leading-4 text-meta">{{ price.note }}</p>
        </div>
        <div class="flex shrink-0 items-center gap-1.5">
          <span v-if="price.tax_included !== null" :class="TAG" class="text-meta">{{ taxLabel(price.tax_included) }}</span>
          <p class="font-semibold tabular-nums text-title">{{ amount(price) }}</p>
        </div>
      </li>
    </ul>
  </UiPopover>
  <span v-else class="inline-flex items-center rounded-md border border-dashed border-line text-meta" :class="tag ? 'h-5 px-1.5 text-[11px]' : 'h-6 px-2 text-xs'">{{ $t('album.products.no_price') }}</span>
</template>

<script setup lang="ts">
import type { ProductPrice } from '~/types/document'
import { ChevronDown } from '@lucide/vue'

/** An edition's price cell, or with `tag` the same at a tag's height, among the tags on a phone. `prices` come sorted. */
const props = defineProps<{ prices: ProductPrice[], tag?: boolean }>()

const TAG = PRODUCT_TAG
const { kindLabel, amount, taxLabel } = usePriceDisplay()
const first = computed(() => props.prices[0])
</script>
