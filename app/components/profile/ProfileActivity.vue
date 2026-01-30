<template>
  <section class="animate-fade-in-up-slow">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
        <Activity :size="20" class="text-gray-400" />
        {{ $t('profile.recent_activity') }}
      </h2>
    </div>

    <div class="bg-white/70 backdrop-blur-xl rounded-2xl ring-1 ring-black/5 p-5 shadow-sm">
      <div class="space-y-0">
        <div
          v-for="(item, index) in items"
          :key="item.id"
          class="relative flex gap-4 group"
          :class="{ 'pb-6': index < items.length - 1 }"
        >
          <!-- Timeline line -->
          <div
            v-if="index < items.length - 1"
            class="absolute left-5 top-10 bottom-0 w-px bg-gray-200"
          />
          <!-- Icon circle -->
          <div
            class="relative shrink-0 w-10 h-10 rounded-full flex items-center justify-center ring-2 ring-white shadow-sm transition-transform duration-300 group-hover:scale-110"
            :class="getActivityColor(item.type)"
          >
            <component :is="getActivityIcon(item.type)" :size="16" />
          </div>
          <!-- Content -->
          <div class="flex-1 min-w-0 pt-0.5">
            <p class="text-sm font-medium text-gray-900">{{ item.title }}</p>
            <p class="text-xs text-gray-500 mt-0.5">{{ item.description }}</p>
            <p class="text-xs text-gray-400 mt-1">{{ formatRelativeTime(item.createdAt) }}</p>
          </div>
          <!-- Link arrow -->
          <NuxtLink
            v-if="item.targetUrl"
            :to="item.targetUrl"
            class="shrink-0 self-center w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100"
          >
            <ChevronRight :size="16" class="text-gray-400" />
          </NuxtLink>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import {
  Star, Heart, Bookmark, MessageCircle,
  GitPullRequest, Activity, ChevronRight
} from 'lucide-vue-next'
import type { ProfileActivityItem } from '~/types/profile'

defineProps<{
  items: ProfileActivityItem[]
}>()

function getActivityIcon(type: string) {
  const map: Record<string, typeof Activity> = {
    review: Star,
    favorite: Heart,
    tracking: Bookmark,
    discussion: MessageCircle,
    contribution: GitPullRequest
  }
  return map[type] || Activity
}

function getActivityColor(type: string): string {
  const map: Record<string, string> = {
    review: 'text-blue-500 bg-blue-50',
    favorite: 'text-rose-500 bg-rose-50',
    tracking: 'text-amber-500 bg-amber-50',
    discussion: 'text-emerald-500 bg-emerald-50',
    contribution: 'text-violet-500 bg-violet-50'
  }
  return map[type] || 'text-gray-500 bg-gray-50'
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
