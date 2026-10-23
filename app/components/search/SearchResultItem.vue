<template>
  <NuxtLink :to="searchResultPath(result)" class="flex min-w-0 items-center gap-3" :class="compact ? 'px-3 py-2' : 'p-3'">
    <img v-if="result.image_url" :src="result.image_url" alt="" loading="lazy" class="shrink-0 object-cover" :class="[compact ? 'h-9 w-9' : 'h-12 w-12', round ? 'rounded-full' : 'rounded']">
    <span v-else class="flex shrink-0 items-center justify-center bg-gray-100 text-gray-300" :class="[compact ? 'h-9 w-9' : 'h-12 w-12', round ? 'rounded-full' : 'rounded']">
      <component :is="icon" :size="compact ? 16 : 20" />
    </span>
    <span class="min-w-0 flex-1">
      <span class="flex min-w-0 items-center gap-1.5">
        <span class="truncate font-medium text-gray-900" :class="compact ? 'text-sm' : ''">{{ result.title }}</span>
        <CatalogPendingBadge v-if="result.is_pending" class="shrink-0" />
      </span>
      <span v-if="subtitle" class="block truncate text-xs text-gray-500">{{ subtitle }}</span>
      <span v-if="matchedText" class="block truncate text-[11px] text-gray-400">{{ $t('search.matched', { text: matchedText }) }}</span>
    </span>
  </NuxtLink>
</template>

<script setup lang="ts">
import type { DatePrecision } from '~/types/entry'
import type { SearchResult } from '~/types/search'
import { Disc3, Mic2, Music, Network, Tag, Tv } from '@lucide/vue'

const props = defineProps<{ result: SearchResult, compact?: boolean }>()
const { t } = useI18n()
const { formatDate, formatDuration, enumLabel } = useCatalogDisplay()

const ICONS = { album: Disc3, track: Music, artist: Mic2, label: Tag, entry: Tv, franchise: Network }
const icon = computed(() => ICONS[props.result.type])
const round = computed(() => props.result.type === 'artist')

const subtitle = computed(() => {
  const meta = props.result.meta
  const join = (...parts: unknown[]) => parts.filter(part => part !== null && part !== undefined && part !== '').join(' · ')
  switch (props.result.type) {
    case 'album':
      return join(meta.artist_credit, meta.catalog_number, formatDate(meta.release_date as string | null, meta.release_date_precision as DatePrecision | null))
    case 'track':
      return join(meta.album_title, meta.disc_number && meta.track_number ? t('search.disc_track', { disc: meta.disc_number, track: meta.track_number }) : null, meta.duration ? formatDuration(meta.duration as number) : null)
    case 'artist':
      return join(enumLabel('artist_type', meta.artist_type as string | null))
    case 'label':
      return join(meta.country)
    case 'entry':
      return join(enumLabel('entry_type', meta.entry_type as string | null), meta.release_date)
    case 'franchise':
      return join((meta.parent as { name: string } | null)?.name)
    default:
      return ''
  }
})

/** The name that matched, when it is not the one shown. */
const matchedText = computed(() => {
  const matched = props.result.matched
  if (!matched || matched.field === 'name' || matched.field === 'slug' || matched.text === props.result.title) return ''
  return matched.text
})
</script>
