<template>
  <div class="container mx-auto px-4 md:px-6 pt-10 pb-2 max-w-6xl animate-fade-in-up">
    <div class="rounded-3xl bg-white/70 backdrop-blur-xl ring-1 ring-black/5 shadow-xl overflow-hidden">
      <!-- Gradient accent banner -->
      <div class="h-32 sm:h-40 bg-linear-to-r from-sky-400 via-blue-500 to-indigo-500 relative overflow-hidden">
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.15)_1px,transparent_0)] bg-size-[20px_20px]" />
        <div class="absolute top-4 right-8 w-20 h-20 rounded-full bg-white/10 blur-sm" />
        <div class="absolute bottom-6 left-1/4 w-12 h-12 rounded-full bg-white/10 blur-sm" />
        <div class="absolute top-1/2 right-1/3 w-8 h-8 rounded-full bg-white/5" />
      </div>

      <div class="px-6 md:px-10 pb-8 -mt-16 sm:-mt-20 relative">
        <div class="flex flex-col sm:flex-row items-center sm:items-end gap-5 sm:gap-6">
          <!-- Avatar with glow ring -->
          <div class="relative group">
            <div class="absolute -inset-1.5 bg-linear-to-br from-sky-400 via-blue-500 to-indigo-500 rounded-full blur opacity-30 group-hover:opacity-50 transition duration-500" />
            <div class="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full ring-4 ring-white shadow-2xl overflow-hidden bg-linear-to-br from-sky-500 to-indigo-600 flex items-center justify-center">
              <img v-if="profile.avatar" :src="profile.avatar" :alt="profile.username" class="w-full h-full object-cover" />
              <span v-else class="text-4xl sm:text-5xl font-bold text-white select-none">{{ userInitial }}</span>
            </div>
          </div>

          <!-- User info -->
          <div class="flex-1 text-center sm:text-left pb-1">
            <h1 class="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
              {{ profile.nickname || profile.username }}
            </h1>
            <p class="text-sm text-gray-500 mt-1">@{{ profile.username }}</p>
          </div>
        </div>

        <!-- Bio -->
        <p v-if="profile.bio" class="mt-5 text-sm text-gray-600 leading-relaxed max-w-3xl">
          {{ profile.bio }}
        </p>

        <!-- Meta pills -->
        <div class="mt-5 flex flex-wrap items-center gap-2.5">
          <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 backdrop-blur ring-1 ring-black/5 text-xs font-medium text-gray-600 shadow-sm">
            <Calendar :size="14" class="text-gray-400" />
            {{ $t('profile.joined') }} {{ memberSince }}
          </span>
          <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50/80 backdrop-blur ring-1 ring-amber-200/50 text-xs font-medium text-amber-700 shadow-sm">
            <Award :size="14" class="text-amber-500" />
            {{ $t('profile.top_contributor') }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Calendar, Award } from 'lucide-vue-next'
import type { PublicProfile } from '~/types/profile'

const props = defineProps<{
  profile: PublicProfile
}>()

const userInitial = computed(() => {
  const name = props.profile.nickname || props.profile.username || 'U'
  return String(name).trim().slice(0, 1).toUpperCase()
})

const memberSince = computed(() => {
  const d = new Date(props.profile.created_at)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
})
</script>
