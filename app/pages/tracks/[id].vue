<template>
  <div class="min-h-screen bg-base-100">
    <div v-if="track && !mergedInto" :class="revealClass">
      <TrackHero :track="track" :previous="previous" :next="next" :multi-disc="multiDisc" @favorited="value => mutate(current => ({ ...current, is_favorited: value }))" />
      <CatalogPendingBanner :pending="track.is_pending" />

      <div class="container mx-auto max-w-6xl px-4 py-8 md:px-8 2xl:max-w-7xl">
        <div class="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div class="space-y-8 lg:col-span-2">
            <CatalogSection :title="$t('lyrics_ui.lyrics_and_translations')" :icon="FileText" tone="sky">
              <div class="px-5 py-4"><LyricsPanel :key="track.id" :track-id="track.id" /></div>
            </CatalogSection>

            <TrackOriginals :originals="track.originals ?? []" :derived="track.derived_tracks ?? []" />
          </div>

          <div class="space-y-6 lg:col-span-1">
            <TrackAlbumTracklist :tracks="track.album_tracks ?? []" :current-id="track.id" />
            <AlbumCredits :credits="track.credits ?? []" />
            <CatalogSection v-if="track.titles?.length || track.attributes?.length" :title="$t('album.section.information')" :icon="Info" tone="gray">
              <div class="space-y-4 px-5 py-4 text-sm">
                <CatalogTitleList v-if="track.titles?.length" :titles="track.titles" />
                <CatalogAttributeList v-if="track.attributes?.length" :attributes="track.attributes" />
              </div>
            </CatalogSection>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="status === 'error'" class="flex min-h-screen items-center justify-center">
      <div class="alert alert-error max-w-md"><span>{{ $t('tracks.not_found') }}</span></div>
    </div>

    <!-- Also while moving on to the track this one was mapped to. -->
    <SkeletonCatalogDetail v-else hero="track" :sections="2" />
  </div>
</template>

<script setup lang="ts">
import type { TrackDetail } from '~/types/album'
import { FileText, Info } from '@lucide/vue'

const route = useRoute()
const { localName } = useCatalogDisplay()

const { data: track, status, mutate, revealClass } = await usePageAPI<TrackDetail>(`/v1/tracks/${route.params.id}`)

// Tracks of a merged album answer with the track they were mapped to: a 301 on the server (and with
// cached data), a replace once the data arrives after client-side navigation.
const mergedInto = computed(() => track.value && String(track.value.id) !== String(route.params.id) ? track.value.id : null)
if (mergedInto.value) {
  await navigateTo({ path: `/tracks/${mergedInto.value}`, query: route.query }, { replace: true, redirectCode: 301 })
}
watch(mergedInto, (id) => {
  if (id) navigateTo({ path: `/tracks/${id}`, query: route.query }, { replace: true })
})

/** The neighbours in the album's disc and track order, across discs. */
const neighbour = (step: -1 | 1) => computed(() => {
  const list = track.value?.album_tracks ?? []
  const item = list[list.findIndex(item => item.id === track.value?.id) + step]
  return item && list.some(entry => entry.id === track.value?.id) ? { id: item.id, title: localName(item.title, item.titles) } : null
})
const previous = neighbour(-1)
const next = neighbour(1)
const multiDisc = computed(() => new Set((track.value?.album_tracks ?? []).map(item => item.disc_number)).size > 1)

const shownTitle = computed(() => track.value ? localName(track.value.title, track.value.titles) : '')

useHead({ title: computed(() => shownTitle.value || 'Track') })
</script>
