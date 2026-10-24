<template>
  <div class="min-h-screen">
    <div class="container mx-auto px-4 md:px-6 py-10 max-w-6xl 2xl:max-w-7xl">
      <!-- Header -->
      <div class="mb-10">
        <h1 class="text-2xl md:text-3xl font-bold text-title tracking-tight">{{ $t('tracking.title') }}</h1>
        <p class="mt-1.5 text-sm text-meta">{{ $t('tracking.description') }}</p>
      </div>

      <!-- Stats Cards -->
      <div v-if="statsLoaded" class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <button
          v-for="card in statCards"
          :key="card.status"
          class="card p-6 text-left transition-colors duration-150 ease-out hover:bg-card-hover active:bg-card-active"
          :class="{ 'ring-2 ring-primary': activeTab === card.status }"
          @click="activeTab = card.status"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-meta">{{ card.label }}</p>
              <p class="text-3xl font-bold text-title mt-2">{{ stats[card.status] }}</p>
            </div>
            <Icon :name="card.icon" class="w-12 h-12" :class="card.iconColor" />
          </div>
        </button>
      </div>

      <!-- Loading Stats -->
      <SkeletonStatus v-else class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div v-for="i in 5" :key="i" class="card p-6">
          <div class="flex items-center justify-between">
            <div>
              <div class="skeleton h-4 w-16 rounded" />
              <div class="skeleton mt-3 h-9 w-10 rounded" />
            </div>
            <div class="skeleton size-12 rounded-full" />
          </div>
        </div>
      </SkeletonStatus>

      <!-- Tabs + Content Card -->
      <div class="card overflow-hidden">
        <nav class="flex flex-wrap gap-0 border-b border-line" aria-label="Tracking tabs">
          <button
            v-for="tab in tabs"
            :key="tab.status"
            type="button"
            class="flex-1 min-w-0 md:flex-1 sm:flex-none flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm font-medium border-b-2 transition-colors duration-150 ease-out whitespace-nowrap"
            :class="activeTab === tab.status
              ? 'border-primary text-primary bg-primary/10'
              : 'border-transparent text-meta hover:text-body hover:bg-card-hover'"
            @click="activeTab = tab.status"
          >
            <Icon :name="tab.icon" class="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
            <span class="truncate">{{ tab.label }}</span>
            <span class="hidden sm:inline text-xs font-semibold text-meta ml-0.5 sm:ml-1">({{ stats[tab.status] }})</span>
          </button>
        </nav>

        <!-- Tab Content -->
        <KeepAlive>
          <TrackingAlbumsTab
            :key="activeTab"
            :status="activeTab"
            @update:stats="loadStats"
          />
        </KeepAlive>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TrackingStatus, TrackingStats } from '~/types/tracking'

definePageMeta({
  middleware: 'auth'
})

const { getTrackingStats } = useTracking()
const { t } = useI18n()

useHead({
  title: computed(() => t('user.tracking'))
})

const activeTab = ref<TrackingStatus>('plan_to_listen')

const stats = ref<TrackingStats>({
  plan_to_listen: 0,
  wishlist: 0,
  completed: 0,
  owned: 0,
  dropped: 0,
  total: 0
})

/** The cards show once the numbers are in; later reloads (after a status change) update them in place. */
const statsLoaded = ref(false)

const tabs: { status: TrackingStatus; label: string; icon: string }[] = [
  { status: 'plan_to_listen', label: t('tracking.tab.plan_to_listen'), icon: 'lucide:headphones' },
  { status: 'completed', label: t('tracking.tab.completed'), icon: 'lucide:check-circle' },
  { status: 'wishlist', label: t('tracking.tab.wishlist'), icon: 'lucide:bookmark' },
  { status: 'owned', label: t('tracking.tab.owned'), icon: 'lucide:package' },
  { status: 'dropped', label: t('tracking.tab.dropped'), icon: 'lucide:x-circle' }
]

// Large, faint icons in each status's own colour (as in the albums tab), with a partner for the dark theme.
const statCards = [
  { status: 'plan_to_listen' as TrackingStatus, label: t('tracking.tab.plan_to_listen'), icon: 'lucide:headphones', iconColor: 'text-purple-100 dark:text-purple-400/25' },
  { status: 'completed' as TrackingStatus, label: t('tracking.tab.completed'), icon: 'lucide:check-circle', iconColor: 'text-teal-100 dark:text-teal-400/25' },
  { status: 'wishlist' as TrackingStatus, label: t('tracking.tab.wishlist'), icon: 'lucide:bookmark', iconColor: 'text-blue-100 dark:text-blue-400/25' },
  { status: 'owned' as TrackingStatus, label: t('tracking.tab.owned'), icon: 'lucide:package', iconColor: 'text-emerald-100 dark:text-emerald-400/25' },
  { status: 'dropped' as TrackingStatus, label: t('tracking.tab.dropped'), icon: 'lucide:x-circle', iconColor: 'text-line' }
]

const loadStats = async () => {
  try {
    stats.value = await getTrackingStats()
  } catch (error) {
    console.error('Failed to load tracking stats:', error)
  } finally {
    statsLoaded.value = true
  }
}

// On client-side navigation start at once; after a server render, wait until hydration is done.
if (import.meta.client && !useNuxtApp().isHydrating) loadStats()
else onMounted(loadStats)
</script>
