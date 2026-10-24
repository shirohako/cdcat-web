<template>
  <CatalogSection v-if="originals.length || derived.length" :title="$t('tracks.originals_section')" :icon="GitBranch">
    <div class="divide-y divide-line">
      <div v-if="originals.length" class="px-5 py-4">
        <p class="mb-2 text-xs font-semibold text-meta">{{ $t('tracks.originals') }}</p>
        <ul class="space-y-1.5">
          <li v-for="(original, index) in originals" :key="index" class="flex min-w-0 items-center gap-2.5 text-sm">
            <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"><Music2 :size="12" /></span>
            <template v-if="original.track">
              <NuxtLink :to="`/tracks/${original.track.id}`" class="truncate font-medium text-title transition-colors hover:text-primary">{{ original.title }}</NuxtLink>
              <NuxtLink :to="`/albums/${original.track.album.id}`" class="min-w-0 truncate text-xs text-meta transition-colors hover:text-primary">{{ original.track.album.title }}</NuxtLink>
            </template>
            <span v-else class="truncate text-body">{{ original.title }}</span>
          </li>
        </ul>
      </div>
      <div v-if="derived.length" class="px-5 py-4">
        <p class="mb-2 text-xs font-semibold text-meta">{{ $t('tracks.derived_tracks', { count: derived.length }) }}</p>
        <ul class="space-y-2">
          <li v-for="item in derived" :key="item.id" class="flex min-w-0 items-center gap-2.5 text-sm">
            <img v-if="item.album.image_url" :src="item.album.image_url" :alt="item.album.title" loading="lazy" class="h-8 w-8 shrink-0 rounded object-cover">
            <span v-else class="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-sunken text-faint"><Disc3 :size="14" /></span>
            <div class="min-w-0 flex-1">
              <NuxtLink :to="`/tracks/${item.id}`" class="block truncate font-medium text-title transition-colors hover:text-primary">{{ item.title }}</NuxtLink>
              <NuxtLink :to="`/albums/${item.album.id}`" class="block truncate text-xs text-meta transition-colors hover:text-primary">{{ item.album.title }}</NuxtLink>
            </div>
            <CatalogPendingBadge v-if="item.album.is_pending" />
          </li>
        </ul>
      </div>
    </div>
  </CatalogSection>
</template>

<script setup lang="ts">
import type { TrackDetail } from '~/types/album'
import { Disc3, GitBranch, Music2 } from '@lucide/vue'

/** What the track is based on, and the tracks based on it. Text-only originals are plain text. */
defineProps<{ originals: NonNullable<TrackDetail['originals']>, derived: NonNullable<TrackDetail['derived_tracks']> }>()
</script>
