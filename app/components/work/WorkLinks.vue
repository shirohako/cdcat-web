<template>
  <section class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
    <!-- Header -->
    <div class="px-5 py-3 border-b border-gray-100 flex items-center gap-2.5">
      <div class="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
        <Link2 :size="15" class="text-indigo-500" />
      </div>
      <h2 class="text-base font-bold text-gray-900">{{ $t('work.section.links') }}</h2>
      <span v-if="links && links.length > 0" class="ml-auto text-xs text-gray-400">{{ links.length }} 个</span>
    </div>

    <!-- Links grouped by category -->
    <div v-if="links && links.length > 0">
      <template v-for="(group, category) in groupedLinks" :key="category">
        <!-- Category label -->
        <div class="px-5 pt-3 pb-1 flex items-center gap-2">
          <span class="text-[10px] font-bold tracking-widest uppercase" :class="categoryStyle(category).label">
            {{ categoryLabel(category) }}
          </span>
          <div class="flex-1 h-px bg-gray-100"></div>
        </div>

        <!-- Links in this category -->
        <a
          v-for="link in group"
          :key="link.id"
          :href="link.url"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center gap-3 px-5 py-2.5 hover:bg-gray-50/80 transition-colors group"
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
            <p class="text-sm font-medium text-gray-800 leading-snug">
              {{ formatProviderName(link.provider.name) }}
            </p>
            <p class="text-[11px] text-gray-400 truncate leading-none mt-0.5">
              {{ getDomain(link.url) }}
            </p>
          </div>

          <!-- Arrow -->
          <ExternalLink
            :size="13"
            class="shrink-0 text-gray-300 group-hover:text-indigo-400 transition-colors"
          />
        </a>

        <div class="h-1"></div>
      </template>
    </div>

    <!-- Empty state -->
    <div v-else class="flex items-center justify-center gap-3 py-5 px-5">
      <div class="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
        <Link2 :size="15" class="text-indigo-300" />
      </div>
      <div class="text-left">
        <p class="text-sm font-semibold text-gray-500">{{ $t('work.empty.links_title') }}</p>
        <p class="text-xs text-gray-400 mt-0.5">{{ $t('work.empty.links_desc') }}</p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { WorkLink } from '~/types/work'
import { Link2, Globe, ExternalLink } from 'lucide-vue-next'

const props = withDefaults(defineProps<{
  links: WorkLink[]
}>(), {
  links: () => [],
})

const categoryOrder = ['official', 'streaming', 'shop', 'social', 'database', 'other'];

const groupedLinks = computed(() => {
  const groups: Record<string, WorkLink[]> = {};
  for (const link of props.links) {
    const cat = link.provider?.category || 'other';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(link);
  }
  const result: Record<string, WorkLink[]> = {};
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
    official:  { bg: 'bg-blue-50',   icon: 'text-blue-500',   label: 'text-blue-400' },
    streaming: { bg: 'bg-green-50',  icon: 'text-green-500',  label: 'text-green-500' },
    shop:      { bg: 'bg-orange-50', icon: 'text-orange-500', label: 'text-orange-400' },
    social:    { bg: 'bg-violet-50', icon: 'text-violet-500', label: 'text-violet-400' },
    database:  { bg: 'bg-amber-50',  icon: 'text-amber-500',  label: 'text-amber-500' },
    other:     { bg: 'bg-gray-100',  icon: 'text-gray-400',   label: 'text-gray-400' },
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
