<template>
  <div class="min-h-screen bg-slate-50" :style="pageCssVariables">
    <section class="mx-auto w-full max-w-6xl px-4 pt-6 2xl:max-w-7xl md:px-8 md:pt-8">
      <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_24px_-20px_rgba(15,23,42,0.24)]">
        <div class="artist-banner bg-slate-200">
          <img :src="bannerUrl" :alt="artistData.name" class="h-full w-full object-cover">
        </div>
        <div class="relative h-11 bg-white md:h-13">
          <div class="artist-avatar absolute left-4 top-0 -translate-y-1/2 overflow-hidden rounded-full border-4 border-white bg-slate-100 shadow-sm ring-1 ring-slate-200 md:left-6">
            <img
              v-if="artist?.image_url"
              :src="artist.image_url"
              :alt="artistData.name"
              class="h-full w-full object-cover"
            >
            <div v-else class="flex h-full w-full items-center justify-center text-slate-300">
              <Users class="h-7 w-7 md:h-9 md:w-9" />
            </div>
          </div>
        </div>
        <div class="p-4 pt-3 sm:p-5 sm:pt-3 md:p-6 md:pt-3">
        <div v-if="pending" class="animate-pulse">
          <div class="h-7 w-48 rounded bg-slate-200" />
          <div class="mt-3 h-3 w-full max-w-xl rounded bg-slate-100" />
          <div class="mt-2 h-3 w-2/3 max-w-md rounded bg-slate-100" />
        </div>

        <div v-else-if="error" class="flex min-h-28 items-center justify-center text-sm text-slate-500">
          {{ $t('common.load_failed') }}
        </div>

        <div v-else class="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div class="min-w-0 flex-1">
            <h1 class="text-lg font-bold tracking-tight text-slate-950 md:text-xl">{{ artistData.name }}</h1>
            <p class="mt-1.5 max-w-3xl text-sm leading-6 text-slate-600">{{ artistData.bio }}</p>

            <div class="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500">
              <span class="inline-flex items-center gap-2">
                <Disc3 :size="16" class="text-slate-400" />
                {{ $t('artists.detail.albums', { count: artistData.albumCount }) }}
              </span>
              <span class="inline-flex items-center gap-2">
                <Users :size="16" class="text-slate-400" />
                {{ $t('artists.detail.followers', { count: artistData.followers }) }}
              </span>
              <span v-if="artist?.region" class="inline-flex items-center gap-2">
                <MapPin :size="16" class="text-slate-400" />
                {{ artist.region }}
              </span>
              <span v-if="artist?.active_since" class="inline-flex items-center gap-2">
                <CalendarDays :size="16" class="text-slate-400" />
                {{ artist.active_since }}
              </span>
            </div>
          </div>

          <div class="flex shrink-0 items-center gap-2 sm:ml-auto">
            <button
              class="inline-flex h-9 items-center gap-2 rounded-md border px-4 text-xs font-semibold transition-colors disabled:cursor-wait disabled:opacity-60"
              :class="isFavorited
                ? 'border-slate-900 bg-slate-900 text-white hover:bg-slate-700'
                : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100'"
              :disabled="isToggling"
              @click="toggleLike"
            >
              <UserCheck v-if="isFavorited" :size="15" />
              <UserPlus v-else :size="15" />
              {{ isFavorited ? $t('artists.detail.following') : $t('artists.detail.follow') }}
            </button>
            <button
              class="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-100 hover:text-slate-800"
              :title="$t('artists.detail.share')"
              @click="handleShare"
            >
              <Share2 :size="15" />
            </button>
            <NuxtLink
              :to="`/contribute/artist/${artistId}`"
              class="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-100 hover:text-slate-800"
              :title="$t('common.edit')"
            >
              <Edit :size="15" />
            </NuxtLink>
          </div>
        </div>
      </div>
      </div>
    </section>

    <main class="mx-auto w-full max-w-6xl px-4 pb-12 pt-6 2xl:max-w-7xl md:px-8 md:pt-8">
      <section class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_24px_-20px_rgba(15,23,42,0.24)]">
        <header class="flex items-center justify-between border-b border-slate-100 px-4 py-4 sm:px-6">
          <div class="flex items-center gap-3">
            <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <Library :size="17" />
            </div>
            <div>
              <h2 class="text-base font-semibold text-slate-900">{{ $t('artists.detail.releases') }}</h2>
            </div>
          </div>
        </header>

        <div class="min-h-80 p-4 sm:p-6">
          <div v-if="albums.length" class="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 md:gap-6 lg:grid-cols-5">
            <AlbumCard
              v-for="album in albums"
              :key="album.id"
              :album="album"
            />
          </div>

          <div v-else class="flex min-h-72 flex-col items-center justify-center text-center">
            <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-300">
              <Disc3 :size="26" />
            </div>
            <p class="mt-4 text-sm font-medium text-slate-600">{{ $t('artists.detail.no_releases') }}</p>
            <p class="mt-1 text-xs text-slate-400">{{ $t('artists.detail.no_releases_desc') }}</p>
          </div>
        </div>
      </section>

      <ArticleRelatedArticles v-if="artist" :id="artist.id" class="mt-6" type="artist" />
      <DiscussionRelatedDiscussions v-if="artist" :id="artist.id" class="mt-6" type="artist" />
    </main>
  </div>
</template>

<script setup>
import {
  CalendarDays,
  Disc3,
  Edit,
  Library,
  MapPin,
  Share2,
  UserCheck,
  UserPlus,
  Users,
} from '@lucide/vue'
import { artistPageConfig } from '~/config/artistPage'

const { isAuthenticated } = useAuth()
const { $api } = useNuxtApp()
const { t } = useI18n()
const route = useRoute()
const artistId = route.params.id
const { data: artist, pending, error } = await useAPI(`/v1/artists/${artistId}`)

const bannerUrl = computed(() => artist.value?.banner_url || artistPageConfig.defaultBannerUrl)
const pageCssVariables = computed(() => ({
  '--artist-banner-mobile-height': `${artistPageConfig.banner.mobileHeight}px`,
  '--artist-banner-desktop-height': `${artistPageConfig.banner.desktopHeight}px`,
  '--artist-avatar-mobile-size': `${artistPageConfig.avatar.mobileSize}px`,
  '--artist-avatar-desktop-size': `${artistPageConfig.avatar.desktopSize}px`,
}))

const artistData = computed(() => ({
  name: artist.value?.name || 'Artist',
  bio: artist.value?.bio || t('artists.detail.no_bio'),
  albumCount: artist.value?.albums_count || 0,
  followers: artist.value?.followers_count || 0,
}))

const seoTitle = computed(() => artist.value?.name || 'Artist')
const seoDescription = computed(() => {
  if (artist.value?.bio) return artist.value.bio.slice(0, 160)
  if (artist.value?.name) return `Explore ${artist.value.name}'s discography on CDCAT.`
  return 'Artist details on CDCAT.'
})

useSeoMeta({
  title: seoTitle,
  description: seoDescription,
  ogTitle: computed(() => `${seoTitle.value} | CDCAT`),
  ogDescription: seoDescription,
  ogType: 'profile',
  ogImage: computed(() => artist.value?.image_url || bannerUrl.value),
  twitterCard: 'summary_large_image',
})

const isFavorited = ref(artist.value?.is_favorited ?? false)
const isToggling = ref(false)

watch(() => artist.value?.is_favorited, (value) => {
  if (value !== undefined) isFavorited.value = value
})

const toggleLike = async () => {
  if (!isAuthenticated.value) {
    await navigateTo(`/auth/login?redirect=${encodeURIComponent(route.fullPath)}`)
    return
  }
  if (isToggling.value) return

  isToggling.value = true
  try {
    const result = await $api(`/v1/me/favorites/artists/${artistId}`, { method: isFavorited.value ? 'DELETE' : 'PUT' })
    isFavorited.value = result.favorited
  } finally {
    isToggling.value = false
  }
}

const handleShare = async () => {
  if (!import.meta.client) return
  const shareData = { title: artistData.value.name, url: window.location.href }
  if (navigator.share) {
    await navigator.share(shareData).catch(() => {})
    return
  }
  await navigator.clipboard?.writeText(shareData.url)
}

const albums = computed(() => (artist.value?.albums || []).map(album => ({
  id: album.id,
  title: album.title,
  image_url: album.image_url,
  type: album.type || 'album',
  catalog_number: album.catalog_number,
  release_date: album.release_date,
  disc_count: album.disc_count || 0,
  track_count: album.track_count || 0,
  views_count: album.views_count || 0,
  favorites_count: album.favorites_count || 0,
  is_favorited: album.is_favorited || false,
})))
</script>

<style scoped>
.artist-banner {
  height: var(--artist-banner-mobile-height);
}

.artist-avatar {
  width: var(--artist-avatar-mobile-size);
  height: var(--artist-avatar-mobile-size);
}

@media (min-width: 768px) {
  .artist-banner {
    height: var(--artist-banner-desktop-height);
  }

  .artist-avatar {
    width: var(--artist-avatar-desktop-size);
    height: var(--artist-avatar-desktop-size);
  }
}
</style>
