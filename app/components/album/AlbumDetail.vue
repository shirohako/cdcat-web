<template>
  <div>
    <AlbumHero :album="album" @open-cover="gallery?.openCover()" @favorited="emit('favorited', $event)" />
    <CatalogPendingBanner :pending="album.is_pending" :revision="album.pending_revision" />

    <div class="container mx-auto max-w-6xl px-4 py-8 md:px-8 2xl:max-w-7xl">
      <!-- The side column a little narrower than a third, so the tracklist and the other main cards get the room -->
      <div class="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_18rem] xl:grid-cols-[minmax(0,1fr)_19.5rem] 2xl:grid-cols-[minmax(0,1fr)_21rem]">
        <div class="min-w-0 space-y-8">
          <AlbumDescriptions :album="album" />

          <AlbumCredits :credits="album.credits" :discs="album.discs" />

          <AlbumTracklist :discs="album.discs" :bonuses="album.bonuses" :languages="album.tracklist_languages" :credits="album.credits" :locked="album.is_pending" @favorited="(id, value) => emit('trackFavorited', id, value)" />

          <AlbumProducts :products="album.products" :bonuses="album.bonuses" :discs="album.discs" :images="album.images" />

          <!-- Albums awaiting review can only be viewed: reviews and tracking open after approval. -->
          <AlbumReviews v-if="!album.is_pending" ref="reviews" :album-id="album.id" @changed="emit('changed')" />
        </div>

        <div class="min-w-0 space-y-6">
          <div v-if="album.is_pending" class="rounded-xl border border-dashed border-warning/30 bg-warning/10 p-4 text-sm text-body">
            {{ $t('pending.locked') }}
          </div>
          <AlbumStats
            :album-id="album.id"
            :views-count="album.views_count"
            :favorites-count="album.favorites_count"
            :tracking-stats="album.tracking_stats"
            :initial-tracking="album.user_tracking"
            :locked="album.is_pending"
            @tracked="(tracking, previous) => emit('tracked', tracking, previous)"
          />
          <AlbumRankings
            v-if="!album.is_pending"
            :rating="album.rating"
            :rating-count="album.rating_count"
            :distribution="album.rating_distribution"
            :ranking="album.ranking"
            :reviewed="!!reviews?.mine"
            @write-review="reviews?.openEditor()"
          />
          <AlbumLinks :links="album.links" />
          <AlbumGallery ref="gallery" :images="album.images" :products="album.products" :bonuses="album.bonuses" :discs="album.discs" />
          <AlbumArticles :articles="album.articles ?? []" />
          <DiscussionRelatedDiscussions v-if="!album.is_pending" :id="album.id" type="album" :startable="false" compact />
          <AlbumEditing :album-id="album.id" :version="album.version" :edited-at="album.edited_at" :discs="album.discs" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Album } from '~/types/album'
import type { TrackingStatus } from '~/types/tracking'
import type { AlbumReview } from '~/types/reviews'

/** The album page below the navbar: the album's page and the album editor's preview (EditorAlbumPreview) both show it. */
defineProps<{ album: Album }>()
const emit = defineEmits<{
  favorited: [value: boolean]
  trackFavorited: [trackId: number, value: boolean]
  tracked: [tracking: TrackingStatus | null, previous: TrackingStatus | null]
  /** A review was written or removed: the album's rating moved. */
  changed: []
}>()

const gallery = ref<{ openCover: () => void } | null>(null)
const reviews = ref<{ openEditor: () => void, mine: AlbumReview | null } | null>(null)
</script>
