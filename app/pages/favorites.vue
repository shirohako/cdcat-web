<template>
  <div class="min-h-screen bg-gray-50/80">
    <div class="container mx-auto px-4 md:px-6 py-10 max-w-6xl 2xl:max-w-7xl">
      <!-- Header -->
      <div class="mb-10">
        <h1 class="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">{{ t('collection_pages.favorites.title') }}</h1>
        <p class="mt-1.5 text-sm text-gray-500">{{ t('collection_pages.favorites.description') }}</p>
      </div>

      <!-- Tabs Navigation + Content -->
      <div class="bg-white rounded-2xl shadow-md ring-1 ring-black/5 overflow-hidden">
        <nav class="flex flex-wrap gap-0 border-b border-gray-200" :aria-label="t('collection_pages.favorites.title')">
          <NuxtLink
            v-for="tab in tabs"
            :key="tab.key"
            :to="tab.to"
            class="flex-1 min-w-0 md:flex-1 sm:flex-none flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap"
            :class="isActiveTab(tab.to)
              ? 'border-blue-500 text-blue-600 bg-blue-50/30'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'"
          >
            <Icon :name="tab.icon" class="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
            <span class="truncate">{{ tab.label }}</span>
          </NuxtLink>
        </nav>

        <!-- Child page content -->
        <NuxtPage />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const route = useRoute()
const { t } = useI18n()

const tabs = computed(() => [
  { key: 'works', label: t('collection_pages.favorites.works'), icon: 'lucide:disc-3', to: '/favorites/works' },
  { key: 'songs', label: t('collection_pages.favorites.songs'), icon: 'lucide:music', to: '/favorites/songs' },
  { key: 'artists', label: t('collection_pages.favorites.artists'), icon: 'lucide:mic-2', to: '/favorites/artists' }
])

const isActiveTab = (to: string) => {
  return route.path === to || route.path === to + '/'
}

useHead({
  title: computed(() => t('collection_pages.favorites.seo_title'))
})
</script>
