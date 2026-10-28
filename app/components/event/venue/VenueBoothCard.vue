<template>
  <!-- Shown while the map says so (on hover); Escape or a press elsewhere hands the close back to the map. -->
  <UiPopover
    :reference="anchor"
    open
    placement="top"
    :offset="10"
    :label="circle?.name ?? spaceLabel"
    class="w-72"
    @update:open="$emit('leave')"
    @pointerenter="$emit('enter')"
    @pointerleave="$emit('leave')"
  >
    <template v-if="circle">
      <div class="flex gap-3">
        <UiCover :src="circle.image_url" :alt="circle.name" :icon="Users" rounded="xl" eager class="size-20 ring-1 ring-line" />
        <div class="min-w-0 flex-1">
          <p class="text-[11px] font-semibold tracking-wide text-meta">{{ spaceLabel }}</p>
          <p class="mt-0.5 line-clamp-2 text-[15px] font-bold leading-snug text-title">{{ circle.name }}</p>
          <p v-if="circle.name_kana && circle.name_kana !== circle.name" class="truncate text-xs text-meta">{{ circle.name_kana }}</p>
          <div class="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span v-if="circle.genre" class="inline-flex items-center gap-1 rounded-full bg-btn px-2 py-0.5 text-[11px] font-medium text-btn-content">
              <span class="size-2 rounded-full" :style="{ background: familyColor }" />{{ genreShortLabel(circle.genre, genres) }}
            </span>
            <!-- The checklist's gold star -->
            <span v-if="checked" class="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-400/15 dark:text-amber-300">
              <Star :size="11" fill="currentColor" />{{ t('event_page.checklist.short') }}
            </span>
          </div>
        </div>
      </div>
      <div class="mt-3 flex items-center gap-2 border-t border-line pt-2.5">
        <UiButton
          v-if="circle.twitter_handle"
          :href="`https://x.com/${circle.twitter_handle}`"
          target="_blank"
          rel="noopener"
          size="xs"
          icon="simple-icons:x"
          class="min-w-0"
        >
          <span class="truncate">@{{ circle.twitter_handle }}</span>
        </UiButton>
        <UiButton
          v-for="artist in shownArtists"
          :key="artist.id"
          :to="`/artists/${artist.id}`"
          size="xs"
          :icon="UserRound"
          class="min-w-0"
        >
          <span class="truncate">{{ shownArtists.length === 1 ? t('event_page.circle.artist_page') : artist.name }}</span>
        </UiButton>
        <UiButton variant="primary" size="xs" class="ml-auto shrink-0" @click="$emit('open')">
          {{ t('event_page.circle.details') }}
        </UiButton>
      </div>
    </template>
    <p v-else class="text-sm text-meta">
      <span class="font-semibold text-body">{{ spaceLabel }}</span> · {{ t('event_page.map.empty_space') }}
    </p>
  </UiPopover>
</template>

<script setup lang="ts">
import type { VenueMapData } from '~/types/event'
import type { VenuePiece } from '~/utils/eventVenue'
import { Star, UserRound, Users } from '@lucide/vue'

const props = defineProps<{
  piece: VenuePiece
  anchor: Element
  spaceLabel: string
  genres: VenueMapData['genres']
  checked: boolean
}>()
defineEmits<{ open: [], enter: [], leave: [] }>()
const { t } = useI18n()

const circle = computed(() => props.piece.circle)
// The template's `v-if="circle"` doesn't narrow inside UiButton's slot, so these are worked out here.
const shownArtists = computed(() => circle.value?.artists.slice(0, 2) ?? [])
const familyColor = computed(() => {
  const family = genreFamily(circle.value?.genre, props.genres)
  return GENRE_FAMILIES.find(f => f.key === family)?.color ?? 'var(--meta)'
})
</script>
