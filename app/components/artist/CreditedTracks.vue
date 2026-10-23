<template>
  <div class="space-y-6">
    <section v-for="group in groups" :key="group.album.id">
      <NuxtLink :to="`/albums/${group.album.id}`" class="group flex items-center gap-3">
        <div class="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-slate-100 ring-1 ring-slate-200">
          <img v-if="group.album.image_url" v-img-fade :src="group.album.image_url" :alt="group.album.title" class="h-full w-full object-cover" loading="lazy">
          <div v-else class="flex h-full w-full items-center justify-center text-slate-300"><Disc3 :size="18" /></div>
        </div>
        <div class="min-w-0">
          <p class="flex items-center gap-2 text-sm font-semibold text-slate-900 group-hover:underline">
            <span class="truncate">{{ group.album.title }}</span>
            <CatalogPendingBadge v-if="group.album.is_pending" />
          </p>
          <p class="mt-0.5 text-xs text-slate-400">
            {{ group.album.release_date ? formatDate(group.album.release_date, group.album.release_date_precision) : '—' }}
            <template v-if="group.album.catalog_number"> · {{ group.album.catalog_number }}</template>
          </p>
        </div>
      </NuxtLink>
      <ul class="mt-2 divide-y divide-slate-50 border-t border-slate-100">
        <li v-for="track in group.tracks" :key="track.id" class="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-2 text-sm">
          <span class="w-10 shrink-0 font-mono text-xs tabular-nums text-slate-400">{{ trackNumber(group, track) }}</span>
          <NuxtLink :to="`/tracks/${track.id}`" class="min-w-0 flex-1 truncate text-slate-700 hover:text-slate-950 hover:underline">{{ track.title }}</NuxtLink>
          <span class="flex flex-wrap items-baseline gap-1.5 pl-13 sm:pl-0">
            <span v-for="(credit, index) in track.roles" :key="index" class="inline-flex items-baseline gap-1">
              <span class="rounded-md px-1.5 py-0.5 text-[11px] font-semibold" :class="getAlbumRolePalette(roleCategory(credit.role)).badge">{{ roleName(credit.role) }}</span>
              <span v-if="credit.detail" class="text-xs text-slate-400">({{ credit.detail }})</span>
              <span v-if="credit.credited_as && credit.credited_as !== artistName" class="text-xs text-slate-400">{{ $t('artists.detail.credited_as', { name: credit.credited_as }) }}</span>
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
