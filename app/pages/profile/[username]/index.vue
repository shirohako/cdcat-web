<template>
  <div class="relative min-h-[calc(100vh-4rem)]">
    <!-- Loading state -->
    <div v-if="pending" class="flex min-h-[60vh] items-center justify-center">
      <div class="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
    </div>

    <!-- Error state - User not found -->
    <ProfileNotFound v-else-if="error" :username="username" />

    <!-- Profile content -->
    <template v-else-if="profile">
      <!-- Decorative background -->
      <div aria-hidden="true" class="pointer-events-none absolute inset-0 overflow-hidden">
        <div class="absolute -top-32 -left-28 h-96 w-96 rounded-full bg-linear-to-br from-sky-200/50 to-blue-200/25 blur-3xl" />
        <div class="absolute -top-24 -right-28 h-80 w-80 rounded-full bg-linear-to-br from-amber-200/40 to-rose-200/15 blur-3xl" />
        <div class="absolute -bottom-40 left-1/3 h-96 w-96 rounded-full bg-linear-to-br from-emerald-200/35 to-cyan-200/15 blur-3xl" />
        <div class="absolute top-1/2 right-1/4 h-64 w-64 rounded-full bg-linear-to-br from-violet-200/30 to-indigo-200/15 blur-3xl" />
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.05)_1px,transparent_0)] bg-size-[24px_24px] opacity-35" />
      </div>

      <div class="relative">
        <ProfileHero :profile="profile" />

        <!-- Two-column content -->
        <div class="container mx-auto px-4 md:px-6 py-8 max-w-6xl">
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Left column -->
            <div class="lg:col-span-2 space-y-6">
              <template v-if="activeView === 'default'">
                <ProfileFavorites :works="profile.favorite_works" :total-count="profile.favorites.works" @view-all="activeView = 'favorites'" />
                <ProfileArtists :artists="profile.favorite_artists" @view-all="activeView = 'artists'" />
              </template>
              <ProfileAllFavorites v-else-if="activeView === 'favorites'" :username="username" @back="activeView = 'default'" />
              <ProfileAllArtists v-else-if="activeView === 'artists'" :username="username" @back="activeView = 'default'" />
            </div>

            <!-- Right column -->
            <div class="space-y-6">
              <ProfileStats :stats="profile.tracking" />
              <ProfileTaste />
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { PublicProfile } from '~/types/profile'

const route = useRoute()
const username = route.params.username as string
const activeView = ref<'default' | 'favorites' | 'artists'>('default')

const { data: profile, pending, error } = await useAPI<PublicProfile>(
  `/v1/profiles/${username}`
)

// --------------- SEO ---------------

useHead({
  title: computed(() => {
    if (!profile.value) return 'CDCAT'
    return `${profile.value.nickname || profile.value.username} | CDCAT`
  })
})

definePageMeta({
  // Public page, no auth middleware
})
</script>

<style scoped>
@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-up {
  animation: fade-in-up 0.6s ease both;
}

.animate-fade-in-up-delayed {
  animation: fade-in-up 0.6s ease both;
  animation-delay: 0.15s;
}

.animate-fade-in-up-slow {
  animation: fade-in-up 0.7s ease both;
  animation-delay: 0.3s;
}
</style>
