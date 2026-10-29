<template>
  <div>
    <!-- The banner: the album's own banner image, else its cover blurred into a wash. -->
    <div class="relative h-40 overflow-hidden bg-card-active sm:h-48 md:h-52 lg:h-60 2xl:h-64">
      <img
        v-if="album.banner_url"
        v-img-fade
        :src="album.banner_url"
        alt=""
        class="absolute inset-0 size-full object-cover"
      >
      <img
        v-else-if="coverUrl"
        v-img-fade
        :src="coverUrl"
        alt=""
        class="absolute inset-0 size-full scale-110 object-cover blur-md saturate-125"
      >
      <div class="absolute inset-0 bg-black/10 dark:bg-black/30" />
    </div>

    <!-- A card as wide as the body's cards, riding up over the banner's lower edge. -->
    <div class="container mx-auto max-w-6xl px-4 md:px-8 2xl:max-w-7xl">
      <div class="card relative -mt-12 flex flex-col items-center gap-x-8 px-4 pb-6 sm:px-6 md:-mt-16 md:flex-row md:items-start lg:gap-x-10 lg:px-8 lg:pb-7 2xl:-mt-18">
        <!-- The cover sticks out of the card's top into the banner, cut out of it by a ring in the card colour; the
             like button fills the room under it. -->
        <div class="flex shrink-0 flex-col gap-3">
          <button
            type="button"
            class="relative -mt-22 cursor-zoom-in rounded-md shadow-lg ring-4 ring-card disabled:cursor-default sm:-mt-24 lg:-mt-26 xl:-mt-28 2xl:-mt-30"
            :disabled="!album.cover"
            @click="$emit('open-cover')"
          >
            <img
              v-if="coverUrl"
              v-img-fade
              :src="coverUrl"
              :alt="album.title"
              class="size-40 rounded-md object-cover sm:size-44 md:size-48 lg:size-52 xl:size-56 2xl:size-60"
            >
            <span v-else class="flex size-40 items-center justify-center rounded-md bg-sunken text-meta sm:size-44 md:size-48 lg:size-52 xl:size-56 2xl:size-60">
              <Disc3 :size="56" />
            </span>
          </button>
          <UiButton
            :variant="isFavorited ? 'danger' : 'danger-soft'"
            size="sm"
            block
            :disabled="isToggling || (album.is_pending && !isFavorited)"
            :title="album.is_pending ? $t('pending.locked') : undefined"
            @click="toggleLike"
          >
            <Heart class="size-4 shrink-0" :fill="isFavorited ? 'currentColor' : 'none'" />
            {{ $t(isFavorited ? 'content_display.liked' : 'content_display.like') }}
          </UiButton>
        </div>

        <div class="@container w-full min-w-0 flex-1 pt-5 text-center md:pt-6 md:text-left">
          <!-- What the album is, on a row of its own, every tag with its icon: the type filled; the formats worth a word
               and the categories outlined. -->
          <div class="flex flex-wrap items-center justify-center gap-1.5 md:justify-start">
            <span class="inline-flex h-6 items-center gap-1 rounded bg-primary pl-1.5 pr-2 text-xs font-semibold text-on-primary">
              <Icon :name="typeIcon" class="size-3.5 shrink-0" />
              {{ typeLabel }}
            </span>
            <span
              v-for="tag in tags"
              :key="tag.key"
              class="inline-flex h-6 items-center gap-1 rounded pl-1.5 pr-2 text-xs font-semibold text-title ring-1 ring-inset ring-title/20"
            >
              <Icon :name="tag.icon" class="size-3.5 shrink-0 text-meta" />
              {{ tag.label }}
            </span>
            <CatalogPendingBadge v-if="album.is_pending" />
          </div>

          <!-- The album's size in big figures: beside the title when the column is wide enough, under it when not. -->
          <div class="mt-3 flex flex-col gap-4 @2xl:flex-row @2xl:items-start @2xl:justify-between @2xl:gap-10">
            <div class="min-w-0">
              <h1 class="wrap-break-word text-balance font-bold leading-tight text-title" :class="titleSize">
                {{ shownTitle }}
              </h1>
              <p v-if="originalTitle" class="mt-1 text-sm text-body">{{ originalTitle }}</p>

              <!-- The byline: the publishers, else the 署名艺术家, every one of them; under publishers, the 署名艺术家
                   follow. Who labels, sells or makes the album is in 专辑信息. Unlike the grey fact tags further down,
                   each name is the artist's picture (or its icon on a grey tile: a building for publishers, a person
                   otherwise) and the name, with no fill until hovered; then the whole block, picture and padding
                   included, turns grey. The row moves left by that padding, so the pictures line up with the title.
                   A name-only credit has no link. -->
              <div v-if="bylineTags.length" class="mt-2 flex flex-wrap items-center justify-center gap-1 md:-ml-1.5 md:justify-start">
                <component
                  :is="tag.id ? NuxtLink : 'span'"
                  v-for="tag in bylineTags"
                  :key="tag.key"
                  :to="tag.id ? `/artists/${tag.id}` : undefined"
                  class="inline-flex min-w-0 max-w-full items-center gap-2.5 rounded-lg py-1.5 pl-1.5 pr-4 text-sm font-semibold text-title transition-colors duration-150"
                  :class="tag.id && 'hover:bg-black/[0.06] dark:hover:bg-white/[0.08]'"
                >
                  <img v-if="tag.image" :src="tag.image" alt="" class="size-7 shrink-0 rounded-md object-cover">
                  <span v-else class="grid size-7 shrink-0 place-items-center rounded-md bg-black/[0.06] text-meta dark:bg-white/[0.1]">
                    <component :is="tag.icon" :size="14" />
                  </span>
                  <span class="truncate">{{ tag.name }}</span>
                </component>
              </div>
            </div>

            <dl v-if="figures.length" class="flex shrink-0 justify-center divide-x divide-line md:justify-start @2xl:pt-1">
              <!-- The label comes first for screen readers and shows under its figure. -->
              <div v-for="figure in figures" :key="figure.key" class="flex flex-col-reverse px-5 first:pl-0 last:pr-0">
                <dt class="mt-1.5 text-xs text-meta">{{ figure.label }}</dt>
                <dd class="text-2xl font-bold leading-none tabular-nums text-title lg:text-[1.75rem]">{{ figure.value }}</dd>
              </div>
            </dl>
          </div>

          <!-- Catalog number, release date and event as grey tags like the links card's; the event's lists its albums. -->
          <div v-if="album.catalog_number || album.release_date || album.release_event" class="mt-4 flex flex-wrap items-center justify-center gap-1.5 md:justify-start">
            <span v-if="album.catalog_number" :class="FACT_TAG">
              <Hash :size="14" class="shrink-0 text-meta" />
              <span class="truncate font-mono">{{ album.catalog_number }}</span>
            </span>
            <span v-if="album.release_date" :class="FACT_TAG">
              <Calendar :size="14" class="shrink-0 text-meta" />
              {{ formatDate(album.release_date, album.release_date_precision) }}
            </span>
            <NuxtLink
              v-if="album.release_event"
              :to="`/albums?event=${album.release_event.id}`"
              :class="[FACT_TAG, 'hover:bg-black/[0.1] dark:hover:bg-white/[0.14]']"
            >
              <Ticket :size="14" class="shrink-0 text-meta" />
              <span class="truncate">{{ album.release_event.name }}</span>
            </NuxtLink>
          </div>

          <div v-if="album.streaming.length" class="mt-5 flex flex-wrap items-center justify-center gap-2 md:justify-start">
            <UiButton
              v-for="link in album.streaming"
              :key="link.id"
              :href="link.url"
              target="_blank"
              rel="noopener noreferrer"
              size="sm"
              class="group gap-1.5"
              :style="hoveredLinkId === link.id ? { backgroundColor: getStreamingProvider(link.provider?.name ?? '').color + '22' } : {}"
              @mouseenter="hoveredLinkId = link.id"
              @mouseleave="hoveredLinkId = null"
            >
              <Icon
                :name="getStreamingProvider(link.provider?.name ?? '').icon"
                size="16"
                class="shrink-0 transition-all duration-200"
                :class="hoveredLinkId === link.id ? '' : 'opacity-70'"
                :style="hoveredLinkId === link.id
                  ? { color: getStreamingProvider(link.provider?.name ?? '').color, filter: 'none' }
                  : { filter: 'grayscale(1)' }"
              />
              {{ providerName(link.provider?.name ?? '') }}
            </UiButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ALBUM_CATEGORY_ICONS, ALBUM_TYPE_ICONS, DISC_FORMAT_ICONS, type Album } from '~/types/album'
import { getStreamingProvider } from '~/utils/streamingProviders'
import { NuxtLink } from '#components'
import { Building2, Calendar, Disc3, Hash, Heart, Ticket, UserRound } from '@lucide/vue'

/** Catalog number, date and event: the grey and size of the page's other tags (links card, credits). */
const FACT_TAG = 'inline-flex h-7 min-w-0 max-w-full items-center gap-1.5 rounded-md bg-black/[0.05] px-2.5 text-[12.5px] font-medium text-title transition-colors duration-150 dark:bg-white/[0.08]'

const props = defineProps<{ album: Album }>()
const emit = defineEmits<{ 'open-cover': [], favorited: [value: boolean] }>()

const { t, te } = useI18n()
const { isAuthenticated } = useAuth()
const { setFavoriteAlbum } = useFavorites()
const route = useRoute()
const { localName, formatDate, formatDuration, enumLabel } = useCatalogDisplay()

const shownTitle = computed(() => localName(props.album.title, props.album.titles))
const originalTitle = computed(() => shownTitle.value !== props.album.title ? props.album.title : '')
/**
 * Long titles step down in size, so they wrap onto fewer lines. The length is a rough width: a CJK or full-width
 * character counts as one, anything else as about half. Worked out from the text, so the server renders it right.
 */
const titleSize = computed(() => {
  let width = 0
  for (const char of shownTitle.value) width += /[\u3000-\u9fff\uac00-\ud7af\uf900-\ufaff\uff00-\uffef]/.test(char) ? 1 : 0.55
  if (width <= 22) return 'text-[22px] lg:text-[26px]'
  if (width <= 40) return 'text-xl lg:text-[23px]'
  return 'text-lg lg:text-xl'
})
/** The album-wide 署名艺术家 when the byline names the publishers instead, each once. */
const bylineArtists = computed(() => {
  if (props.album.byline?.role !== 'publisher') return []
  const seen = new Map<string, { key: string, id: number | null, name: string }>()
  for (const credit of props.album.credits) {
    if (credit.role !== 'artist') continue
    const name = credit.credited_as || credit.artist?.name || ''
    const key = credit.artist ? `id:${credit.artist.id}` : `name:${name}`
    if (name && !seen.has(key)) seen.set(key, { key, id: credit.artist?.id ?? null, name })
  }
  return [...seen.values()]
})
/**
 * The byline's tags: the publishers, or with none the 署名艺术家; then the 署名艺术家 under publishers. Pictures come
 * from the credits, which carry the artists' images.
 */
const bylineTags = computed(() => {
  const byline = props.album.byline
  if (!byline) return []
  const images = new Map(props.album.credits.flatMap(credit => credit.artist?.image_url ? [[credit.artist.id, credit.artist.image_url] as const] : []))
  const icon = byline.role === 'publisher' ? Building2 : UserRound
  return [
    ...byline.artists.map(artist => ({ key: `${byline.role}:${artist.id}:${artist.name}`, id: artist.id, name: artist.name, icon })),
    ...bylineArtists.value.map(artist => ({ key: `artist:${artist.key}`, id: artist.id, name: artist.name, icon: UserRound })),
  ].map(tag => ({ ...tag, image: tag.id ? images.get(tag.id) ?? null : null }))
})
const coverUrl = computed(() => props.album.cover?.medium_url || props.album.image_url)
const typeLabel = computed(() => te(`albums.type.${props.album.type}`) ? t(`albums.type.${props.album.type}`) : props.album.type)
const typeIcon = computed(() => ALBUM_TYPE_ICONS[props.album.type] ?? 'lucide:disc-3')
/** The formats worth a word (anything but a plain CD: vinyl, cassette, SACD …), then the categories. */
const tags = computed(() => [
  ...props.album.disc_formats.filter(format => format !== 'cd')
    .map(format => ({ key: `format:${format}`, label: enumLabel('disc_format', format), icon: DISC_FORMAT_ICONS[format] ?? 'lucide:disc' })),
  ...props.album.categories
    .map(category => ({ key: `category:${category}`, label: enumLabel('album_category', category), icon: ALBUM_CATEGORY_ICONS[category] ?? 'lucide:tag' })),
])
/** Discs, tracks and running time, each only when known. */
const figures = computed(() => {
  const { disc_count: discs, track_count: tracks, duration } = props.album
  return [
    { key: 'discs', shown: discs > 0, value: String(discs), label: t('album.hero.discs', discs) },
    { key: 'tracks', shown: tracks > 0, value: String(tracks), label: t('album.hero.tracks', tracks) },
    { key: 'duration', shown: duration > 0, value: formatDuration(duration), label: t('album.hero.duration') },
  ].filter(figure => figure.shown)
})

const providerName = (name: string) => name.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')

const hoveredLinkId = ref<number | null>(null)
const isFavorited = ref(props.album.is_favorited)
// The page may swap in a fresher copy of the album after this has rendered (revisit cache).
watch(() => props.album.is_favorited, (value) => { isFavorited.value = value })
const isToggling = ref(false)

const toggleLike = async () => {
  if (!isAuthenticated.value) {
    await navigateTo(`/auth/login?redirect=${encodeURIComponent(route.fullPath)}`)
    return
  }
  if (isToggling.value) return
  isToggling.value = true
  try {
    isFavorited.value = (await setFavoriteAlbum(props.album.id, !isFavorited.value)).favorited
    emit('favorited', isFavorited.value)
  } catch {
    // 401 已由 api 插件处理
  } finally {
    isToggling.value = false
  }
}
</script>
