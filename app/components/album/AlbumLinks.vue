<template>
  <section class="card overflow-hidden">
    <!-- Header -->
    <UiSectionTitle :title="$t('album.section.links')" :icon="Link2" class="px-5 pb-2 pt-4">
      <template v-if="links && links.length > 0" #actions>
        <span class="text-xs text-meta">{{ $t('content_display.links', { count: links.length }) }}</span>
      </template>
    </UiSectionTitle>

    <!-- Links grouped by category -->
    <div v-if="links && links.length > 0">
      <template v-for="(group, category) in groupedLinks" :key="category">
        <!-- Category label -->
        <div class="px-5 pt-3 pb-1 flex items-center gap-2">
          <span class="text-[10px] font-bold tracking-widest uppercase" :class="categoryStyle(category).label">
            {{ categoryLabel(category) }}
          </span>
          <div class="flex-1 h-px bg-line"/>
        </div>

        <!-- Links in this category -->
        <a
          v-for="link in group"
          :key="link.id"
          :href="link.url"
          target="_blank"
          rel="noopener noreferrer"
          class="group flex items-center gap-3 px-5 py-2.5"
        >
          <!-- Icon -->
          <div
            class="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            :class="categoryStyle(category).bg"
          >
            <Globe :size="13" :class="categoryStyle(category).icon" />
          </div>

          <!-- Name + domain -->
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-title leading-snug transition-colors group-hover:text-primary">
              {{ formatProviderName(link.provider?.name ?? getDomain(link.url)) }}
            </p>
            <p class="text-[11px] text-meta truncate leading-none mt-0.5">
              {{ getDomain(link.url) }}
            </p>
          </div>

          <!-- Arrow -->
          <ExternalLink
            :size="13"
            class="shrink-0 text-faint transition-[color,translate] duration-150 ease-out group-hover:-translate-y-px group-hover:translate-x-0.5 group-hover:text-primary"
          />
        </a>

        <div class="h-1"/>
      </template>
    </div>

    <!-- Empty state -->
    <div v-else class="flex items-center justify-center gap-3 py-5 px-5">
      <div class="w-8 h-8 rounded-lg bg-sunken flex items-center justify-center shrink-0">
        <Link2 :size="15" class="text-faint" />
      </div>
      <div class="text-left">
        <p class="text-sm font-semibold text-meta">{{ $t('album.empty.links_title') }}</p>
        <p class="text-xs text-meta mt-0.5">{{ $t('album.empty.links_desc') }}</p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { CatalogLink } from '~/types/catalog'
import { Link2, Globe, ExternalLink } from '@lucide/vue'

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
  const map: Record<string, { bg: string; icon: string; label: string }> = {
    // Each category keeps its own colour, with a partner for the dark theme; "other" uses the theme's neutrals.
    official:  { bg: 'bg-blue-50 dark:bg-blue-400/15',     icon: 'text-blue-500 dark:text-blue-400',     label: 'text-blue-400 dark:text-blue-300' },
    streaming: { bg: 'bg-green-50 dark:bg-green-400/15',   icon: 'text-green-500 dark:text-green-400',   label: 'text-green-500 dark:text-green-400' },
    shop:      { bg: 'bg-orange-50 dark:bg-orange-400/15', icon: 'text-orange-500 dark:text-orange-400', label: 'text-orange-400 dark:text-orange-300' },
    social:    { bg: 'bg-violet-50 dark:bg-violet-400/15', icon: 'text-violet-500 dark:text-violet-400', label: 'text-violet-400 dark:text-violet-300' },
    database:  { bg: 'bg-amber-50 dark:bg-amber-400/15',   icon: 'text-amber-500 dark:text-amber-400',   label: 'text-amber-500 dark:text-amber-400' },
    other:     { bg: 'bg-sunken',                          icon: 'text-meta',                            label: 'text-meta' },
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
