<template>
  <div class="min-h-screen">
    <div class="container mx-auto px-4 md:px-6 py-10 max-w-6xl 2xl:max-w-7xl">
      <!-- Header -->
      <div class="mb-10">
        <h1 class="text-2xl md:text-3xl font-bold text-title tracking-tight">{{ t('collection_pages.favorites.title') }}</h1>
        <p class="mt-1.5 text-sm text-meta">{{ t('collection_pages.favorites.description') }}</p>
      </div>

      <!-- Tabs Navigation + Content -->
      <div class="card overflow-hidden">
        <nav class="flex flex-wrap gap-0 border-b border-line" :aria-label="t('collection_pages.favorites.title')">
          <NuxtLink
            v-for="tab in tabs"
            :key="tab.key"
            :to="tab.to"
            class="flex-1 min-w-0 md:flex-1 sm:flex-none flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm font-medium border-b-2 transition-colors duration-150 ease-out whitespace-nowrap"
            :class="isActiveTab(tab.to)
              ? 'border-primary text-primary bg-primary/5'
              : 'border-transparent text-meta hover:text-title hover:bg-card-hover'"
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
  { key: 'albums', label: t('collection_pages.favorites.albums'), icon: 'lucide:disc-3', to: '/favorites/albums' },
  { key: 'tracks', label: t('collection_pages.favorites.tracks'), icon: 'lucide:music', to: '/favorites/tracks' },
  { key: 'artists', label: t('collection_pages.favorites.artists'), icon: 'lucide:mic-2', to: '/favorites/artists' },
  { key: 'discussions', label: t('discussions.bookmarks.tab'), icon: 'lucide:message-circle', to: '/favorites/discussions' }
])

const isActiveTab = (to: string) => {
  return route.path === to || route.path === to + '/'
}

useHead({
  title: computed(() => t('collection_pages.favorites.seo_title'))
})
</script>
