<template>
  <div class="min-h-screen bg-gray-50/80">
    <div class="container mx-auto px-4 md:px-6 py-10 max-w-6xl">
      <!-- Header -->
      <div class="mb-10">
        <h1 class="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">{{ $t('tracking.title') }}</h1>
        <p class="mt-1.5 text-sm text-gray-500">{{ $t('tracking.description') }}</p>
      </div>

      <!-- Stats Cards -->
      <div v-if="!statsLoading" class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <button
          v-for="card in statCards"
          :key="card.status"
          class="bg-white rounded-2xl shadow-md ring-1 ring-black/5 p-6 text-left transition-all duration-200 hover:shadow-lg"
          :class="{ 'ring-2 ring-blue-400 shadow-lg': activeTab === card.status }"
          @click="activeTab = card.status"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500">{{ card.label }}</p>
              <p class="text-3xl font-bold text-gray-900 mt-2">{{ stats[card.status] }}</p>
            </div>
            <Icon :name="card.icon" class="w-12 h-12" :class="card.iconColor" />
          </div>
        </button>
      </div>

      <!-- Loading Stats -->
      <div v-else class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div v-for="i in 5" :key="i" class="bg-white rounded-2xl shadow-md ring-1 ring-black/5 p-6">
          <div class="flex items-center justify-between">
            <div>
              <div class="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
              <div class="h-9 w-10 bg-gray-200 rounded animate-pulse mt-3"></div>
            </div>
            <div class="w-12 h-12 bg-gray-100 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>

      <!-- Tabs + Content Card -->
      <div class="bg-white rounded-2xl shadow-md ring-1 ring-black/5 overflow-hidden">
        <nav class="flex flex-wrap gap-0 border-b border-gray-200" aria-label="Tracking tabs">
          <button
            v-for="tab in tabs"
            :key="tab.status"
            type="button"
            class="flex-1 min-w-0 md:flex-1 sm:flex-none flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap"
            :class="activeTab === tab.status
              ? 'border-blue-500 text-blue-600 bg-blue-50/30'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'"
            @click="activeTab = tab.status"
          >
            <Icon :name="tab.icon" class="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
            <span class="truncate">{{ tab.label }}</span>
            <span class="hidden sm:inline text-xs font-semibold text-gray-400 ml-0.5 sm:ml-1">({{ stats[tab.status] }})</span>
          </button>
        </nav>

        <!-- Tab Content -->
        <KeepAlive>
          <TrackingWorksTab
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

useHead({
  title: 'My Tracking | CDCAT'
})

const { getTrackingStats } = useTracking()
const { t } = useI18n()

const activeTab = ref<TrackingStatus>('plan_to_listen')

const stats = ref<TrackingStats>({
  plan_to_listen: 0,
  wishlist: 0,
  completed: 0,
  owned: 0,
  dropped: 0,
  total: 0
})

const statsLoading = ref(false)

const tabs: { status: TrackingStatus; label: string; icon: string }[] = [
  { status: 'plan_to_listen', label: t('tracking.tab.plan_to_listen'), icon: 'lucide:headphones' },
  { status: 'completed', label: t('tracking.tab.completed'), icon: 'lucide:check-circle' },
  { status: 'wishlist', label: t('tracking.tab.wishlist'), icon: 'lucide:bookmark' },
  { status: 'owned', label: t('tracking.tab.owned'), icon: 'lucide:package' },
  { status: 'dropped', label: t('tracking.tab.dropped'), icon: 'lucide:x-circle' }
]

const statCards = [
  { status: 'plan_to_listen' as TrackingStatus, label: t('tracking.tab.plan_to_listen'), icon: 'lucide:headphones', iconColor: 'text-purple-100' },
  { status: 'completed' as TrackingStatus, label: t('tracking.tab.completed'), icon: 'lucide:check-circle', iconColor: 'text-teal-100' },
  { status: 'wishlist' as TrackingStatus, label: t('tracking.tab.wishlist'), icon: 'lucide:bookmark', iconColor: 'text-blue-100' },
  { status: 'owned' as TrackingStatus, label: t('tracking.tab.owned'), icon: 'lucide:package', iconColor: 'text-emerald-100' },
  { status: 'dropped' as TrackingStatus, label: t('tracking.tab.dropped'), icon: 'lucide:x-circle', iconColor: 'text-gray-200' }
]

const loadStats = async () => {
  statsLoading.value = true
  try {
    stats.value = await getTrackingStats()
  } catch (error) {
    console.error('Failed to load tracking stats:', error)
  } finally {
    statsLoading.value = false
  }
}

onMounted(() => {
  loadStats()
})
</script>
