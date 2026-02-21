<template>
  <div class="relative min-h-[calc(100vh-4rem)]">
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
            <ProfileFavorites :works="profile.favoriteWorks" :total-count="profile.stats.favoritesCount" />
            <ProfileArtists :artists="profile.favoriteArtists" />
          </div>

          <!-- Right column -->
          <div class="space-y-6">
            <ProfileStats :stats="profile.stats" />
            <ProfileTaste :tags="profile.musicTaste" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PublicProfile } from '~/types/profile'

const route = useRoute()
const _username = route.params.username as string

// --------------- Mock Data ---------------

const profile = ref<PublicProfile>({
  id: 1,
  username: _username || 'musiclover42',
  nickname: 'Melody Seeker',
  avatar: undefined,
  banner: 'https://placehold.co/1500x500/0f172a/94a3b8?text=Profile+Banner',
  bio: 'Passionate about Japanese music, especially doujin circles and VOCALOID producers. Collecting CDs since 2018. Always looking for hidden gems in the Touhou music scene.',
  created_at: '2023-03-15T00:00:00Z',
  stats: {
    favoritesCount: 156,
    wantListenCount: 64,
    listenedCount: 128,
    wantPurchaseCount: 42,
    purchasedCount: 57,
    droppedCount: 9
  },
  favoriteWorks: [
    { id: 1, workId: 201, workTitle: 'Colorful World', artists: ['sasakure.UK'], releaseDate: '2024-08-14' },
    { id: 2, workId: 202, workTitle: 'Innocent Key', artists: ['FELT'], releaseDate: '2024-05-10' },
    { id: 3, workId: 203, workTitle: 'Eternal Dream', artists: ['EastNewSound'], releaseDate: '2024-03-21' },
    { id: 4, workId: 204, workTitle: 'Sky Gate', artists: ['Halozy'], releaseDate: '2023-12-30' },
    { id: 5, workId: 205, workTitle: 'Cyber Oasis', artists: ['IOSYS'], releaseDate: '2023-10-15' },
    { id: 6, workId: 206, workTitle: 'Lunar Sonata', artists: ['Liz Triangle'], releaseDate: '2023-08-13' }
  ],
  favoriteArtists: [
    { id: 1, artistId: 301, artistName: 'FELT', avatar: undefined },
    { id: 2, artistId: 302, artistName: 'sasakure.UK', avatar: undefined },
    { id: 3, artistId: 303, artistName: 'EastNewSound', avatar: undefined },
    { id: 4, artistId: 304, artistName: 'Halozy', avatar: undefined },
    { id: 5, artistId: 305, artistName: 'IOSYS', avatar: undefined },
    { id: 6, artistId: 306, artistName: 'Liz Triangle', avatar: undefined }
  ],
  musicTaste: [
    { name: 'Touhou Arrange', count: 42, color: 'sky' },
    { name: 'VOCALOID', count: 31, color: 'emerald' },
    { name: 'Doujin', count: 28, color: 'amber' },
    { name: 'Anime OST', count: 19, color: 'rose' },
    { name: 'Game Music', count: 15, color: 'violet' },
    { name: 'Electronic', count: 12, color: 'indigo' },
    { name: 'Rock', count: 9, color: 'orange' },
    { name: 'Orchestral', count: 7, color: 'teal' }
  ]
})

// --------------- SEO ---------------

useHead({
  title: `${profile.value.nickname || profile.value.username} | CDCAT`
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
