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
            <ProfileActivity :items="profile.recentActivity" />
            <ProfileReviews :reviews="profile.recentReviews" :total-count="profile.stats.reviewsCount" />
          </div>

          <!-- Right column -->
          <div class="space-y-6">
            <ProfileStats :stats="profile.stats" />
            <ProfileFavorites :works="profile.favoriteWorks" :total-count="profile.stats.favoritesCount" />
            <ProfileArtists :artists="profile.favoriteArtists" />
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
  username: 'musiclover42',
  nickname: 'Melody Seeker',
  avatar: undefined,
  bio: 'Passionate about Japanese music, especially doujin circles and VOCALOID producers. Collecting CDs since 2018. Always looking for hidden gems in the Touhou music scene.',
  created_at: '2023-03-15T00:00:00Z',
  stats: {
    reviewsCount: 47,
    favoritesCount: 156,
    trackingCount: 89,
    discussionsCount: 12,
    contributionsCount: 34,
    averageScore: 7.8
  },
  recentReviews: [
    {
      id: 1,
      workId: 101,
      workTitle: 'Phantasm Brigade',
      workImageUrl: 'https://placehold.co/200x200/e2e8f0/64748b?text=PB',
      artists: [{ id: 1, name: 'FELT' }],
      content: 'A stunning collection that perfectly captures the ethereal beauty of Touhou arrangements. Every track flows seamlessly into the next.',
      score: 9,
      createdAt: '2025-12-20T10:00:00Z',
      reactions: { helpful: 12, unhelpful: 0, funny: 2 }
    },
    {
      id: 2,
      workId: 102,
      workTitle: 'Neon Synthesis',
      workImageUrl: 'https://placehold.co/200x200/dbeafe/3b82f6?text=NS',
      artists: [{ id: 2, name: 'sasakure.UK' }],
      content: 'Experimental electronic production meets VOCALOID at its finest. The layered soundscapes create an immersive listening experience.',
      score: 8,
      createdAt: '2025-12-15T14:30:00Z',
      reactions: { helpful: 8, unhelpful: 1, funny: 0 }
    },
    {
      id: 3,
      workId: 103,
      workTitle: 'Crimson Belvedere',
      workImageUrl: 'https://placehold.co/200x200/fce7f3/ec4899?text=CB',
      artists: [{ id: 3, name: 'EastNewSound' }],
      content: 'Dark, atmospheric Touhou arrangements with powerful vocals. A bit inconsistent in the second half, but the highlights are spectacular.',
      score: 7,
      createdAt: '2025-12-08T09:15:00Z',
      reactions: { helpful: 5, unhelpful: 0, funny: 1 }
    },
    {
      id: 4,
      workId: 104,
      workTitle: 'Starlight Reverie',
      workImageUrl: 'https://placehold.co/200x200/f0fdf4/22c55e?text=SR',
      artists: [{ id: 4, name: 'Halozy' }],
      content: 'Pleasant but somewhat formulaic. The trance elements are well-produced, though the album lacks the surprises of their earlier work.',
      score: 6,
      createdAt: '2025-11-30T17:45:00Z',
      reactions: { helpful: 3, unhelpful: 2, funny: 0 }
    },
    {
      id: 5,
      workId: 105,
      workTitle: 'Digital Horizon',
      workImageUrl: 'https://placehold.co/200x200/fef3c7/f59e0b?text=DH',
      artists: [{ id: 5, name: 'IOSYS' }],
      content: 'Classic IOSYS energy and humor. Not every track lands, but the ones that do are absolute bangers. Great for fans of the circle.',
      score: 8,
      createdAt: '2025-11-22T12:00:00Z',
      reactions: { helpful: 15, unhelpful: 0, funny: 6 }
    }
  ],
  favoriteWorks: [
    { id: 1, workId: 201, workTitle: 'Colorful World', cover: 'https://placehold.co/200x200/dbeafe/3b82f6?text=CW', artists: ['sasakure.UK'], releaseDate: '2024-08-14' },
    { id: 2, workId: 202, workTitle: 'Innocent Key', cover: 'https://placehold.co/200x200/fce7f3/ec4899?text=IK', artists: ['FELT'], releaseDate: '2024-05-10' },
    { id: 3, workId: 203, workTitle: 'Eternal Dream', cover: 'https://placehold.co/200x200/f0fdf4/22c55e?text=ED', artists: ['EastNewSound'], releaseDate: '2024-03-21' },
    { id: 4, workId: 204, workTitle: 'Sky Gate', cover: 'https://placehold.co/200x200/fef3c7/f59e0b?text=SG', artists: ['Halozy'], releaseDate: '2023-12-30' },
    { id: 5, workId: 205, workTitle: 'Cyber Oasis', cover: 'https://placehold.co/200x200/ede9fe/8b5cf6?text=CO', artists: ['IOSYS'], releaseDate: '2023-10-15' },
    { id: 6, workId: 206, workTitle: 'Lunar Sonata', cover: 'https://placehold.co/200x200/e0f2fe/0ea5e9?text=LS', artists: ['Liz Triangle'], releaseDate: '2023-08-13' }
  ],
  favoriteArtists: [
    { id: 1, artistId: 301, artistName: 'FELT', avatar: undefined },
    { id: 2, artistId: 302, artistName: 'sasakure.UK', avatar: undefined },
    { id: 3, artistId: 303, artistName: 'EastNewSound', avatar: undefined },
    { id: 4, artistId: 304, artistName: 'Halozy', avatar: undefined },
    { id: 5, artistId: 305, artistName: 'IOSYS', avatar: undefined },
    { id: 6, artistId: 306, artistName: 'Liz Triangle', avatar: undefined }
  ],
  recentActivity: [
    { id: 1, type: 'review', title: 'Reviewed Phantasm Brigade', description: 'Gave it 9/10', createdAt: '2025-12-20T10:00:00Z', targetId: 101, targetUrl: '/works/101' },
    { id: 2, type: 'favorite', title: 'Added to favorites', description: 'Colorful World by sasakure.UK', createdAt: '2025-12-18T14:30:00Z', targetUrl: '/works/201' },
    { id: 3, type: 'tracking', title: 'Completed listening', description: 'Night of Nights Remix Album', createdAt: '2025-12-15T09:00:00Z' },
    { id: 4, type: 'discussion', title: 'Commented in discussion', description: 'Best Touhou arrangement circles in 2025', createdAt: '2025-12-12T16:45:00Z' },
    { id: 5, type: 'contribution', title: 'Added album data', description: 'Submitted tracklist for new IOSYS release', createdAt: '2025-12-10T11:20:00Z' }
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
