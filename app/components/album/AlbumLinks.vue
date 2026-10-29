<template>
  <section class="card overflow-hidden">
    <!-- Header -->
    <UiSectionTitle :title="$t('album.section.links')" :icon="Link2" size="sm" class="px-5 pb-2 pt-4 [&_h2]:leading-5">
      <template v-if="links.length" #actions>
        <span class="text-xs text-meta">{{ $t('content_display.links', { count: links.length }) }}</span>
      </template>
    </UiSectionTitle>

    <!-- Links grouped by category, each group a small label over a row of grey tags (the category's icon and the
         site's name; the address in the tooltip, which glides along the tags). Past COLLAPSED_COUNT links only the
         first ones show until expanded. -->
    <div v-if="links && links.length > 0" class="space-y-3 px-5 pb-4 pt-1.5">
      <div v-for="(group, category) in shownGroups" :key="category">
        <p class="text-[11px] font-semibold text-meta">{{ categoryLabel(category) }}</p>
        <div class="mt-1.5 flex flex-wrap gap-1.5">
          <UiTooltip v-for="link in group" :key="link.id" group="album-links" :text="getDomain(link.url)">
            <a
              :href="link.url"
              target="_blank"
              rel="noopener noreferrer"
              class="group inline-flex h-7 min-w-0 max-w-full items-center gap-1.5 rounded-md bg-black/[0.05] pl-1 pr-2.5 text-[12.5px] font-semibold text-title transition-colors duration-150 hover:bg-black/[0.1] dark:bg-white/[0.08] dark:hover:bg-white/[0.14]"
            >
              <span class="flex size-5 shrink-0 items-center justify-center rounded-sm" :class="categoryStyle(category).bg">
                <component :is="categoryStyle(category).iconComponent" :size="12" :class="categoryStyle(category).icon" />
              </span>
              <span class="truncate">{{ formatProviderName(link.provider?.name ?? getDomain(link.url)) }}</span>
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
import { AtSign, ChevronDown, ChevronUp, Database, ExternalLink, Globe, Headphones, House, Link2, ShoppingBag } from '@lucide/vue'

const props = withDefaults(defineProps<{
  links?: CatalogLink[]
}>(), {
  links: () => [],
})

const categoryOrder = ['official', 'streaming', 'shop', 'social', 'database', 'other'];

const groupedLinks = computed(() => {
  const groups: Record<string, CatalogLink[]> = {};
  for (const link of props.links) {
    const cat = link.provider?.category || 'other';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(link);
  }
  const result: Record<string, CatalogLink[]> = {};
  for (const cat of categoryOrder) {
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

const categoryLabel = (category: string) => {
  const map: Record<string, string> = {
    official: 'Official',
    streaming: 'Streaming',
    shop: 'Shop',
    social: 'Social',
    database: 'Database',
    other: 'Other',
  };
  return map[category] ?? category;
};

const categoryStyle = (category: string) => {
  const map: Record<string, { bg: string; icon: string; iconComponent: Component }> = {
    // Each category keeps its own colour, with a partner for the dark theme; "other" uses the theme's neutrals.
    official:  { bg: 'bg-blue-100 dark:bg-blue-400/20',     icon: 'text-blue-600 dark:text-blue-300',     iconComponent: House },
    streaming: { bg: 'bg-emerald-100 dark:bg-emerald-400/20', icon: 'text-emerald-600 dark:text-emerald-300', iconComponent: Headphones },
    shop:      { bg: 'bg-orange-100 dark:bg-orange-400/20', icon: 'text-orange-600 dark:text-orange-300', iconComponent: ShoppingBag },
    social:    { bg: 'bg-violet-100 dark:bg-violet-400/20', icon: 'text-violet-600 dark:text-violet-300', iconComponent: AtSign },
    database:  { bg: 'bg-amber-100 dark:bg-amber-400/20',   icon: 'text-amber-600 dark:text-amber-300',   iconComponent: Database },
    other:     { bg: 'bg-black/[0.06] dark:bg-white/[0.1]', icon: 'text-meta',                            iconComponent: Globe },
  };
  return map[category] ?? map['other']!;
};

const formatProviderName = (name: string) => {
  return name
    .split('_')
    .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
};

const getDomain = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
};
</script>
