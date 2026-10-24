<template>
  <NuxtLink :to="`/albums/${album.id}`" class="group">
    <div class="overflow-hidden rounded-xl bg-sunken transition-colors duration-150 ease-out group-hover:bg-card-hover group-active:bg-card-active">
      <div class="relative flex aspect-square items-center justify-center overflow-hidden">
        <img
          v-if="album.image_url"
          v-img-fade
          :src="album.image_url"
          :alt="album.title"
          loading="lazy"
          class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          style="image-rendering: -webkit-optimize-contrast;"
        >
        <div v-else class="text-faint"><Disc3 :size="64" /></div>
        <div class="absolute inset-0 bg-linear-to-t from-black/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <CatalogPendingBadge v-if="album.is_pending" overlay class="absolute left-2 top-2" />
        <div class="absolute right-2 top-2 flex gap-1">
          <span v-for="format in badges" :key="format" class="rounded-md bg-scrim px-2 py-1 text-[11px] font-bold text-on-media backdrop-blur-sm">{{ enumLabel('disc_format', format) }}</span>
          <span class="rounded-md bg-scrim px-2 py-1 text-[11px] font-medium text-on-media backdrop-blur-sm">{{ typeLabel }}</span>
        </div>
        <div class="absolute bottom-2 left-2 flex items-center gap-1 rounded-md bg-scrim px-2 py-0.5 text-[10px] font-medium text-on-media backdrop-blur-sm">
          <Disc3 :size="11" />{{ album.disc_count || 0 }}
        </div>
        <div class="absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-scrim px-2 py-0.5 text-[10px] font-medium text-on-media backdrop-blur-sm">
          <Music :size="11" />{{ album.track_count || 0 }}
        </div>
      </div>

      <div class="flex flex-col gap-2 p-4">
        <h3 class="flex h-5 min-w-0 items-center text-sm font-bold text-title transition-colors group-hover:text-primary">
          <span class="truncate">{{ album.title }}</span>
        </h3>
        <div class="flex h-4 min-w-0 items-center gap-1.5 text-xs text-meta">
          <Hash :size="14" class="shrink-0" :class="album.catalog_number ? 'text-meta' : 'text-faint'" />
          <span class="truncate" :class="{ 'text-faint': !album.catalog_number }">{{ album.catalog_number || '—' }}</span>
        </div>
        <div class="flex h-4 min-w-0 items-center gap-1.5 text-xs text-body">
          <Calendar :size="14" class="shrink-0" :class="album.release_date ? 'text-meta' : 'text-faint'" />
          <span :class="{ 'text-faint': !album.release_date }">{{ album.release_date ? formatDate(album.release_date, album.release_date_precision) : '—' }}</span>
        </div>
        <div class="grid h-6 grid-cols-2 items-end border-t border-line text-xs text-body">
          <div class="flex items-center gap-1.5"><Eye :size="14" class="shrink-0 text-meta" /><span>{{ album.views_count || 0 }}</span></div>
          <div class="flex items-center gap-1.5 justify-self-end">
            <Heart :size="14" :fill="album.is_favorited ? 'currentColor' : 'none'" :class="album.is_favorited ? 'text-red-500 dark:text-red-400' : 'text-meta group-hover:text-red-400'" class="shrink-0 transition-colors" />
            <span>{{ album.favorites_count || 0 }}</span>
          </div>
        </div>
      </div>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
import type { AlbumSimple } from '~/types/album'
import { Calendar, Disc3, Eye, Hash, Heart, Music } from '@lucide/vue'

const props = defineProps<{
  album: Pick<AlbumSimple, 'id' | 'title' | 'type' | 'image_url' | 'catalog_number' | 'release_date' | 'disc_count' | 'track_count' | 'views_count' | 'favorites_count'>
    & Partial<Pick<AlbumSimple, 'release_date_precision' | 'disc_formats' | 'is_favorited' | 'is_pending'>>
}>()

const { t, te } = useI18n()
const { formatDate, enumLabel } = useCatalogDisplay()

const typeLabel = computed(() => te(`albums.type.${props.album.type}`) ? t(`albums.type.${props.album.type}`) : props.album.type)
/** Vinyl, cassette and other non-CD media get a badge on the cover. */
const badges = computed(() => (props.album.disc_formats ?? []).filter(format => !['cd', 'digital'].includes(format)))
</script>
