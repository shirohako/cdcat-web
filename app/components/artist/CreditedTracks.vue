<template>
  <div class="space-y-6">
    <section v-for="group in groups" :key="group.album.id">
      <NuxtLink :to="`/albums/${group.album.id}`" class="group flex items-center gap-3">
        <div class="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-sunken ring-1 ring-line">
          <img v-if="group.album.image_url" v-img-fade :src="group.album.image_url" :alt="group.album.title" class="h-full w-full object-cover" loading="lazy">
          <div v-else class="flex h-full w-full items-center justify-center text-faint"><Disc3 :size="18" /></div>
        </div>
        <div class="min-w-0">
          <p class="flex items-center gap-2 text-sm font-semibold text-title transition-colors group-hover:text-primary">
            <span class="truncate">{{ group.album.title }}</span>
            <CatalogPendingBadge v-if="group.album.is_pending" />
          </p>
          <p class="mt-0.5 text-xs text-meta">
            {{ group.album.release_date ? formatDate(group.album.release_date, group.album.release_date_precision) : '—' }}
            <template v-if="group.album.catalog_number"> · {{ group.album.catalog_number }}</template>
          </p>
        </div>
      </NuxtLink>
      <ul class="mt-2 divide-y divide-line border-t border-line">
        <li v-for="track in group.tracks" :key="track.id" class="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-2 text-sm">
          <span class="w-10 shrink-0 font-mono text-xs tabular-nums text-meta">{{ trackNumber(group, track) }}</span>
          <NuxtLink :to="`/tracks/${track.id}`" class="min-w-0 flex-1 truncate text-body transition-colors hover:text-primary">{{ track.title }}</NuxtLink>
          <span class="flex flex-wrap items-baseline gap-1.5 pl-13 sm:pl-0">
            <span v-for="(credit, index) in track.roles" :key="index" class="inline-flex items-baseline gap-1">
              <span class="rounded-md px-1.5 py-0.5 text-[11px] font-semibold" :class="getAlbumRolePalette(roleCategory(credit.role)).badge">{{ roleName(credit.role) }}</span>
              <span v-if="credit.detail" class="text-xs text-meta">({{ credit.detail }})</span>
              <span v-if="credit.credited_as && credit.credited_as !== artistName" class="text-xs text-meta">{{ $t('artists.detail.credited_as', { name: credit.credited_as }) }}</span>
            </span>
          </span>
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { ArtistCreditedAlbum, ArtistCreditedTrack } from '~/types/artist'
import { Disc3 } from '@lucide/vue'
import { getAlbumRolePalette } from '~/utils/albumRolePalette'

defineProps<{ groups: ArtistCreditedAlbum[], artistName: string }>()

const { formatDate } = useCatalogDisplay()
const { roleName, roleCategory } = useCatalogSchema()

/** 03 on a single-disc album, 1-03 when there are several discs; an explicit label (A1) wins. */
const trackNumber = (group: ArtistCreditedAlbum, track: ArtistCreditedTrack) => {
  if (track.number_label) return track.number_label
  const number = String(track.track_number).padStart(2, '0')
  return group.album.disc_count > 1 ? `${track.disc_position}-${number}` : number
}
</script>
