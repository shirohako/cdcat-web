<template>
  <section class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
    <!-- Header -->
    <div class="px-5 py-3 border-b border-gray-100 flex items-center gap-2.5">
      <div class="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
        <Users :size="15" class="text-purple-500" />
      </div>
      <h2 class="text-base font-bold text-gray-900">{{ $t('album.section.artists') }}</h2>
      <span v-if="artists.length > 1" class="ml-auto text-xs text-gray-400">{{ artists.length }}</span>
    </div>

    <!-- Artist list -->
    <div v-if="artists.length > 0" class="divide-y divide-gray-50">
      <NuxtLink
        v-for="artist in artists"
        :key="artist.id"
        :to="`/artists/${artist.id}`"
        class="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/80 transition-colors group"
      >
        <!-- Avatar -->
        <div class="w-9 h-9 rounded-full overflow-hidden bg-gray-100 border border-gray-100 flex items-center justify-center shrink-0">
          <img
            v-if="artist.image_url"
            :src="artist.image_url"
            :alt="artist.credited_as || artist.name"
            class="w-full h-full object-cover"
          >
          <span v-else class="text-sm font-bold text-gray-400">
            {{ (artist.credited_as || artist.name || '?').charAt(0).toUpperCase() }}
          </span>
        </div>

        <!-- Name -->
        <div class="flex-1 min-w-0">
          <p class="text-sm font-semibold text-gray-800 truncate leading-snug">
            {{ artist.credited_as || artist.name }}
          </p>
          <p
            v-if="(artist.credited_as && artist.credited_as !== artist.name) || artist.type"
            class="text-[11px] text-gray-400 truncate leading-none mt-0.5"
          >
            {{ [artist.credited_as && artist.credited_as !== artist.name ? artist.name : '', artist.type ? enumLabel('artist_type', artist.type) : ''].filter(Boolean).join(' · ') }}
          </p>
        </div>

        <!-- Arrow -->
        <ChevronRight :size="14" class="shrink-0 text-gray-300 group-hover:text-purple-400 transition-colors" />
      </NuxtLink>
    </div>

    <!-- Empty state -->
    <div v-else class="flex items-center justify-center gap-3 py-5 px-5">
      <div class="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
        <Users :size="15" class="text-purple-300" />
      </div>
      <div class="text-left">
        <p class="text-sm font-semibold text-gray-500">{{ $t('album.empty.artists_title') }}</p>
        <p class="text-xs text-gray-400 mt-0.5">{{ $t('album.empty.artists_desc') }}</p>
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
