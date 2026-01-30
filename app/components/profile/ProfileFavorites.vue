<template>
  <section class="animate-fade-in-up-slow">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
        <Disc3 :size="20" class="text-gray-400" />
        {{ $t('profile.favorites') }}
      </h2>
      <span class="text-xs text-gray-400">{{ totalCount }} {{ $t('profile.total') }}</span>
    </div>

    <div class="bg-white/70 backdrop-blur-xl rounded-2xl ring-1 ring-black/5 p-4 shadow-sm">
      <div class="grid grid-cols-3 gap-2.5">
        <NuxtLink
          v-for="work in works.slice(0, 6)"
          :key="work.id"
          :to="`/works/${work.workId}`"
          class="group relative aspect-square rounded-xl overflow-hidden bg-gray-100 ring-1 ring-black/5"
        >
          <img
            :src="work.cover"
            :alt="work.workTitle"
            class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
          <div class="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <p class="absolute bottom-1.5 left-1.5 right-1.5 text-[10px] font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 line-clamp-2 leading-tight">
            {{ work.workTitle }}
          </p>
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { Disc3 } from 'lucide-vue-next'
import type { ProfileFavoriteWork } from '~/types/profile'

defineProps<{
  works: ProfileFavoriteWork[]
  totalCount: number
}>()
</script>
