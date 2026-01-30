<template>
  <section class="animate-fade-in-up-slow">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
        <Star :size="20" class="text-gray-400" />
        {{ $t('profile.recent_reviews') }}
      </h2>
      <span class="text-xs text-gray-400">{{ totalCount }} {{ $t('profile.total') }}</span>
    </div>

    <div class="space-y-3">
      <div
        v-for="review in reviews"
        :key="review.id"
        class="bg-white/70 backdrop-blur-xl rounded-2xl ring-1 ring-black/5 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg group"
      >
        <div class="flex gap-3 sm:gap-4">
          <!-- Album cover -->
          <NuxtLink :to="`/works/${review.workId}`" class="shrink-0">
            <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-gray-100 ring-1 ring-black/5 transition-transform duration-300 group-hover:scale-105">
              <img :src="review.workImageUrl" :alt="review.workTitle" class="w-full h-full object-cover" loading="lazy" />
            </div>
          </NuxtLink>

          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <NuxtLink
                :to="`/works/${review.workId}`"
                class="font-semibold text-sm sm:text-base text-gray-900 hover:text-blue-700 transition-colors line-clamp-1"
              >
                {{ review.workTitle }}
              </NuxtLink>
              <div
                v-if="review.score !== null"
                class="inline-flex items-center justify-center w-7 h-7 rounded-md text-xs font-bold text-white shrink-0"
                :class="getScoreBadgeClass(review.score)"
              >
                {{ review.score }}
              </div>
            </div>

            <p class="text-xs text-gray-500 mt-0.5 line-clamp-1">
              {{ review.artists.map(a => a.name).join(', ') }}
            </p>

            <p class="text-sm text-gray-600 leading-relaxed mt-1.5 line-clamp-2">
              {{ review.content }}
            </p>

            <div class="flex items-center gap-3 mt-2 text-xs text-gray-400">
              <span>{{ formatRelativeTime(review.createdAt) }}</span>
              <span v-if="review.reactions.helpful > 0" class="inline-flex items-center gap-1 text-blue-500">
                <ThumbsUp :size="12" /> {{ review.reactions.helpful }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { Star, ThumbsUp } from 'lucide-vue-next'
import type { ProfileReview } from '~/types/profile'

defineProps<{
  reviews: ProfileReview[]
  totalCount: number
}>()

function getScoreBadgeClass(score: number): string {
  if (score >= 7) return 'bg-green-500'
  if (score >= 5) return 'bg-yellow-500'
  return 'bg-red-500'
}

function formatRelativeTime(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
  return `${Math.floor(diffDays / 365)} years ago`
}
</script>
