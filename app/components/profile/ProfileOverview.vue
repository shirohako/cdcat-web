<template>
  <section class="animate-fade-in-up-slow">
    <div class="card p-5">
      <div class="divide-y divide-line">
        <!-- Tracks -->
        <div class="flex items-center justify-between py-3 first:pt-0 last:pb-0">
          <div class="flex items-center gap-3">
            <UiIconTile :icon="Music" />
            <div>
              <h2 class="text-sm font-semibold text-title">{{ $t('profile.favorite_tracks') }}</h2>
              <p class="mt-0.5 text-xs text-meta">{{ $t('profile.favorite_tracks_desc') }}</p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <span class="tabular-nums text-2xl font-bold text-title">{{ tracksCount }}</span>
            <button
              v-if="tracksCount > 0"
              class="btn btn-xs gap-1 cursor-pointer"
              @click="$emit('view-all-tracks')"
            >
              {{ $t('common.view_all') }}
              <ChevronRight :size="14" />
            </button>
          </div>
        </div>

        <!-- Reviews -->
        <div class="flex items-center justify-between py-3 first:pt-0 last:pb-0">
          <div class="flex items-center gap-3">
            <UiIconTile :icon="Star" />
            <div>
              <p class="text-sm font-semibold text-title">{{ $t('profile.stats.reviews') }}</p>
              <p class="mt-0.5 text-xs text-meta">{{ $t('profile.reviews_desc') }}</p>
            </div>
          </div>
          <span class="tabular-nums text-2xl font-bold text-title">{{ reviewsCount }}</span>
        </div>

        <!-- Contributions -->
        <div class="flex items-center justify-between py-3 first:pt-0 last:pb-0">
          <div class="flex items-center gap-3">
            <UiIconTile :icon="GitCommitHorizontal" />
            <div>
              <p class="text-sm font-semibold text-title">{{ $t('profile.stats.contributions') }}</p>
              <p class="mt-0.5 text-xs text-meta">{{ $t('profile.contributions_desc') }}</p>
            </div>
          </div>
          <span class="tabular-nums text-2xl font-bold text-title">{{ contributionsCount }}</span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ChevronRight, GitCommitHorizontal, Music, Star } from '@lucide/vue'

defineProps({
  tracksCount: {
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

defineEmits(['view-all-tracks'])
</script>
