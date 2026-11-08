<template>
  <div class="min-h-screen">
    <CatalogPendingBanner :pending="artist?.is_pending" :revision="artist?.pending_revision" />
    <section class="mx-auto w-full max-w-6xl px-4 pt-6 md:px-8 md:pt-8 2xl:max-w-7xl">
      <div class="card overflow-hidden">
        <!-- The artist's banner, fitted to the strip; the site's default one when there is none. -->
        <div class="page-hero-banner relative bg-sunken">
          <CommonBannerImage v-if="banner" :image="banner" sizes="(min-width: 1536px) 1216px, (min-width: 1152px) 1088px, 100vw" />
          <img v-else :src="pageHeroConfig.defaultBannerUrl" alt="" class="h-full w-full object-cover">
        </div>
        <div class="relative h-12.5 md:h-17">
          <div class="page-hero-avatar absolute left-4 top-0 -translate-y-1/2 overflow-hidden rounded-full border-4 border-[oklch(0.92_0.008_var(--hue))] bg-sunken md:left-6 dark:border-card dark:ring-1 dark:ring-line">
            <img v-if="artist?.image_url" v-img-fade :src="artist.image_url" :alt="artist.name" class="h-full w-full object-cover">
            <div v-else class="flex h-full w-full items-center justify-center text-faint"><Users class="h-8 w-8 md:h-11 md:w-11" /></div>
          </div>
        </div>
        <div class="p-4 pt-3 sm:p-5 sm:pt-3 md:p-6 md:pt-3">
          <!-- The name and the buttons share the first row (the buttons right after the name on phones); everything else
               runs the full width under them, rather than beside a column of buttons. -->
          <div v-if="artist" class="grid gap-y-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-x-4 sm:gap-y-1.5" :class="revealClass">
            <div class="min-w-0 self-center">
              <h1 class="flex flex-wrap items-center gap-2 text-lg font-bold tracking-tight text-title md:text-xl">
                {{ shownName }}
                <span v-if="artist.type" class="rounded bg-btn px-2 py-0.5 text-[11px] font-semibold text-btn-content">{{ enumLabel('artist_type', artist.type) }}</span>
                <span v-if="!artist.is_active" class="rounded bg-sunken px-2 py-0.5 text-[11px] text-meta">{{ $t('artists.detail.inactive') }}</span>
                <CatalogPendingBadge v-if="artist.is_pending" />
              </h1>
              <p v-if="originalName" class="mt-0.5 text-sm text-meta">{{ originalName }}</p>
            </div>
            <div class="flex shrink-0 items-center gap-2 self-start sm:col-start-2 sm:row-start-1">
              <!-- 关注 is the black (primary) button; once following, the grey one. Hovering lifts it a pixel onto a soft
                   shadow and the icon grows a little, all eased; reduced motion keeps only the colour change. -->
              <UiButton
                :variant="isFavorited ? 'default' : 'primary'"
                size="sm"
                :icon="isFavorited ? UserCheck : UserPlus"
                icon-class="size-4 transition-transform duration-200 ease-out group-hover/follow:scale-115 group-hover/follow:-rotate-6 motion-reduce:transition-none motion-reduce:group-hover/follow:transform-none"
                class="group/follow transition-[color,background-color,translate,box-shadow] duration-200 ease-out enabled:hover:-translate-y-px enabled:hover:shadow-[0_4px_12px_-4px_rgb(0_0_0/0.35)] enabled:active:translate-y-0 enabled:active:shadow-none motion-reduce:enabled:hover:translate-y-0"
                :disabled="isToggling || (artist.is_pending && !isFavorited)"
                :title="artist.is_pending ? $t('pending.locked') : undefined"
                @click="toggleFollow"
              >
                {{ isFavorited ? $t('artists.detail.following') : $t('artists.detail.follow') }}
              </UiButton>
              <UiButton :to="`/artists/${artist.id}/versions`" size="sm" :icon="History" :label="$t('versions.title')" />
              <UiButton :to="`/contribute/artist/${artist.id}`" size="sm" :icon="Edit" :label="$t('common.edit')" />
            </div>
            <div class="min-w-0 sm:col-span-2">
              <ArtistBio :text="artist.bio || $t('artists.detail.no_bio')" />
              <!-- The counts as pills in the theme colour (the link chips under them stay grey), the chips' size. -->
              <div class="mt-3 flex flex-wrap items-center gap-1.5 text-[13px] text-btn-content">
                <span :class="countPill"><Disc3 :size="15" class="opacity-70" />{{ $t('artists.detail.albums', { count: artist.albums_count }) }}</span>
                <span :class="countPill"><Users :size="15" class="opacity-70" />{{ $t('artists.detail.followers', { count: artist.followers_count }) }}</span>
              </div>
              <CatalogLinkChips v-if="artist.links?.length" :links="artist.links" class="mt-3" />
              <!-- 其他名称, 品番前缀, relations and attributes as rows under a rule, a row per group with its name on the left (above
                   it on phones); everything is spelled out, nothing hides behind a tooltip. No panel fill: the tiles carry the grey,
                   so a short list leaves plain card, not an empty grey box. -->
              <div v-if="otherTitles.length || artist.catalog_prefixes?.length || relationGroups.length || artist.attributes?.length" class="mt-4 divide-y divide-line border-t border-line text-sm sm:grid sm:grid-cols-[minmax(6.5rem,max-content)_minmax(0,1fr)] sm:gap-x-8">
                <div v-if="otherTitles.length" :class="panelRow">
                  <p :class="[panelLabel, 'sm:pt-[23px]']">{{ $t('catalog.other_names') }} <span :class="panelCount">{{ otherTitles.length }}</span></p>
                  <ul class="flex flex-wrap gap-2">
                    <li v-for="(title, index) in otherTitles" :key="index" :class="['min-w-0 max-w-full rounded-lg px-4 py-2.5', tileFill]">
                      <span class="block break-words text-[15px] font-medium leading-snug text-title">{{ title.title }}</span>
                      <span class="mt-2 flex flex-wrap gap-1.5 text-xs text-meta">
                        <span :class="nameTag">{{ enumLabel('title_kind', title.kind) }}</span>
                        <span v-if="title.locale" :class="nameTag">{{ localeName(title.locale) }}</span>
                      </span>
                    </li>
                  </ul>
                </div>
                <div v-if="artist.catalog_prefixes?.length" :class="panelRow">
                  <p :class="[panelLabel, 'sm:pt-0.5']">{{ $t('artists.detail.catalog_prefixes') }}</p>
                  <p class="min-w-0 font-mono leading-6 text-body">{{ artist.catalog_prefixes.join(', ') }}</p>
                </div>
                <!-- One row per kind of relation, the ended ones (former members, earlier voices) last, drawn the same: the row's
                     name says they ended. Other names of the same person are plain tags; the rest are small cards with the picture
                     and the note. -->
                <div v-for="group in relationGroups" :key="group.key" :class="panelRow">
                  <p :class="[panelLabel, group.alias ? 'sm:pt-1.5' : 'sm:pt-[18px]']">{{ group.label }} <span :class="panelCount">{{ group.relations.length }}</span></p>
                  <ul v-if="group.alias" class="flex flex-wrap gap-1.5">
                    <li v-for="relation in group.relations" :key="relation.artist.id" class="min-w-0">
                      <NuxtLink :to="`/artists/${relation.artist.id}`" class="group/rel block rounded-md px-3 py-1.5 text-[13px] leading-5 text-title" :class="tileFill">
                        <span class="block break-words" :class="slideRight">{{ relation.artist.name }}</span>
                      </NuxtLink>
                    </li>
                  </ul>
                  <!-- Cards as wide as their content, so no card carries an empty stretch of grey. A group with a long note gets
                       columns of 22rem+ instead (two on a desktop): its text fills them and wraps at a readable width. -->
                  <ul v-else :class="group.longNotes ? 'grid gap-2 sm:grid-cols-[repeat(auto-fill,minmax(min(100%,22rem),1fr))]' : 'flex flex-wrap gap-2'">
                    <li v-for="relation in group.relations" :key="relation.artist.id" class="min-w-0 max-w-full">
                      <!-- Hover keeps the colour: the picture and the name slide right a little instead. -->
                      <NuxtLink
                        :to="`/artists/${relation.artist.id}`"
                        class="group/rel flex h-full rounded-lg py-2.5 pl-3 pr-4"
                        :class="tileFill"
                      >
                        <span class="flex min-w-0 flex-1 gap-3" :class="[relation.note ? 'items-start' : 'items-center', slideRight]">
                          <span class="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-card text-faint ring-1 ring-black/8 dark:ring-white/10">
                            <img v-if="relation.artist.image_url" :src="relation.artist.image_url" :alt="relation.artist.name" class="h-full w-full object-cover">
                            <component :is="relation.artist.type === 'person' ? User : Users" v-else :size="17" aria-hidden="true" />
                          </span>
                          <span class="min-w-0" :class="relation.note && 'pt-px'">
                            <span class="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 leading-snug">
                              <span class="min-w-0 break-words font-medium text-title">{{ relation.artist.name }}</span>
                              <span v-if="relation.artist.type" class="text-xs text-meta" :class="nameTag">{{ enumLabel('artist_type', relation.artist.type) }}</span>
                            </span>
                            <span v-if="relation.note" class="mt-0.5 block whitespace-pre-line break-words text-[13px] leading-5 text-meta">{{ relation.note }}</span>
                          </span>
                        </span>
                      </NuxtLink>
                    </li>
                  </ul>
                </div>
                <CatalogAttributeList v-if="artist.attributes?.length" :attributes="artist.attributes" panel />
              </div>
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
          <Library :size="17" class="mr-1 text-primary" />
          <UiTabs
            :model-value="view"
            variant="segmented"
            size="sm"
            :label="$t('artists.detail.albums_label')"
            :items="viewTabs"
            @update:model-value="option => option && selectView(option)"
          />
          <!-- 发行的专辑 shows them all; only 参与的专辑 filters by credit role. -->
          <div v-if="view === 'credits'" class="flex flex-wrap items-center gap-2 sm:ml-auto">
            <button
              v-for="tab in roleTabs"
              :key="tab.role ?? 'all'"
              type="button"
              class="chip chip-sm"
              :class="{ 'chip-selected': role === tab.role }"
              @click="selectRole(tab.role)"
            >{{ tab.label }} <span class="opacity-60">{{ tab.count }}</span></button>
          </div>
        </header>
        <div class="min-h-60 p-4 sm:p-6">
          <CollectionLoadingSkeleton v-if="albumsLoading" :grid-class="albumGridClass" :count="12" />
          <ArtistCreditedTracks
            v-else-if="view === 'credits' && trackGroups.length"
            :key="albumsRevealKey"
            :groups="trackGroups"
            :artist-name="artist.name"
            class="transition-opacity"
            :class="[albumsRevealClass, { 'pointer-events-none opacity-60': albumsRefetching }]"
            :inert="albumsRefetching"
          />
          <div
            v-else-if="view === 'releases' && albums.length"
            :key="albumsRevealKey"
            class="grid transition-opacity"
            :class="[albumGridClass, albumsRevealClass, { 'pointer-events-none opacity-60': albumsRefetching }]"
            :inert="albumsRefetching"
          >
            <AlbumCard v-for="album in albums" :key="album.id" :album="album" />
          </div>
          <div v-else class="flex min-h-48 flex-col items-center justify-center text-center">
            <Disc3 :size="26" class="text-faint" />
            <p class="mt-3 text-sm font-medium text-body">{{ view === 'credits' ? $t('artists.detail.no_credits') : $t('artists.detail.no_releases') }}</p>
          </div>
          <CommonPagination class="mt-6" :page="albumPage" :total-pages="albumLastPage" :disabled="albumsRefetching" @update:page="albumPage = $event" />
        </div>
      </section>

      <ArtistGallery v-if="galleryItems.length" :items="galleryItems" />

      <!-- Artists awaiting review can only be viewed: following, shouts and links open after approval. -->
      <template v-if="!artist.is_pending">
        <ShoutBox :id="artist.id" resource="artists" />
        <ArticleRelatedArticles :id="artist.id" type="artist" />
      </template>
    </main>
    <div v-else-if="status !== 'error'" class="mx-auto w-full max-w-6xl px-4 pb-12 pt-6 md:px-8 md:pt-8 2xl:max-w-7xl">
      <SkeletonCatalogDetail hero="none" :sections="2" :aside="false" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ArtistCreditedAlbum, ArtistDetail, ArtistImage } from '~/types/artist'
import type { AlbumSimple } from '~/types/album'
import type { CatalogImage } from '~/types/catalog'
import { Disc3, Edit, History, Library, User, UserCheck, UserPlus, Users } from '@lucide/vue'
import { ARTIST_RELATIONS } from '~/types/artist'
import { pageHeroConfig } from '~/config/pageHero'
import { artistLdType, namedLd } from '~/utils/structuredData'
import { composeDescription, descriptionLength, plainText } from '~/utils/seoText'

const route = useRoute()
const router = useRouter()
const { $api } = useNuxtApp()
const { t, locale } = useI18n()
const { isAuthenticated } = useAuth()
const { setFavorite } = useFavorites()
const { localName, localeName, enumLabel } = useCatalogDisplay()
const { roleName, roleOrder } = useCatalogSchema()

const artistId = Number(route.params.id)
const { data: artist, status, error, mutate, revealClass } = await usePageAPI<ArtistDetail>(`/v1/artists/${artistId}`, { notFound: true })

/** A panel row per kind of relation (成员, 声优, 另一名义 …), then the ended ones (前成员 …); each keeps the API's order. */
const relationGroups = computed(() => {
  const relations = artist.value?.relations ?? []
  return [false, true].flatMap(ended => ARTIST_RELATIONS.map((type) => {
    const members = relations.filter(relation => relation.relation_type === type && relation.ended === ended)
    return {
      key: `${type}-${ended}`,
      label: enumLabel(ended ? 'artist_relation_ended' : 'artist_relation', type),
      ended,
      alias: type === 'alias',
      /** A note longer than a short title ("Owner", "ギター"): give the cards wider columns. */
      longNotes: members.some(relation => (relation.note?.length ?? 0) > 40),
      relations: members,
    }
  })).filter(group => group.relations.length)
})
// The rows share the block's columns (subgrid), so the label column is as wide as the longest label, on one line.
const panelRow = 'grid gap-2 py-3 sm:col-span-2 sm:grid-cols-subgrid sm:gap-y-0'
// Beside its items, a row's name sits on the middle of their first line: a 67px name tile (23px down), a person card's
// 36px picture under 10px padding (18px), a 32px tag (6px), a 24px line of text (2px). Phones put it above them.
const panelLabel = 'flex items-center gap-1.5 self-start whitespace-nowrap text-sm font-semibold leading-5 text-title'
/** The row's count as a small grey tag, the filters' grey like the tiles. */
const panelCount = 'inline-grid h-5 min-w-5 place-items-center rounded-md bg-black/5 px-1.5 text-xs font-medium tabular-nums text-meta dark:bg-btn'
const nameTag = 'rounded-[3px] border border-black/14 px-1.5 leading-4 dark:border-white/16'
const countPill = 'inline-flex h-7 items-center gap-1.5 rounded-md bg-btn px-2.5'
/** Tiles: the album list filters' grey (the default button's too), the tags on them outlined rather than filled. */
const tileFill = 'bg-black/5 dark:bg-btn'
/** A linked tile's hover (and keyboard focus): no colour change, its content slides 4px to the right. */
const slideRight = 'transition-transform duration-200 ease-out group-hover/rel:translate-x-1 group-focus-visible/rel:translate-x-1 motion-reduce:transition-none'

const shownName = computed(() => artist.value ? localName(artist.value.name, artist.value.titles) : '')
// The main banner up top, the main avatar in its circle; the 图片 card has the rest, other avatars and banners too.
const images = computed(() => (artist.value?.images ?? []).filter((item): item is ArtistImage & { image: CatalogImage } => item.image !== null))
const banner = computed(() => images.value.find(item => item.kind === 'banner' && item.is_primary)?.image ?? null)
const galleryItems = computed(() => images.value.filter(item => !item.is_primary))
const originalName = computed(() => artist.value && shownName.value !== artist.value.name ? artist.value.name : '')
/** The names the header does not show already. */
const otherTitles = computed(() => (artist.value?.titles ?? []).filter(title => title.title !== shownName.value && title.title !== artist.value?.name))
// One full-width column: up to six albums a row; a page of 30 ends on a full row at 2, 3, 5 and 6 columns.
const albumGridClass = 'grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 md:gap-6 lg:grid-cols-5 xl:grid-cols-6'

// 发行的专辑: every album the artist is behind (an album-wide 署名与发行 credit), unfiltered; 参与的专辑: the albums
// of their other credits, grouped with the credited tracks, filtered by credit role.
// View, role and page live in the URL (?view=credits, ?role=, ?page=); the old ?view=tracks is credits.
type Releases = { pagination: { last_page: number } }
  & ({ view: 'releases', albums: AlbumSimple[] } | { view: 'credits', albums: ArtistCreditedAlbum[], all: number, roles: Record<string, number> })
const views = ['releases', 'credits'] as const
const view = computed(() => route.query.view === 'credits' || route.query.view === 'tracks' ? 'credits' : 'releases')
const viewTabs = computed(() => views.map(option => option === 'releases'
  ? { value: option, label: t('artists.detail.tab_releases'), count: artist.value?.releases_count ?? 0 }
  : { value: option, label: t('artists.detail.tab_credits'), count: artist.value?.credited_albums_count ?? 0 }))
const role = computed(() => view.value === 'credits' && route.query.role ? String(route.query.role) : null)
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
    const result = await $api<Omit<Releases, 'view'>>(`/v1/artists/${artistId}/${current === 'releases' ? 'albums' : 'tracks'}`, {
      params: { page: albumPage.value, ...(current === 'releases' ? { per_page: 30 } : {}), ...(role.value ? { role: role.value } : {}) },
      signal,
      progress: !background,
    })
    return { ...result, view: current } as Releases
  },
)
const albums = computed(() => albumData.value?.view === 'releases' ? albumData.value.albums : [])
const trackGroups = computed(() => albumData.value?.view === 'credits' ? albumData.value.albums : [])
const albumLastPage = computed(() => albumData.value?.pagination.last_page ?? 1)
// The credit-role chips keep the last known counts while another role's list loads.
const counts = shallowRef<{ roles: Record<string, number>, all: number }>({ roles: {}, all: 0 })
watch(albumData, (data) => {
  if (data?.view === 'credits') counts.value = { roles: data.roles, all: data.all }
})
const roleTabs = computed(() => [
  { role: null, label: t('common.all'), count: counts.value.all },
  ...Object.entries(counts.value.roles)
    .filter(([, count]) => count > 0)
    .sort(([a], [b]) => roleOrder(a) - roleOrder(b))
    .map(([key, count]) => ({ role: key, label: roleName(key), count })),
])
const selectRole = (value: string | null) => {
  router.push({ query: { ...route.query, role: value ?? undefined, page: undefined } })
}
// The two tabs filter by different roles, so the role filter does not carry over.
const selectView = (value: 'releases' | 'credits') => {
  if (value === view.value) return
  router.push({ query: { ...route.query, view: value === 'credits' ? 'credits' : undefined, role: undefined, page: undefined } })
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

const { withOriginal, sentence, count } = useSeoText()
const absolute = useSiteUrl()
usePageSeo({
  title: () => artist.value ? withOriginal(shownName.value, artist.value.name) : undefined,
  description: () => artist.value
    ? composeDescription(
        sentence([enumLabel('artist_type', artist.value.type), count('seo.albums_count', artist.value.albums_count)]),
        plainText(artist.value.bio),
        descriptionLength(locale.value),
      )
    : undefined,
  image: () => artist.value?.image_url,
  card: () => artist.value?.share_card_url,
  type: 'profile',
  noindex: () => artist.value?.is_pending,
  error,
  breadcrumbs: () => artist.value ? [{ name: t('menu.artist'), path: '/artists' }, { name: shownName.value, path: `/artists/${artist.value.id}` }] : null,
  jsonLd: () => artist.value && namedLd(artistLdType(artist.value.type), {
    name: shownName.value,
    alternateNames: [artist.value.name, ...(artist.value.titles ?? []).map(title => title.title)],
    url: absolute(`/artists/${artist.value.id}`),
    image: artist.value.image_url,
    description: plainText(artist.value.bio),
    sameAs: (artist.value.links ?? []).map(link => link.url),
  }),
})
</script>
