<template>
  <div class="min-h-screen bg-base-100">
    <div v-if="pending" class="flex min-h-screen items-center justify-center">
      <span class="loading loading-spinner loading-lg" />
    </div>

    <div v-else-if="error || !album" class="flex min-h-screen items-center justify-center">
      <div class="alert alert-error max-w-md">
        <span>{{ $t('albums.load_failed', { message: error?.message ?? '' }) }}</span>
      </div>
    </div>

    <div v-else>
      <AlbumHero :album="album" @open-cover="gallery?.openCover()" />

      <div class="container mx-auto max-w-6xl px-4 py-8 md:px-8 2xl:max-w-7xl">
        <div class="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div class="space-y-8 lg:col-span-2">
            <AlbumDescriptions v-if="album.description" :description="album.description" />

            <AlbumTracklist :album-id="album.id" :discs="album.discs" :bonuses="album.bonuses" :languages="album.tracklist_languages" />

            <AlbumProducts :products="album.products" :discs="album.discs" :images="album.images" />

            <AlbumBonuses :bonuses="album.bonuses" :products="album.products" :discs="album.discs" :images="album.images" />

            <AlbumGallery ref="gallery" :images="album.images" :products="album.products" :bonuses="album.bonuses" :discs="album.discs" />

            <AlbumCredits :credits="album.credits" />

            <AlbumReviews :initial-reviews="album.reviews ?? []" :reviews-count="album.reviews_count" :album-id="String(album.id)" />
            <AlbumReviewModal v-model="showReviewModal" :album-id="String(album.id)" @saved="refresh" />

            <ShoutBox :id="album.id" resource="albums" />
          </div>

          <div class="space-y-6 lg:col-span-1">
            <AlbumArtistCard :artists="album.artists" />
            <AlbumTracking :album-id="String(album.id)" :initial-tracking="album.user_tracking" />
            <AlbumStats :views-count="album.views_count" :favorites-count="album.favorites_count" :tracking-stats="album.tracking_stats" />
            <AlbumRankings :user-score="album.rating" :rating-count="album.reviews_count" @write-review="writeReview" />
            <AlbumInfo :album="album" />
            <AlbumLinks :links="album.links" />
            <AlbumArticles :articles="album.articles ?? []" />
            <DiscussionRelatedDiscussions :id="album.id" type="album" />
            <AlbumContributors :contributors="album.contributors" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Album } from '~/types/album'

const route = useRoute()
const router = useRouter()
const { isAuthenticated } = useAuth()
const { localName } = useCatalogDisplay()

const { data: album, pending, error, refresh } = await useAPI<Album>(`/v1/albums/${route.params.id}`)

const gallery = ref<{ openCover: () => void } | null>(null)
const showReviewModal = ref(false)

const writeReview = () => {
  if (!isAuthenticated.value) {
    navigateTo({ path: '/auth/login', query: { redirect: router.currentRoute.value.fullPath } })
    return
  }
  showReviewModal.value = true
}

const seoTitle = computed(() => album.value ? localName(album.value.title, album.value.titles) : 'Album')
const seoDescription = computed(() => album.value?.description?.slice(0, 160) || (album.value ? `${album.value.title} on CDCAT.` : 'Music album details on CDCAT.'))
useSeoMeta({
  title: seoTitle,
  description: seoDescription,
  ogTitle: computed(() => `${seoTitle.value} | CDCAT`),
  ogDescription: seoDescription,
  ogType: 'music.album',
  ogImage: computed(() => album.value?.cover?.medium_url || album.value?.image_url || undefined),
  twitterCard: 'summary_large_image',
})
</script>
