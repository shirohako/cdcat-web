<template>
  <section class="animate-fade-in-up-slow">
    <div class="bg-white/70 backdrop-blur-xl rounded-2xl ring-1 ring-black/5 p-5 shadow-sm">
      <div class="divide-y divide-gray-100">
        <!-- Songs -->
        <div class="flex items-center justify-between py-3 first:pt-0 last:pb-0">
          <div class="flex items-center gap-3">
            <span class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-50">
              <Music :size="17" class="text-rose-500" />
            </span>
            <div>
              <h2 class="text-sm font-semibold text-gray-900">{{ $t('profile.favorite_songs') }}</h2>
              <p class="mt-0.5 text-xs text-gray-400">{{ $t('profile.favorite_songs_desc') }}</p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <span class="tabular-nums text-2xl font-bold text-gray-900">{{ songsCount }}</span>
            <button
              v-if="songsCount > 0"
              class="inline-flex items-center gap-1 rounded-lg bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-500 ring-1 ring-black/5 transition-all hover:bg-gray-100 hover:text-gray-700 cursor-pointer"
              @click="$emit('view-all-songs')"
            >
              {{ $t('common.view_all') }}
              <ChevronRight :size="14" />
            </button>
          </div>
        </div>

        <!-- Reviews -->
        <div class="flex items-center justify-between py-3 first:pt-0 last:pb-0">
          <div class="flex items-center gap-3">
            <span class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50">
              <Star :size="17" class="text-amber-500" />
            </span>
            <div>
              <p class="text-sm font-semibold text-gray-900">{{ $t('profile.stats.reviews') }}</p>
              <p class="mt-0.5 text-xs text-gray-400">{{ $t('profile.reviews_desc') }}</p>
            </div>
          </div>
          <span class="tabular-nums text-2xl font-bold text-gray-900">{{ reviewsCount }}</span>
        </div>

        <!-- Contributions -->
        <div class="flex items-center justify-between py-3 first:pt-0 last:pb-0">
          <div class="flex items-center gap-3">
            <span class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
              <GitCommitHorizontal :size="17" class="text-emerald-500" />
            </span>
            <div>
              <p class="text-sm font-semibold text-gray-900">{{ $t('profile.stats.contributions') }}</p>
              <p class="mt-0.5 text-xs text-gray-400">{{ $t('profile.contributions_desc') }}</p>
            </div>
          </div>
          <span class="tabular-nums text-2xl font-bold text-gray-900">{{ contributionsCount }}</span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ChevronRight, GitCommitHorizontal, Music, Star } from 'lucide-vue-next'

defineProps({
  songsCount: {
    type: Number,
    required: true
  },
  reviewsCount: {
    type: Number,
    required: true
  },
  contributionsCount: {
    type: Number,
    required: true
  }
})

defineEmits(['view-all-songs'])
</script>
