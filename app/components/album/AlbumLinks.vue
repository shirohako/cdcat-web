<template>
  <section class="card overflow-hidden">
    <!-- Header -->
    <UiSectionTitle :title="$t('album.section.links')" :icon="Link2" size="sm" class="px-5 pb-2 pt-4 [&_h2]:leading-5">
      <template v-if="links.length" #actions>
        <span class="text-xs text-meta">{{ $t('content_display.links', { count: links.length }) }}</span>
      </template>
    </UiSectionTitle>

    <!-- Links grouped by category in their own order, each group a small label over a row of grey tags (the category's
         icon on a tile in the site's own hue, then the link's own name, or the site's when it has none; the host in the
         tooltip, which glides along the tags). A click opens the external link card. Past COLLAPSED_COUNT links only the
         first ones show until expanded. -->
    <div v-if="links && links.length > 0" class="space-y-3 px-5 pb-4 pt-1.5">
      <div v-for="(group, category) in shownGroups" :key="category">
        <p class="text-11 font-semibold text-meta">{{ $t(`catalog.link_category.${linkCategoryKey(category)}`) }}</p>
        <div class="mt-1.5 flex flex-wrap gap-1.5">
          <UiTooltip v-for="link in group" :key="link.id" group="album-links" :text="linkHost(link.url)">
            <a
              :href="link.url"
              target="_blank"
              rel="noopener noreferrer"
              class="group inline-flex h-7 min-w-0 max-w-full items-center gap-1.5 rounded-md bg-black/[0.05] pl-1 pr-2.5 text-13 font-semibold text-title transition-colors duration-150 hover:bg-black/[0.1] dark:bg-white/[0.08] dark:hover:bg-white/[0.14]"
              @click="onClick($event, catalogLinkInfo(link))"
            >
              <CatalogLinkTile :category="link.provider?.category" :provider-key="link.provider?.key" />
              <span class="truncate">{{ linkName(link) }}</span>
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
import type { CatalogLink } from '~/types/catalog'
import { LINK_CATEGORIES, linkCategoryKey, linkHost, linkName } from '~/utils/linkProviders'
import { ChevronDown, ChevronUp, ExternalLink, Link2 } from '@lucide/vue'

const props = withDefaults(defineProps<{
  links?: CatalogLink[]
}>(), {
  links: () => [],
})

const { onClick } = useExternalLink()

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
</script>
