<template>
  <div class="min-h-screen bg-base-100">
    <div class="container mx-auto max-w-4xl px-4 py-8 md:px-8">
      <div v-if="track && !mergedInto" :class="revealClass">
        <CatalogPendingBanner inline :pending="track.is_pending" />
        <NuxtLink v-if="track.album" :to="`/albums/${track.album.id}#track-${track.id}`" class="mb-6 flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3 hover:shadow-sm">
          <img v-if="track.album.image_url" :src="track.album.image_url" :alt="track.album.title" class="h-14 w-14 rounded object-cover">
          <div class="min-w-0">
            <p class="truncate text-sm font-semibold text-gray-800">{{ track.album.title }}</p>
            <p class="text-xs text-gray-400">
              {{ track.album.catalog_number }} · {{ formatDate(track.album.release_date, track.album.release_date_precision) }}
              · Disc {{ track.disc_number }} · {{ track.number_label || track.track_number }}
            </p>
          </div>
        </NuxtLink>

        <header class="mb-6">
          <h1 class="text-2xl font-bold text-gray-900">{{ shownTitle }}</h1>
          <p v-if="shownTitle !== track.title" class="text-sm text-gray-500">{{ track.title }}</p>
          <p class="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
            <span v-if="track.duration">{{ formatDuration(track.duration) }}</span>
            <span v-if="track.is_instrumental">{{ $t('content_display.instrumental') }}</span>
            <span v-if="track.isrc" class="font-mono text-xs">ISRC {{ track.isrc }}</span>
            <NuxtLink v-if="track.work" :to="`/works/${track.work.id}`" class="hover:underline">
              {{ $t('tracks.work', { title: track.work.title }) }}
              <template v-if="track.work.tracks_count > 1">({{ $t('works.recordings', { count: track.work.tracks_count }) }})</template>
            </NuxtLink>
          </p>
        </header>

        <div class="space-y-6">
          <CatalogSection v-if="track.credits?.length" :title="$t('album.section.credits')" :icon="Users" tone="emerald">
            <ul class="space-y-1.5 px-5 py-4 text-sm">
              <li v-for="credit in track.credits" :key="credit.id" class="flex items-baseline gap-2">
                <span class="w-24 shrink-0 text-xs text-gray-400">{{ roleName(credit.role) }}</span>
                <NuxtLink v-if="credit.artist" :to="`/artists/${credit.artist.id}`" class="hover:underline">{{ credit.credited_as || credit.artist.name }}</NuxtLink>
                <span v-else>{{ credit.credited_as }}</span>
                <span v-if="credit.detail" class="text-gray-400">({{ credit.detail }})</span>
              </li>
            </ul>
          </CatalogSection>

          <CatalogSection v-if="track.titles?.length || track.attributes?.length" :title="$t('album.section.information')" :icon="Info" tone="sky">
            <div class="space-y-4 px-5 py-4 text-sm">
              <CatalogTitleList v-if="track.titles?.length" :titles="track.titles" />
              <CatalogAttributeList v-if="track.attributes?.length" :attributes="track.attributes" />
            </div>
          </CatalogSection>

          <CatalogSection v-if="track.work" :title="$t('lyrics_ui.lyrics_and_translations')" :icon="FileText" tone="sky">
            <div class="px-5 py-4"><LyricsPanel :work-id="track.work.id" /></div>
          </CatalogSection>
        </div>
      </div>
      <div v-else-if="status === 'error'" class="alert alert-error mx-auto max-w-md"><span>{{ $t('tracks.not_found') }}</span></div>
      <!-- Also while moving on to the track this one was mapped to. -->
      <SkeletonCatalogDetail v-else hero="track" :aside="false" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TrackDetail } from '~/types/album'
import { FileText, Info, Users } from '@lucide/vue'

const route = useRoute()
const { localName, formatDate, formatDuration } = useCatalogDisplay()
const { roleName } = useCatalogSchema()

const { data: track, status, revealClass } = await usePageAPI<TrackDetail>(`/v1/tracks/${route.params.id}`)

// Tracks of a merged album answer with the track they were mapped to: a 301 on the server (and with
// cached data), a replace once the data arrives after client-side navigation.
const mergedInto = computed(() => track.value && String(track.value.id) !== String(route.params.id) ? track.value.id : null)
if (mergedInto.value) {
  await navigateTo({ path: `/tracks/${mergedInto.value}`, query: route.query }, { replace: true, redirectCode: 301 })
}
watch(mergedInto, (id) => {
  if (id) navigateTo({ path: `/tracks/${id}`, query: route.query }, { replace: true })
})
const shownTitle = computed(() => track.value ? localName(track.value.title, track.value.titles) : '')

useHead({ title: computed(() => shownTitle.value || 'Track') })
</script>
