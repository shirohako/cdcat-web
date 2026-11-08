<template>
  <section class="card overflow-hidden">
    <!-- Header -->
    <UiSectionTitle :title="$t('album.section.links')" :icon="Link2" size="sm" class="px-5 pb-2 pt-4 [&_h2]:leading-5">
      <template v-if="links.length" #actions>
        <span class="text-xs text-meta">{{ $t('content_display.links', { count: links.length }) }}</span>
      </template>
    </UiSectionTitle>

    <!-- Links grouped by category in their own order, each group a small label over a row of grey tags (the category's
         icon on a tile in the site's own hue, the site's name and the link's own name; the address in the tooltip, which glides along the tags). Past
         COLLAPSED_COUNT links only the first ones show until expanded. -->
    <div v-if="links && links.length > 0" class="space-y-3 px-5 pb-4 pt-1.5">
      <div v-for="(group, category) in shownGroups" :key="category">
        <p class="text-11 font-semibold text-meta">{{ $t(`catalog.link_category.${categoryKey(category)}`) }}</p>
        <div class="mt-1.5 flex flex-wrap gap-1.5">
          <UiTooltip v-for="link in group" :key="link.id" group="album-links" :text="getDomain(link.url)">
            <a
              :href="link.url"
              target="_blank"
              rel="noopener noreferrer"
              class="group inline-flex h-7 min-w-0 max-w-full items-center gap-1.5 rounded-md bg-black/[0.05] pl-1 pr-2.5 text-12.5 font-semibold text-title transition-colors duration-150 hover:bg-black/[0.1] dark:bg-white/[0.08] dark:hover:bg-white/[0.14]"
            >
              <span
                class="flex size-5 shrink-0 items-center justify-center rounded-[0.3125rem]"
                :class="tileHue(link) === null ? 'bg-black/[0.06] text-meta dark:bg-white/[0.1]' : 'bg-[oklch(0.94_0.035_var(--hue-link))] text-[oklch(0.56_0.14_var(--hue-link))] dark:bg-[oklch(0.36_0.06_var(--hue-link))] dark:text-[oklch(0.82_0.1_var(--hue-link))]'"
                :style="tileHue(link) === null ? undefined : { '--hue-link': tileHue(link) }"
              >
                <component :is="categoryIcons[categoryKey(category)]" :size="12" />
              </span>
              <span class="truncate">{{ link.provider?.name || getDomain(link.url) }}<span v-if="link.label" class="font-medium text-meta"> · {{ link.label }}</span></span>
              <ExternalLink :size="11" class="shrink-0 text-faint transition-colors duration-150 group-hover:text-title" />
            </a>
          </UiTooltip>
        </div>
      </div>
      <div v-if="collapsible" class="flex justify-center pt-1">
        <UiButton size="xs" :icon-right="expanded ? ChevronUp : ChevronDown" @click="expanded = !expanded">
          {{ expanded ? $t('album.links.collapse') : $t('album.links.show_all', { count: links.length }) }}
        </UiButton>
      </div>
    </div>

    <CatalogEmptyLine v-else :icon="Link2" :text="$t('album.empty.links_title')" size="sm" />
  </section>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import type { CatalogLink } from '~/types/catalog'
import { LINK_CATEGORIES, providerHue } from '~/utils/linkProviders'
import { AtSign, ChevronDown, ChevronUp, Database, ExternalLink, Globe, Headphones, House, Link2, Megaphone, ShoppingBag } from '@lucide/vue'

const props = withDefaults(defineProps<{
  links?: CatalogLink[]
}>(), {
  links: () => [],
})

const groupedLinks = computed(() => {
  const groups: Record<string, CatalogLink[]> = {};
  for (const link of props.links) {
    const cat = link.provider?.category || 'other';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(link);
  }
  const result: Record<string, CatalogLink[]> = {};
  for (const cat of LINK_CATEGORIES) {
    if (groups[cat]?.length) result[cat] = groups[cat];
  }
  for (const cat of Object.keys(groups)) {
    if (!result[cat]) result[cat] = groups[cat]!;
  }
  return result;
});

/** Up to this many links show at first (tags are small); one more would not be worth a button, so it collapses past it. */
const COLLAPSED_COUNT = 8
const collapsible = computed(() => props.links.length > COLLAPSED_COUNT + 1)
const expanded = ref(false)
/** The groups as shown: collapsed, the first COLLAPSED_COUNT links in group order, groups left empty dropped. */
const shownGroups = computed(() => {
  if (!collapsible.value || expanded.value) return groupedLinks.value
  const result: Record<string, CatalogLink[]> = {}
  let left = COLLAPSED_COUNT
  for (const [category, group] of Object.entries(groupedLinks.value)) {
    if (left <= 0) break
    result[category] = group.slice(0, left)
    left -= result[category].length
  }
  return result
})

const categoryIcons: Record<string, Component> = {
  official: House, promotion: Megaphone, streaming: Headphones, shop: ShoppingBag, social: AtSign, database: Database, other: Globe,
}
const categoryKey = (category: string) => category in categoryIcons ? category : 'other'

/** The tile's hue: the site's own, so links of one category differ; links without a known site stay grey. */
const tileHue = (link: CatalogLink) => !link.provider || link.provider.category === 'other' ? null : providerHue(link.provider.key)

const getDomain = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
};
</script>
