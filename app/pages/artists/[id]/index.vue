<template>
  <div class="min-h-screen bg-slate-50" :style="pageCssVariables">
    <CatalogPendingBanner :pending="artist?.is_pending" :revision="artist?.pending_revision" />
    <section class="mx-auto w-full max-w-6xl px-4 pt-6 md:px-8 md:pt-8 2xl:max-w-7xl">
      <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_24px_-20px_rgba(15,23,42,0.24)]">
        <div class="artist-banner bg-slate-200">
          <img :src="artistPageConfig.defaultBannerUrl" alt="" class="h-full w-full object-cover">
        </div>
        <div class="relative h-11 bg-white md:h-13">
          <div class="artist-avatar absolute left-4 top-0 -translate-y-1/2 overflow-hidden rounded-full border-4 border-white bg-slate-100 shadow-sm ring-1 ring-slate-200 md:left-6">
            <img v-if="artist?.image_url" v-img-fade :src="artist.image_url" :alt="artist.name" class="h-full w-full object-cover">
            <div v-else class="flex h-full w-full items-center justify-center text-slate-300"><Users class="h-7 w-7 md:h-9 md:w-9" /></div>
          </div>
        </div>
        <div class="p-4 pt-3 sm:p-5 sm:pt-3 md:p-6 md:pt-3">
          <div v-if="artist" class="flex flex-col gap-4 sm:flex-row sm:items-start" :class="revealClass">
            <div class="min-w-0 flex-1">
              <h1 class="flex flex-wrap items-center gap-2 text-lg font-bold tracking-tight text-slate-950 md:text-xl">
                {{ shownName }}
                <span v-if="artist.type" class="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">{{ enumLabel('artist_type', artist.type) }}</span>
                <span v-if="!artist.is_active" class="rounded bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">{{ $t('artists.detail.inactive') }}</span>
                <CatalogPendingBadge v-if="artist.is_pending" />
              </h1>
              <p v-if="originalName" class="mt-0.5 text-sm text-slate-500">{{ originalName }}</p>
              <p class="mt-1.5 max-w-3xl whitespace-pre-line text-sm leading-6 text-slate-600">{{ artist.bio || $t('artists.detail.no_bio') }}</p>
              <div class="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500">
                <span class="inline-flex items-center gap-2"><Disc3 :size="16" class="text-slate-400" />{{ $t('artists.detail.albums', { count: artist.albums_count }) }}</span>
                <span class="inline-flex items-center gap-2"><Users :size="16" class="text-slate-400" />{{ $t('artists.detail.followers', { count: artist.followers_count }) }}</span>
              </div>
            </div>
            <div class="flex shrink-0 items-center gap-2 sm:ml-auto">
              <button
                class="inline-flex h-9 items-center gap-2 rounded-md border px-4 text-xs font-semibold transition-colors disabled:cursor-wait disabled:opacity-60"
                :class="isFavorited ? 'border-slate-900 bg-slate-900 text-white hover:bg-slate-700' : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100'"
                :disabled="isToggling || (artist.is_pending && !isFavorited)"
                :title="artist.is_pending ? $t('pending.locked') : undefined"
                @click="toggleFollow"
              >
                <UserCheck v-if="isFavorited" :size="15" /><UserPlus v-else :size="15" />
                {{ isFavorited ? $t('artists.detail.following') : $t('artists.detail.follow') }}
              </button>
              <NuxtLink :to="`/artists/${artist.id}/versions`" class="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-800" :title="$t('versions.title')">
                <History :size="15" />
              </NuxtLink>
              <NuxtLink :to="`/contribute/artist/${artist.id}`" class="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-800" :title="$t('common.edit')">
                <Edit :size="15" />
              </NuxtLink>
            </div>
          </div>
          <div v-else-if="status === 'error'" class="flex min-h-28 items-center justify-center text-sm text-slate-500">{{ $t('common.load_failed') }}</div>
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

    <main v-if="artist" class="mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 px-4 pb-12 pt-6 md:px-8 md:pt-8 lg:grid-cols-3 2xl:max-w-7xl" :class="revealClass">
      <div class="space-y-6 lg:col-span-2">
        <section class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_24px_-20px_rgba(15,23,42,0.24)]">
          <header class="flex flex-wrap items-center gap-2 border-b border-slate-100 px-4 py-3 sm:px-6">
            <Library :size="17" class="text-slate-500" />
            <h2 class="mr-2 text-base font-semibold text-slate-900">{{ $t('artists.detail.releases') }}</h2>
            <button
              v-for="tab in roleTabs"
              :key="tab.role ?? 'all'"
              type="button"
              class="rounded-full px-2.5 py-1 text-xs transition-colors"
              :class="role === tab.role ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
              @click="selectRole(tab.role)"
            >{{ tab.label }} <span class="opacity-60">{{ tab.count }}</span></button>
          </header>
          <div class="min-h-60 p-4 sm:p-6">
            <CollectionLoadingSkeleton v-if="albumsLoading" grid-class="grid-cols-2 gap-5 sm:grid-cols-3 md:gap-6 lg:grid-cols-4" :count="8" />
            <div
              v-else-if="albums.length"
              :key="albumsRevealKey"
              class="grid grid-cols-2 gap-5 transition-opacity sm:grid-cols-3 md:gap-6 lg:grid-cols-4"
              :class="[albumsRevealClass, { 'pointer-events-none opacity-60': albumsRefetching }]"
              :inert="albumsRefetching"
            >
              <AlbumCard v-for="album in albums" :key="album.id" :album="album" />
            </div>
            <div v-else class="flex min-h-48 flex-col items-center justify-center text-center">
              <Disc3 :size="26" class="text-slate-300" />
              <p class="mt-3 text-sm font-medium text-slate-600">{{ $t('artists.detail.no_releases') }}</p>
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
      </div>

      <aside class="space-y-6">
        <CatalogSection v-if="artist.relations?.length" :title="$t('artists.detail.relations')" :icon="Network" tone="purple">
          <ul class="divide-y divide-gray-50">
            <li v-for="relation in artist.relations" :key="`${relation.artist.id}-${relation.relation_type}`">
              <NuxtLink :to="`/artists/${relation.artist.id}`" class="flex items-center gap-3 px-5 py-2.5 hover:bg-gray-50">
                <div class="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-gray-100">
                  <img v-if="relation.artist.image_url" :src="relation.artist.image_url" :alt="relation.artist.name" class="h-full w-full object-cover">
                </div>
                <div class="min-w-0">
                  <p class="truncate text-sm font-medium text-gray-800">{{ relation.artist.name }}</p>
                  <p class="text-[11px] text-gray-400">
                    {{ enumLabel('artist_relation', relation.relation_type) }}
                  </p>
                </div>
              </NuxtLink>
            </li>
          </ul>
        </CatalogSection>

        <CatalogSection v-if="artist.titles?.length || artist.attributes?.length" :title="$t('album.section.information')" :icon="Info" tone="sky">
          <div class="space-y-4 px-5 py-4 text-sm">
            <div v-if="artist.titles?.length">
              <h3 class="mb-1.5 text-xs font-semibold text-gray-400">{{ $t('catalog.other_names') }}</h3>
              <CatalogTitleList :titles="artist.titles" />
            </div>
            <CatalogAttributeList v-if="artist.attributes?.length" :attributes="artist.attributes" />
          </div>
        </CatalogSection>

        <AlbumLinks :links="artist.links ?? []" />
      </aside>
    </main>
    <div v-else-if="status !== 'error'" class="mx-auto w-full max-w-6xl px-4 pb-12 pt-6 md:px-8 md:pt-8 2xl:max-w-7xl">
      <SkeletonCatalogDetail hero="none" :sections="2" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AlbumSimple } from '~/types/album'
import type { ArtistDetail } from '~/types/artist'
import { Disc3, Edit, History, Info, Library, Network, UserCheck, UserPlus, Users } from '@lucide/vue'
import { artistPageConfig } from '~/config/artistPage'

const route = useRoute()
const router = useRouter()
const { $api } = useNuxtApp()
const { t } = useI18n()
const { isAuthenticated } = useAuth()
const { setFavorite } = useFavorites()
const { localName, enumLabel } = useCatalogDisplay()
const { roleName, roleOrder } = useCatalogSchema()

const artistId = Number(route.params.id)
const { data: artist, status, mutate, revealClass } = await usePageAPI<ArtistDetail>(`/v1/artists/${artistId}`)

const shownName = computed(() => artist.value ? localName(artist.value.name, artist.value.titles) : '')
const originalName = computed(() => artist.value && shownName.value !== artist.value.name ? artist.value.name : '')

const pageCssVariables = {
  '--artist-banner-mobile-height': `${artistPageConfig.banner.mobileHeight}px`,
  '--artist-banner-desktop-height': `${artistPageConfig.banner.desktopHeight}px`,
  '--artist-avatar-mobile-size': `${artistPageConfig.avatar.mobileSize}px`,
  '--artist-avatar-desktop-size': `${artistPageConfig.avatar.desktopSize}px`,
}

// Discography: every album, as album artist, or by credited role. Role and page live in the URL (?role=, ?page=).
const role = computed(() => route.query.role ? String(route.query.role) : null)
const albumPage = useQueryPage()
const {
  data: albumData,
  loading: albumsLoading,
  refetching: albumsRefetching,
  revealKey: albumsRevealKey,
  revealClass: albumsRevealClass,
} = usePageData(
  () => `artist:${artistId}:albums:${role.value ?? 'all'}:${albumPage.value}`,
  ({ signal, background }) => $api<{ albums: AlbumSimple[], pagination: { last_page: number }, roles: Record<string, number> }>(`/v1/artists/${artistId}/albums`, {
    params: { page: albumPage.value, ...(role.value ? { role: role.value } : {}) },
    signal,
    progress: !background,
  }),
)
const albums = computed(() => albumData.value?.albums ?? [])
const albumLastPage = computed(() => albumData.value?.pagination.last_page ?? 1)
// The tabs keep the last known counts while another role's list loads.
const lastRoles = shallowRef<Record<string, number>>({})
watch(() => albumData.value?.roles, (roles) => { if (roles) lastRoles.value = roles })
const roleCounts = computed(() => albumData.value?.roles ?? lastRoles.value)
const roleTabs = computed(() => [
  { role: null, label: t('common.all'), count: artist.value?.albums_count ?? 0 },
  ...Object.entries(roleCounts.value)
    .filter(([, count]) => count > 0)
    .sort(([a], [b]) => (a === 'artist' ? -1 : b === 'artist' ? 1 : roleOrder(a) - roleOrder(b)))
    .map(([key, count]) => ({ role: key, label: key === 'artist' ? t('artists.detail.as_artist') : roleName(key), count })),
])
const selectRole = (value: string | null) => {
  router.push({ query: { ...route.query, role: value ?? undefined, page: undefined } })
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
