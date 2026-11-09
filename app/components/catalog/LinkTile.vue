<template>
  <!-- The category's icon on a small tile in the site's own hue (soft tile, one lightness and chroma for all), grey for
       links without a known site. -->
  <span
    class="flex size-5 shrink-0 items-center justify-center rounded-[0.3125rem]"
    :class="hue === null ? 'bg-black/[0.06] text-meta dark:bg-white/[0.1]' : 'bg-[oklch(0.94_0.035_var(--hue-link))] text-[oklch(0.56_0.14_var(--hue-link))] dark:bg-[oklch(0.36_0.06_var(--hue-link))] dark:text-[oklch(0.82_0.1_var(--hue-link))]'"
    :style="hue === null ? undefined : { '--hue-link': hue }"
    aria-hidden="true"
  >
    <component :is="CATEGORY_ICONS[linkCategoryKey(category)]" :size="12" />
  </span>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import { linkCategoryKey, linkTileHue } from '~/utils/linkProviders'
import { AtSign, Database, Globe, Headphones, House, Megaphone, ShoppingBag } from '@lucide/vue'

/** A link's tile, as on the album page's links card and in the external link card. */
const props = defineProps<{
  category?: string | null
  providerKey?: string | null
}>()

const CATEGORY_ICONS: Record<string, Component> = {
  official: House, promotion: Megaphone, streaming: Headphones, shop: ShoppingBag, social: AtSign, database: Database, other: Globe,
}

const hue = computed(() => linkTileHue(props.category, props.providerKey))
</script>
