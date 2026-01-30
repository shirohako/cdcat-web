<template>
  <section class="animate-fade-in-up-slow">
    <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
      <div
        v-for="stat in statCards"
        :key="stat.label"
        class="bg-white/70 backdrop-blur-xl rounded-2xl ring-1 ring-black/5 p-4 text-center transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg group"
      >
        <div
          class="w-10 h-10 rounded-xl mx-auto flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
          :class="stat.iconBg"
        >
          <component :is="stat.icon" :size="20" :class="stat.iconColor" />
        </div>
        <p class="text-2xl font-bold text-gray-900 mt-2 tabular-nums">{{ stat.value }}</p>
        <p class="text-xs text-gray-500 mt-0.5">{{ stat.label }}</p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { Star, Heart, Bookmark, MessageCircle, GitPullRequest } from 'lucide-vue-next'
import type { ProfileStats } from '~/types/profile'

const props = defineProps<{
  stats: ProfileStats
}>()

const { t } = useI18n()

const statCards = computed(() => [
  { label: t('profile.stats.reviews'), value: props.stats.reviewsCount, icon: MessageCircle, iconBg: 'bg-blue-50', iconColor: 'text-blue-500' },
  { label: t('profile.stats.avg_score'), value: props.stats.averageScore.toFixed(1), icon: Star, iconBg: 'bg-amber-50', iconColor: 'text-amber-500' },
  { label: t('profile.stats.favorites'), value: props.stats.favoritesCount, icon: Heart, iconBg: 'bg-rose-50', iconColor: 'text-rose-500' },
  { label: t('profile.stats.tracking'), value: props.stats.trackingCount, icon: Bookmark, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-500' },
  { label: t('profile.stats.discussions'), value: props.stats.discussionsCount, icon: MessageCircle, iconBg: 'bg-violet-50', iconColor: 'text-violet-500' },
  { label: t('profile.stats.contributions'), value: props.stats.contributionsCount, icon: GitPullRequest, iconBg: 'bg-indigo-50', iconColor: 'text-indigo-500' }
])
</script>
