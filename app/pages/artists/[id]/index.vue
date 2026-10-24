<template>
  <div class="min-h-screen" :style="pageCssVariables">
    <CatalogPendingBanner :pending="artist?.is_pending" :revision="artist?.pending_revision" />
    <section class="mx-auto w-full max-w-6xl px-4 pt-6 md:px-8 md:pt-8 2xl:max-w-7xl">
      <div class="card overflow-hidden">
        <div class="artist-banner bg-sunken">
          <img :src="artistPageConfig.defaultBannerUrl" alt="" class="h-full w-full object-cover">
        </div>
        <div class="relative h-11 md:h-13">
          <div class="artist-avatar absolute left-4 top-0 -translate-y-1/2 overflow-hidden rounded-full border-4 border-card bg-sunken ring-1 ring-line md:left-6">
            <img v-if="artist?.image_url" v-img-fade :src="artist.image_url" :alt="artist.name" class="h-full w-full object-cover">
            <div v-else class="flex h-full w-full items-center justify-center text-faint"><Users class="h-7 w-7 md:h-9 md:w-9" /></div>
          </div>
        </div>
        <div class="p-4 pt-3 sm:p-5 sm:pt-3 md:p-6 md:pt-3">
          <div v-if="artist" class="flex flex-col gap-4 sm:flex-row sm:items-start" :class="revealClass">
            <div class="min-w-0 flex-1">
              <h1 class="flex flex-wrap items-center gap-2 text-lg font-bold tracking-tight text-title md:text-xl">
                {{ shownName }}
                <span v-if="artist.type" class="rounded bg-btn px-2 py-0.5 text-[11px] font-semibold text-btn-content">{{ enumLabel('artist_type', artist.type) }}</span>
                <span v-if="!artist.is_active" class="rounded bg-sunken px-2 py-0.5 text-[11px] text-meta">{{ $t('artists.detail.inactive') }}</span>
                <CatalogPendingBadge v-if="artist.is_pending" />
              </h1>
              <p v-if="originalName" class="mt-0.5 text-sm text-meta">{{ originalName }}</p>
              <p class="mt-1.5 max-w-3xl whitespace-pre-line text-sm leading-6 text-body">{{ artist.bio || $t('artists.detail.no_bio') }}</p>
              <div class="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-meta">
                <span class="inline-flex items-center gap-2"><Disc3 :size="16" class="text-meta" />{{ $t('artists.detail.albums', { count: artist.albums_count }) }}</span>
                <span class="inline-flex items-center gap-2"><Users :size="16" class="text-meta" />{{ $t('artists.detail.followers', { count: artist.followers_count }) }}</span>
              </div>
              <CatalogLinkChips v-if="artist.links?.length" :links="artist.links" class="mt-3" />
              <div v-if="artist.titles?.length || artist.relations?.length || artist.attributes?.length" class="mt-4 space-y-2 border-t border-line pt-4 text-sm">
                <div v-if="artist.titles?.length" class="flex gap-3">
                  <span class="w-24 shrink-0 text-xs leading-5 text-meta">{{ $t('catalog.other_names') }}</span>
                  <ul class="flex min-w-0 flex-wrap gap-x-4 gap-y-1">
                    <li v-for="(title, index) in artist.titles" :key="index" class="text-body">
                      {{ title.title }}
                      <span class="text-[11px] text-meta">{{ [title.locale ? localeName(title.locale) : '', enumLabel('title_kind', title.kind)].filter(Boolean).join(' · ') }}</span>
                    </li>
                  </ul>
                </div>
                <div v-if="artist.relations?.length" class="flex gap-3">
                  <span class="w-24 shrink-0 text-xs leading-6 text-meta">{{ $t('artists.detail.relations') }}</span>
                  <ul class="flex min-w-0 flex-wrap gap-1.5">
                    <li v-for="relation in artist.relations" :key="`${relation.artist.id}-${relation.relation_type}`">
                      <NuxtLink :to="`/artists/${relation.artist.id}`" class="inline-flex h-6 items-center gap-1.5 rounded-full bg-btn pl-0.5 pr-2.5 text-xs text-btn-content transition-colors duration-150 ease-out hover:bg-btn-hover">
                        <span class="h-5 w-5 shrink-0 overflow-hidden rounded-full bg-sunken">
                          <img v-if="relation.artist.image_url" :src="relation.artist.image_url" :alt="relation.artist.name" class="h-full w-full object-cover">
                        </span>
                        {{ relation.artist.name }}
                        <span class="text-[11px] text-meta">{{ enumLabel('artist_relation', relation.relation_type) }}</span>
                      </NuxtLink>
                    </li>
                  </ul>
                </div>
                <CatalogAttributeList v-if="artist.attributes?.length" :attributes="artist.attributes" />
              </div>
            </div>
            <div class="flex shrink-0 items-center gap-2 sm:ml-auto">
              <button
                class="inline-flex h-9 items-center gap-2 rounded-md px-4 text-xs font-semibold transition-colors duration-150 ease-out disabled:cursor-wait disabled:opacity-60"
                :class="isFavorited ? 'bg-primary text-on-primary hover:bg-primary-strong' : 'bg-btn text-btn-content hover:bg-btn-hover'"
                :disabled="isToggling || (artist.is_pending && !isFavorited)"
                :title="artist.is_pending ? $t('pending.locked') : undefined"
                @click="toggleFollow"
              >
                <UserCheck v-if="isFavorited" :size="15" /><UserPlus v-else :size="15" />
                {{ isFavorited ? $t('artists.detail.following') : $t('artists.detail.follow') }}
              </button>
              <NuxtLink :to="`/artists/${artist.id}/versions`" class="inline-flex h-9 w-9 items-center justify-center rounded-md bg-btn text-btn-content transition-colors duration-150 ease-out hover:bg-btn-hover" :title="$t('versions.title')">
                <History :size="15" />
              </NuxtLink>
              <NuxtLink :to="`/contribute/artist/${artist.id}`" class="inline-flex h-9 w-9 items-center justify-center rounded-md bg-btn text-btn-content transition-colors duration-150 ease-out hover:bg-btn-hover" :title="$t('common.edit')">
                <Edit :size="15" />
              </NuxtLink>
            </div>
          </div>
          <div v-else-if="status === 'error'" class="flex min-h-28 items-center justify-center text-sm text-meta">{{ $t('common.load_failed') }}</div>
          <SkeletonStatus v-else page>
            <div class="skeleton h-7 w-48 rounded" />
            <div class="skeleton mt-3 h-3 w-full max-w-xl rounded" />
            <div class="mt-4 flex gap-5">
              <div class="skeleton h-4 w-24 rounded-full" />
              <div class="skeleton h-4 w-20 rounded-full" />
            </div>
          </SkeletonStatus>
        </div>
      </div>
    </section>

    <main v-if="artist" class="mx-auto w-full max-w-6xl space-y-6 px-4 pb-12 pt-6 md:px-8 md:pt-8 2xl:max-w-7xl" :class="revealClass">
      <section class="card overflow-hidden">
        <header class="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3 sm:px-6">
          <Library :size="17" class="text-primary" />
          <h2 class="mr-2 text-base font-semibold text-title">{{ $t('artists.detail.releases') }}</h2>
          <button
            v-for="tab in roleTabs"
            :key="tab.role ?? 'all'"
            type="button"
            class="chip chip-sm"
            :class="{ 'chip-selected': role === tab.role }"
            @click="selectRole(tab.role)"
          >{{ tab.label }} <span class="opacity-60">{{ tab.count }}</span></button>
          <UiTabs
            :model-value="view"
            variant="segmented"
            size="sm"
            class="ml-auto"
            :items="views.map(option => ({ value: option, label: option === 'albums' ? $t('artists.detail.view_albums') : $t('artists.detail.view_tracks') }))"
            @update:model-value="option => option && selectView(option)"
          />
        </header>
        <div class="min-h-60 p-4 sm:p-6">
          <CollectionLoadingSkeleton v-if="albumsLoading" :grid-class="albumGridClass" :count="12" />
          <ArtistCreditedTracks
            v-else-if="view === 'tracks' && trackGroups.length"
            :key="albumsRevealKey"
            :groups="trackGroups"
            :artist-name="artist.name"
            class="transition-opacity"
            :class="[albumsRevealClass, { 'pointer-events-none opacity-60': albumsRefetching }]"
            :inert="albumsRefetching"
          />
          <div
            v-else-if="view === 'albums' && albums.length"
            :key="albumsRevealKey"
            class="grid transition-opacity"
            :class="[albumGridClass, albumsRevealClass, { 'pointer-events-none opacity-60': albumsRefetching }]"
            :inert="albumsRefetching"
          >
            <AlbumCard v-for="album in albums" :key="album.id" :album="album" />
          </div>
          <div v-else class="flex min-h-48 flex-col items-center justify-center text-center">
            <Disc3 :size="26" class="text-faint" />
            <p class="mt-3 text-sm font-medium text-body">{{ view === 'tracks' ? $t('artists.detail.no_tracks') : $t('artists.detail.no_releases') }}</p>
          </div>
          <CommonPagination class="mt-6" :page="albumPage" :total-pages="albumLastPage" :disabled="albumsRefetching" @update:page="albumPage = $event" />
        </div>
      </section>

      <!-- Artists awaiting review can only be viewed: following, shouts and links open after approval. -->
      <template v-if="!artist.is_pending">
        <ShoutBox :id="artist.id" resource="artists" />
        <ArticleRelatedArticles :id="artist.id" type="artist" />
        <DiscussionRelatedDiscussions :id="artist.id" type="artist" />
      </template>
    </main>
    <div v-else-if="status !== 'error'" class="mx-auto w-full max-w-6xl px-4 pb-12 pt-6 md:px-8 md:pt-8 2xl:max-w-7xl">
      <SkeletonCatalogDetail hero="none" :sections="2" :aside="false" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AlbumSimple } from '~/types/album'
import type { ArtistCreditedAlbum, ArtistDetail } from '~/types/artist'
import { Disc3, Edit, History, Library, UserCheck, UserPlus, Users } from '@lucide/vue'
import { artistPageConfig } from '~/config/artistPage'

const route = useRoute()
const router = useRouter()
const { $api } = useNuxtApp()
const { t } = useI18n()
const { isAuthenticated } = useAuth()
const { setFavorite } = useFavorites()
const { localName, localeName, enumLabel } = useCatalogDisplay()
const { roleName, roleOrder } = useCatalogSchema()

const artistId = Number(route.params.id)
const { data: artist, status, mutate, revealClass } = await usePageAPI<ArtistDetail>(`/v1/artists/${artistId}`)

const shownName = computed(() => artist.value ? localName(artist.value.name, artist.value.titles) : '')
const originalName = computed(() => artist.value && shownName.value !== artist.value.name ? artist.value.name : '')
// One full-width column: up to six albums a row; a page of 30 ends on a full row at 2, 3, 5 and 6 columns.
const albumGridClass = 'grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 md:gap-6 lg:grid-cols-5 xl:grid-cols-6'

const pageCssVariables = {
  '--artist-banner-mobile-height': `${artistPageConfig.banner.mobileHeight}px`,
  '--artist-banner-desktop-height': `${artistPageConfig.banner.desktopHeight}px`,
  '--artist-avatar-mobile-size': `${artistPageConfig.avatar.mobileSize}px`,
  '--artist-avatar-desktop-size': `${artistPageConfig.avatar.desktopSize}px`,
}

// Discography: every album, as album artist, or by credited role; or the credited tracks grouped by album.
// View, role and page live in the URL (?view=tracks, ?role=, ?page=).
type Releases = { pagination: { last_page: number }, roles: Record<string, number> }
  & ({ view: 'albums', albums: AlbumSimple[] } | { view: 'tracks', albums: ArtistCreditedAlbum[], all: number })
const views = ['albums', 'tracks'] as const
const view = computed(() => route.query.view === 'tracks' ? 'tracks' : 'albums')
const role = computed(() => route.query.role ? String(route.query.role) : null)
const albumPage = useQueryPage()
const {
  data: albumData,
  loading: albumsLoading,
  refetching: albumsRefetching,
  revealKey: albumsRevealKey,
  revealClass: albumsRevealClass,
} = usePageData(
  () => `artist:${artistId}:${view.value}:${role.value ?? 'all'}:${albumPage.value}`,
  async ({ signal, background }) => {
    const current = view.value
    const result = await $api<Omit<Releases, 'view'>>(`/v1/artists/${artistId}/${current}`, {
      params: { page: albumPage.value, ...(current === 'albums' ? { per_page: 30 } : {}), ...(role.value ? { role: role.value } : {}) },
      signal,
      progress: !background,
    })
    return { ...result, view: current } as Releases
  },
)
const albums = computed(() => albumData.value?.view === 'albums' ? albumData.value.albums : [])
const trackGroups = computed(() => albumData.value?.view === 'tracks' ? albumData.value.albums : [])
const albumLastPage = computed(() => albumData.value?.pagination.last_page ?? 1)
// The tabs keep the last known counts of the same view while another role's list loads.
const lastCounts = shallowRef<{ view: string, roles: Record<string, number>, all: number }>({ view: '', roles: {}, all: 0 })
watch(albumData, (data) => {
  if (data) lastCounts.value = { view: data.view, roles: data.roles, all: data.view === 'tracks' ? data.all : 0 }
})
const counts = computed(() => lastCounts.value.view === view.value ? lastCounts.value : { roles: {}, all: 0 })
const roleCounts = computed(() => counts.value.roles)
const roleTabs = computed(() => [
  { role: null, label: t('common.all'), count: view.value === 'tracks' ? counts.value.all : (artist.value?.albums_count ?? 0) },
  ...Object.entries(roleCounts.value)
    .filter(([, count]) => count > 0)
    .sort(([a], [b]) => (a === 'artist' ? -1 : b === 'artist' ? 1 : roleOrder(a) - roleOrder(b)))
    .map(([key, count]) => ({ role: key, label: key === 'artist' ? t('artists.detail.as_artist') : roleName(key), count })),
])
const selectRole = (value: string | null) => {
  router.push({ query: { ...route.query, role: value ?? undefined, page: undefined } })
}
// Album artists have no track credits, so that tab does not carry over to the track view.
const selectView = (value: 'albums' | 'tracks') => {
  if (value === view.value) return
  const keepRole = value === 'albums' || role.value !== 'artist'
  router.push({ query: { ...route.query, view: value === 'tracks' ? 'tracks' : undefined, role: keepRole ? role.value ?? undefined : undefined, page: undefined } })
}

const isFavorited = computed(() => artist.value?.is_favorited ?? false)
const isToggling = ref(false)
const toggleFollow = async () => {
  if (!isAuthenticated.value) {
    await navigateTo(`/auth/login?redirect=${encodeURIComponent(route.fullPath)}`)
    return
  }
  if (isToggling.value) return
  isToggling.value = true
  try {
    const { favorited } = await setFavorite('artists', artistId, !isFavorited.value)
    mutate(current => ({ ...current, is_favorited: favorited }))
  } finally {
    isToggling.value = false
  }
}

const seoTitle = computed(() => shownName.value || 'Artist')
const seoDescription = computed(() => artist.value?.bio?.slice(0, 160) || `${seoTitle.value} on CDCAT.`)
useSeoMeta({
  title: seoTitle,
  description: seoDescription,
  ogTitle: computed(() => `${seoTitle.value} | CDCAT`),
  ogDescription: seoDescription,
  ogType: 'profile',
  ogImage: computed(() => artist.value?.image_url || artistPageConfig.defaultBannerUrl),
})
</script>

<style scoped>
.artist-banner {
  height: var(--artist-banner-mobile-height);
}

.artist-avatar {
  width: var(--artist-avatar-mobile-size);
  height: var(--artist-avatar-mobile-size);
}

@media (min-width: 768px) {
  .artist-banner {
    height: var(--artist-banner-desktop-height);
  }

  .artist-avatar {
    width: var(--artist-avatar-desktop-size);
    height: var(--artist-avatar-desktop-size);
  }
}
</style>
