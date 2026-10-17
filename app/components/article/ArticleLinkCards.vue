<script setup lang="ts">
import { Calendar, Disc3, Film, Library, Mic2 } from '@lucide/vue'
import type { Component } from 'vue'
import type { ContentLinkSummary, ContentLinkType } from '~/types/article'

/** The content an article links to, as cards pointing at each item's page. */
defineProps<{ links: ContentLinkSummary[] }>()
const { t } = useI18n()
const icons: Record<ContentLinkType, Component> = { album: Disc3, artist: Mic2, entry: Film, franchise: Library, event: Calendar }

// Events have no page of their own yet; they open their series.
const href = (link: ContentLinkSummary) => ({
  album: `/albums/${link.id}`,
  artist: `/artists/${link.id}`,
  entry: `/entries/${link.id}`,
  franchise: `/franchises/${link.id}`,
  event: link.event_series_id ? `/event-series/${link.event_series_id}` : '/events',
})[link.type]
</script>

<template>
  <section v-if="links.length" class="rounded-2xl bg-white p-5 shadow-sm">
    <h2 class="text-sm font-bold text-gray-900">{{ t('article_ui.reader.links') }}</h2>
    <div class="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
      <NuxtLink
        v-for="link in links" :key="`${link.type}:${link.id}`" :to="href(link)"
        class="group flex items-center gap-3 rounded-xl border border-gray-100 p-2 transition hover:border-violet-200 hover:bg-violet-50/40">
        <div class="size-12 shrink-0 overflow-hidden rounded-lg bg-gray-100">
          <img v-if="link.image_url" :src="link.image_url" :alt="link.title" class="size-full object-cover" loading="lazy" referrerpolicy="no-referrer">
          <component :is="icons[link.type]" v-else :size="18" class="m-3.5 text-gray-300" />
        </div>
        <div class="min-w-0">
          <p class="truncate text-sm font-medium text-gray-800 group-hover:text-violet-700">{{ link.title }}</p>
          <p class="mt-0.5 text-[11px] text-gray-400">{{ t(`article_ui.link_types.${link.type}`) }}<span v-if="link.date"> · {{ link.date }}</span></p>
        </div>
      </NuxtLink>
    </div>
  </section>
</template>
