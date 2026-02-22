<template>
  <section class="animate-fade-in-up-slow">
    <div class="bg-white/70 backdrop-blur-xl rounded-2xl ring-1 ring-black/5 p-5 shadow-sm">
      <div class="mb-5 flex items-center justify-between">
        <h2 class="flex items-center gap-2.5 text-base font-semibold leading-6 text-gray-900">
          <Mic2 :size="18" class="text-gray-400" />
          {{ $t('profile.top_artists') }}
          <span v-if="artists.length" class="inline-flex items-center rounded-full bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-600 ring-1 ring-violet-200/60">
            {{ artists.length }}
          </span>
        </h2>
        <button v-if="artists.length" class="inline-flex items-center gap-1 text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors cursor-pointer" @click="$emit('view-all')">
          {{ $t('common.view_all') }}
          <ChevronRight :size="14" />
        </button>
      </div>

      <!-- Empty state -->
      <div v-if="!artists.length" class="flex flex-col items-center justify-center py-10 text-center">
        <div class="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-violet-50">
          <Mic2 :size="26" class="text-violet-400" />
        </div>
        <p class="text-sm font-medium text-gray-400">{{ $t('profile.no_favorite_artists') }}</p>
      </div>

      <!-- Artists grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        <NuxtLink
          v-for="artist in artists.slice(0, 6)"
          :key="artist.id"
          :to="`/artists/${artist.id}`"
          class="group flex items-center gap-3 rounded-xl border border-black/5 bg-white/85 px-3 py-2.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-200 hover:shadow-sm"
        >
          <div class="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-linear-to-br from-purple-200 to-blue-200 ring-1 ring-black/5 transition-transform duration-300 group-hover:scale-110">
            <img v-if="artist.image_url" :src="artist.image_url" :alt="artist.name" class="w-full h-full object-cover">
            <div v-else class="w-full h-full flex items-center justify-center text-white/60">
              <Mic2 :size="16" />
            </div>
          </div>
          <span class="text-sm font-medium text-gray-700 group-hover:text-blue-700 transition-colors truncate">
            {{ artist.name }}
          </span>
          <ChevronRight :size="14" class="ml-auto text-gray-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all shrink-0" />
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<script setup>
import { Mic2, ChevronRight } from 'lucide-vue-next'

defineProps({
  artists: {
    type: Array,
    required: true
  }
})

defineEmits(['view-all'])
</script>
