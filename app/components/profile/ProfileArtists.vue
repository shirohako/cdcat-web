<template>
  <section class="animate-fade-in-up-slow">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
        <Mic2 :size="20" class="text-gray-400" />
        {{ $t('profile.top_artists') }}
      </h2>
    </div>

    <div class="bg-white/70 backdrop-blur-xl rounded-2xl ring-1 ring-black/5 p-4 shadow-sm">
      <div class="space-y-3">
        <NuxtLink
          v-for="artist in artists.slice(0, 5)"
          :key="artist.id"
          :to="`/artists/${artist.artistId}`"
          class="flex items-center gap-3 group"
        >
          <div class="w-10 h-10 rounded-full overflow-hidden bg-linear-to-br from-purple-200 to-blue-200 ring-1 ring-black/5 shrink-0 transition-transform duration-300 group-hover:scale-110">
            <img v-if="artist.avatar" :src="artist.avatar" :alt="artist.artistName" class="w-full h-full object-cover" />
            <div v-else class="w-full h-full flex items-center justify-center text-white/60">
              <Mic2 :size="16" />
            </div>
          </div>
          <span class="text-sm font-medium text-gray-700 group-hover:text-blue-700 transition-colors truncate">
            {{ artist.artistName }}
          </span>
          <ChevronRight :size="14" class="ml-auto text-gray-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all shrink-0" />
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { Mic2, ChevronRight } from 'lucide-vue-next'
import type { ProfileFavoriteArtist } from '~/types/profile'

defineProps<{
  artists: ProfileFavoriteArtist[]
}>()
</script>
