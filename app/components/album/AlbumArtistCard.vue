<template>
  <section class="card overflow-hidden">
    <!-- Header -->
    <UiSectionTitle :title="$t('album.section.artists')" :icon="Users" :count="artists.length > 1 ? artists.length : undefined" class="px-5 pb-2 pt-4" />

    <!-- Artist list -->
    <div v-if="artists.length > 0" class="divide-y divide-line">
      <NuxtLink
        v-for="artist in artists"
        :key="artist.id"
        :to="`/artists/${artist.id}`"
        class="group flex items-center gap-3 px-5 py-3 transition-colors duration-150 ease-out hover:bg-card-hover active:bg-card-active"
      >
        <!-- Avatar -->
        <div class="w-9 h-9 rounded-full overflow-hidden bg-sunken border border-line flex items-center justify-center shrink-0">
          <img
            v-if="artist.image_url"
            :src="artist.image_url"
            :alt="artist.credited_as || artist.name"
            class="w-full h-full object-cover"
          >
          <span v-else class="text-sm font-bold text-meta">
            {{ (artist.credited_as || artist.name || '?').charAt(0).toUpperCase() }}
          </span>
        </div>

        <!-- Name -->
        <div class="flex-1 min-w-0">
          <p class="text-sm font-semibold text-title truncate leading-snug transition-colors group-hover:text-primary">
            {{ artist.credited_as || artist.name }}
          </p>
          <p
            v-if="(artist.credited_as && artist.credited_as !== artist.name) || artist.type"
            class="text-[11px] text-meta truncate leading-none mt-0.5"
          >
            {{ [artist.credited_as && artist.credited_as !== artist.name ? artist.name : '', artist.type ? enumLabel('artist_type', artist.type) : ''].filter(Boolean).join(' · ') }}
          </p>
        </div>

        <!-- Arrow -->
        <ChevronRight :size="14" class="shrink-0 text-faint group-hover:text-primary transition-colors" />
      </NuxtLink>
    </div>

    <!-- Empty state -->
    <div v-else class="flex items-center justify-center gap-3 py-5 px-5">
      <div class="w-8 h-8 rounded-lg bg-sunken flex items-center justify-center shrink-0">
        <Users :size="15" class="text-faint" />
      </div>
      <div class="text-left">
        <p class="text-sm font-semibold text-meta">{{ $t('album.empty.artists_title') }}</p>
        <p class="text-xs text-meta mt-0.5">{{ $t('album.empty.artists_desc') }}</p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { AlbumArtistRef } from '~/types/album'
import { Users, ChevronRight } from '@lucide/vue'

defineProps<{
  artists: AlbumArtistRef[]
}>()

const { enumLabel } = useCatalogDisplay()
</script>
