<script setup lang="ts">
import type { ArtistType } from '~/types/artist'
import { ArrowRight, Disc3, Music } from '@lucide/vue'

export interface ArtistAlbumRole {
  role: string
  label: string
  category: string
  /** How many of the album's tracks (or 0 for an album-wide credit) */
  count: number
}

/**
 * The artist hover card. What the page already has (picture, name, type) shows at once; the other names, the start of
 * the bio and the album counts come from GET /artists/{id}/card, with placeholder lines meanwhile. The roles on this album
 * are on the page too, but wait for the card, so they don't show ahead of the placeholders and then move down under
 * the bio. Without a picture it shows the type's icon, never initials.
 *
 * Its sections run edge to edge, so it brings its own padding: open it with `p-0!` and `:text-inset="16"` (UiHoverCard),
 * and its text lines up with the name it is about.
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
const typeIcon = computed(() => (type.value ? TYPE_ICONS[type.value] : 'lucide:user-round'))
const otherNames = computed(() => (card.value?.titles ?? []).map(title => title.title).filter(name => name !== props.artist.name).slice(0, 2))
const showRoles = computed(() => Boolean(props.roles?.length && (card.value || failed.value)))
</script>

<template>
  <div class="text-13">
    <div class="flex items-center gap-3 px-4 pt-4">
      <UiCover :src="card?.image_url ?? artist.image_url" :alt="artist.name" :icon="typeIcon" rounded="lg" eager class="size-12 shrink-0 ring-1 ring-line" />
      <div class="min-w-0 flex-1">
        <NuxtLink :to="`/artists/${artist.id}`" class="block truncate text-15 font-bold leading-5 text-title transition-colors hover:text-primary">{{ artist.name }}</NuxtLink>
        <p class="mt-1 flex min-w-0 items-center gap-1.5 text-xs text-meta">
          <span v-if="type" class="inline-flex shrink-0 items-center gap-1"><Icon :name="typeIcon" class="size-3.5" />{{ enumLabel('artist_type', type) }}</span>
          <span v-for="name in otherNames" :key="name" class="truncate"><span v-if="type" class="mr-1.5 text-faint">·</span>{{ name }}</span>
        </p>
      </div>
    </div>

    <p v-if="card?.bio" class="mt-3 line-clamp-2 px-4 text-13 leading-relaxed text-body">{{ card.bio }}</p>
    <p v-else-if="failed" class="mt-3 px-4 text-xs text-meta">{{ t('artist_card.load_failed') }}</p>
    <div v-else-if="!card" class="mt-3.5 space-y-2 px-4" aria-hidden="true">
      <div class="h-2.5 w-11/12 rounded skeleton" />
      <div class="h-2.5 w-2/3 rounded skeleton" />
    </div>

    <div v-if="showRoles" class="mt-3 flex flex-wrap items-center gap-1.5 px-4">
      <span class="mr-0.5 text-11 font-semibold text-meta">{{ t('artist_card.on_album') }}</span>
      <CatalogRoleTag v-for="role in roles" :key="role.role" :label="role.count > 1 ? `${role.label} ×${role.count}` : role.label" :category="role.category" />
    </div>

    <!-- The counts of the artist page's two album tabs, 发行 and 参与 (a count of 0 left out), and the way to the page
         share the foot; no favourites count since 2026-11-09. Nothing breaks inside a count or the link; when a
         language's words don't fit on one line, the link moves to a second line, still on the right. -->
    <div class="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-line px-4 py-2.5 text-xs text-meta">
      <template v-if="card">
        <span v-if="card.releases_count" :title="t('artists.detail.tab_releases')" class="inline-flex items-center gap-1 whitespace-nowrap tabular-nums"><Disc3 :size="13" class="text-faint" />{{ t('artist_card.releases', { count: card.releases_count }) }}</span>
        <span v-if="card.credited_albums_count" :title="t('artists.detail.tab_credits')" class="inline-flex items-center gap-1 whitespace-nowrap tabular-nums"><Music :size="13" class="text-faint" />{{ t('artist_card.credits', { count: card.credited_albums_count }) }}</span>
      </template>
      <div v-else-if="!failed" class="h-2.5 w-28 rounded skeleton" aria-hidden="true" />
      <NuxtLink :to="`/artists/${artist.id}`" class="group/open ml-auto inline-flex shrink-0 items-center gap-1 whitespace-nowrap font-semibold text-title transition-colors hover:text-primary">
        {{ t('artist_card.open') }}<ArrowRight :size="13" class="transition-transform group-hover/open:translate-x-0.5" />
      </NuxtLink>
    </div>
  </div>
</template>
