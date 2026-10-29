<script setup lang="ts">
import type { ArtistType } from '~/types/artist'
import { ArrowRight } from '@lucide/vue'

export interface ArtistAlbumRole {
  role: string
  label: string
  category: string
  /** How many of the album's tracks (or 0 for an album-wide credit) */
  count: number
}

/**
 * The artist hover card. What the page already has (picture, name, type, the roles on this album) shows at once; the
 * other names, the start of the bio and the counts come from GET /artists/{id}/card, with placeholder lines meanwhile.
 * Without a picture it shows the type's icon, never initials.
 */
const props = defineProps<{
  artist: { id: number, name: string, image_url?: string | null, type?: string | null }
  roles?: ArtistAlbumRole[]
}>()

const { t } = useI18n()
const { enumLabel } = useCatalogDisplay()
const { card, failed } = useArtistCard(() => props.artist.id)

const TYPE_ICONS: Record<ArtistType, string> = {
  person: 'lucide:user-round',
  group: 'lucide:users-round',
  circle: 'lucide:users-round',
  company: 'lucide:building-2',
  virtual: 'lucide:sparkles',
  character: 'lucide:venetian-mask',
}
const type = computed(() => (card.value?.type ?? props.artist.type ?? null) as ArtistType | null)
const otherNames = computed(() => (card.value?.titles ?? []).map(title => title.title).filter(name => name !== props.artist.name).slice(0, 2))
const subtitle = computed(() => [type.value ? enumLabel('artist_type', type.value) : '', ...otherNames.value].filter(Boolean).join(' · '))
</script>

<template>
  <div>
    <div class="flex items-center gap-3">
      <UiCover :src="card?.image_url ?? artist.image_url" :alt="artist.name" :icon="type ? TYPE_ICONS[type] : 'lucide:user-round'" rounded="lg" eager class="size-11 shrink-0 ring-1 ring-line" />
      <div class="min-w-0">
        <NuxtLink :to="`/artists/${artist.id}`" class="block truncate text-[15px] font-bold leading-snug text-title hover:underline">{{ artist.name }}</NuxtLink>
        <p v-if="subtitle" class="truncate text-xs text-meta">{{ subtitle }}</p>
      </div>
    </div>

    <template v-if="card">
      <p v-if="card.bio" class="mt-2.5 line-clamp-2 text-[12.5px] leading-relaxed text-body">{{ card.bio }}</p>
    </template>
    <p v-else-if="failed" class="mt-2.5 text-xs text-meta">{{ t('artist_card.load_failed') }}</p>
    <div v-else class="mt-3 space-y-2" aria-hidden="true">
      <div class="h-2.5 w-11/12 rounded skeleton" />
      <div class="h-2.5 w-2/3 rounded skeleton" />
    </div>

    <div v-if="roles?.length" class="mt-2.5 flex flex-wrap items-center gap-1.5">
      <span class="mr-0.5 text-[11px] font-semibold text-meta">{{ t('artist_card.on_album') }}</span>
      <CatalogRoleTag v-for="role in roles" :key="role.role" :label="role.count > 1 ? `${role.label} ×${role.count}` : role.label" :category="role.category" />
    </div>

    <p v-if="card" class="mt-2.5 text-xs tabular-nums text-meta">
      {{ t('artist_card.albums', { count: card.albums_count }) }}<span class="mx-1.5 text-faint">·</span>{{ t('artist_card.favorites', { count: card.followers_count }) }}
    </p>
    <div v-else-if="!failed" class="mt-3 h-2.5 w-2/5 rounded skeleton" aria-hidden="true" />

    <div class="mt-3 flex border-t border-line pt-2.5">
      <NuxtLink :to="`/artists/${artist.id}`" class="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-title hover:underline">
        {{ t('artist_card.open') }}<ArrowRight :size="13" />
      </NuxtLink>
    </div>
  </div>
</template>
