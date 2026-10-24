<template>
  <section class="animate-fade-in-up-slow">
    <div class="card p-5">
      <div class="mb-5 flex items-center justify-between">
        <h2 class="flex items-center gap-2.5 text-base font-semibold leading-6 text-title">
          <Mic2 :size="18" class="text-meta" />
          {{ $t('profile.top_artists') }}
          <UiCount v-if="artists.length" :value="artists.length" size="sm" />
        </h2>
        <button v-if="artists.length" class="inline-flex items-center gap-1 text-xs font-medium text-meta hover:text-primary transition-colors duration-150 ease-out cursor-pointer" @click="$emit('view-all')">
          {{ $t('common.view_all') }}
          <ChevronRight :size="14" />
        </button>
      </div>

      <!-- Empty state -->
      <UiEmpty v-if="!artists.length" :title="$t('profile.no_favorite_artists')" :icon="Mic2" />

      <!-- Artists grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        <NuxtLink
          v-for="artist in artists.slice(0, 6)"
          :key="artist.id"
          :to="`/artists/${artist.id}`"
          class="group flex items-center gap-3 rounded-xl bg-sunken px-3 py-2.5 transition-colors duration-150 ease-out hover:bg-card-hover active:bg-card-active"
        >
          <div class="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-sunken ring-1 ring-line transition-transform duration-300 group-hover:scale-110">
            <img v-if="artist.image_url" :src="artist.image_url" :alt="artist.name" class="w-full h-full object-cover">
            <div v-else class="w-full h-full flex items-center justify-center text-faint">
              <Mic2 :size="16" />
            </div>
          </div>
          <span class="text-sm font-medium text-body group-hover:text-primary transition-colors truncate">
            {{ artist.name }}
          </span>
          <ChevronRight :size="14" class="ml-auto text-faint group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<script setup>
import { Mic2, ChevronRight } from '@lucide/vue'

defineProps({
  artists: {
    type: Array,
    required: true
  }
})

defineEmits(['view-all'])
</script>
