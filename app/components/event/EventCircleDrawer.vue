<template>
  <Teleport to="body">
    <Transition name="drawer">
      <div v-if="circle" class="fixed inset-0 z-60 flex justify-end">
        <div class="absolute inset-0 bg-slate-900/30 backdrop-blur-[2px]" @click="$emit('close')" />
        <aside
          ref="panel"
          class="drawer-panel relative mt-auto flex max-h-[88vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:mt-0 sm:max-h-none sm:w-[26rem] sm:rounded-none sm:rounded-l-3xl"
          role="dialog"
          aria-modal="true"
          :aria-label="circle.name"
          tabindex="-1"
        >
          <div class="relative shrink-0 bg-slate-950 px-5 pb-5 pt-4 text-white">
            <img v-if="circle.image_url" :src="circle.image_url" alt="" class="absolute inset-0 h-full w-full scale-125 object-cover opacity-30 blur-xl">
            <div class="relative flex items-start justify-between gap-3">
              <span class="rounded-md bg-white/10 px-2 py-1 text-xs font-semibold ring-1 ring-white/15">{{ spaceLabel || t('event_page.circle.catalog_only') }}</span>
              <button type="button" class="-mr-1 rounded-full p-1.5 text-white/70 hover:bg-white/10 hover:text-white" :aria-label="t('common.close')" @click="$emit('close')">
                <X :size="18" />
              </button>
            </div>
            <div class="relative mt-3 flex gap-4">
              <div class="size-28 shrink-0 overflow-hidden rounded-2xl bg-white/10 ring-1 ring-white/20">
                <img v-if="circle.image_url" :src="circle.image_url" :alt="circle.name" class="h-full w-full object-cover">
                <div v-else class="flex h-full w-full items-center justify-center text-white/30"><Users :size="36" /></div>
              </div>
              <div class="min-w-0 flex-1 self-end">
                <h2 class="text-xl font-bold leading-snug">{{ circle.name }}</h2>
                <p v-if="circle.name_kana && circle.name_kana !== circle.name" class="mt-0.5 text-xs text-white/60">{{ circle.name_kana }}</p>
                <p v-if="circle.genre" class="mt-2 inline-flex items-center gap-1.5 text-xs text-white/80">
                  <span class="size-2 rounded-full" :style="{ background: familyColor }" />{{ genreShortLabel(circle.genre, genres) }}
                </p>
              </div>
            </div>
            <div class="relative mt-4 flex gap-2">
              <button
                type="button"
                class="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition-colors"
                :class="checked ? 'bg-amber-400 text-slate-900 hover:bg-amber-300' : 'bg-white text-slate-900 hover:bg-white/90'"
                @click="$emit('toggle-check')"
              >
                <Star :size="16" :fill="checked ? 'currentColor' : 'none'" />
                {{ checked ? t('event_page.checklist.remove') : t('event_page.checklist.add') }}
              </button>
              <button
                v-if="circle.space_id"
                type="button"
                class="inline-flex items-center justify-center gap-1.5 rounded-xl bg-white/10 px-3 py-2 text-sm font-medium ring-1 ring-white/20 hover:bg-white/15"
                @click="$emit('locate')"
              >
                <LocateFixed :size="16" />{{ t('event_page.circle.locate') }}
              </button>
            </div>
          </div>

          <div class="flex-1 space-y-6 overflow-y-auto px-5 py-5">
            <p v-if="circle.description" class="whitespace-pre-line text-sm leading-relaxed text-slate-700">{{ circle.description }}</p>

            <div v-if="circle.keywords.length" class="flex flex-wrap gap-1.5">
              <span v-for="keyword in circle.keywords" :key="keyword" class="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">#{{ keyword }}</span>
            </div>

            <section v-if="circle.links.length">
              <h3 class="drawer-heading">{{ t('event_page.circle.links') }}</h3>
              <ul class="space-y-1">
                <li v-for="link in circle.links" :key="link.url">
                  <a :href="link.url" target="_blank" rel="noopener" class="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50">
                    <Icon :name="linkIcon(link.url)" class="size-4 shrink-0 text-slate-500" />
                    <span class="min-w-0 flex-1 truncate">{{ displayUrl(link.url) }}</span>
                    <ExternalLink :size="13" class="shrink-0 text-slate-300" />
                  </a>
                </li>
              </ul>
            </section>

            <!-- Videos open on their own site: the drawer is too small to watch them in. -->
            <section v-if="videos.length">
              <h3 class="drawer-heading">{{ t('event_page.circle.preview') }}</h3>
              <div class="grid gap-3" :class="videos.length > 1 ? 'grid-cols-2' : 'grid-cols-1'">
                <a
                  v-for="video in videos"
                  :key="video.key"
                  :href="video.url"
                  target="_blank"
                  rel="noopener"
                  class="group block"
                  :aria-label="t('event_page.circle.watch_on', { site: VIDEO_SITES[video.site] })"
                >
                  <span class="relative block aspect-video overflow-hidden rounded-xl bg-slate-900">
                    <img
                      v-if="video.thumbnail && !brokenThumbnails.has(video.key)"
                      :src="video.thumbnail"
                      alt=""
                      loading="lazy"
                      class="h-full w-full object-cover opacity-85 transition duration-300 group-hover:scale-105 group-hover:opacity-100"
                      @error="brokenThumbnails = new Set(brokenThumbnails).add(video.key)"
                    >
                    <!-- No thumbnail (niconico), or it could not be loaded: the site's mark instead. -->
                    <span
                      v-else
                      class="flex h-full w-full items-end gap-1.5 bg-linear-to-br p-2.5"
                      :class="video.site === 'youtube' ? 'from-red-950 via-slate-900 to-slate-950' : 'from-slate-700 via-slate-800 to-slate-950'"
                    >
                      <Icon :name="video.site === 'youtube' ? 'simple-icons:youtube' : 'simple-icons:niconico'" class="size-4 text-white/45" />
                      <span class="text-[11px] font-medium leading-4 text-white/50">{{ VIDEO_SITES[video.site] }}</span>
                    </span>
                    <span class="absolute inset-0 flex items-center justify-center">
                      <span class="flex size-11 items-center justify-center rounded-full bg-black/60 text-white shadow-lg ring-1 ring-white/30 backdrop-blur-sm transition-transform group-hover:scale-110" :class="video.site === 'youtube' ? 'group-hover:bg-red-600' : 'group-hover:bg-slate-700'">
                        <Play :size="18" fill="currentColor" class="ml-0.5" />
                      </span>
                    </span>
                  </span>
                  <span class="mt-1.5 flex items-center gap-1.5 text-xs text-slate-600 group-hover:text-slate-900">
                    <Icon :name="video.site === 'youtube' ? 'simple-icons:youtube' : 'simple-icons:niconico'" class="size-3.5 shrink-0" />
                    {{ t('event_page.circle.watch_on', { site: VIDEO_SITES[video.site] }) }}
                    <ExternalLink :size="11" class="text-slate-400" />
                  </span>
                </a>
              </div>
            </section>

            <section v-if="circle.artist">
              <h3 class="drawer-heading">{{ t('event_page.circle.artist') }}</h3>
              <NuxtLink :to="`/artists/${circle.artist.id}`" class="flex items-center gap-3 rounded-xl border border-slate-200 p-2.5 hover:border-slate-300 hover:bg-slate-50">
                <img v-if="circle.artist.image_url" :src="circle.artist.image_url" alt="" class="size-10 rounded-full object-cover">
                <span v-else class="flex size-10 items-center justify-center rounded-full bg-slate-100 text-slate-400"><UserRound :size="18" /></span>
                <span class="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800">{{ circle.artist.name }}</span>
                <ChevronRight :size="16" class="text-slate-400" />
              </NuxtLink>
            </section>

            <section v-if="circle.album_ids.length">
              <h3 class="drawer-heading">{{ t('event_page.circle.albums') }}</h3>
              <div v-if="albumsLoading" class="grid grid-cols-2 gap-3">
                <div v-for="n in Math.min(circle.album_ids.length, 4)" :key="n" class="skeleton aspect-square rounded-xl" />
              </div>
              <div v-else class="grid grid-cols-2 gap-3">
                <NuxtLink v-for="album in albums" :key="album.id" :to="`/albums/${album.id}`" class="group">
                  <div class="aspect-square overflow-hidden rounded-xl bg-slate-100">
                    <img v-if="album.image_url" :src="album.image_url" :alt="album.title" loading="lazy" class="h-full w-full object-cover transition-transform group-hover:scale-105">
                  </div>
                  <p class="mt-1.5 line-clamp-2 text-xs font-medium text-slate-700 group-hover:text-blue-600">{{ album.title }}</p>
                </NuxtLink>
              </div>
            </section>

            <p v-if="circle.is_adult" class="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{{ t('event_page.circle.adult') }}</p>
          </div>
        </aside>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import type { AlbumSimple } from '~/types/album'
import type { EventCircle, VenueMapData } from '~/types/event'
import { ChevronRight, ExternalLink, LocateFixed, Play, Star, UserRound, Users, X } from '@lucide/vue'

const props = defineProps<{
  circle: EventCircle | null
  eventId: number
  genres: VenueMapData['genres']
  spaceLabel: string
  checked: boolean
}>()
const emit = defineEmits<{ 'close': [], 'toggle-check': [], 'locate': [] }>()
const { t } = useI18n()
const { $api } = useNuxtApp()

const panel = ref<HTMLElement | null>(null)
const VIDEO_SITES = { youtube: 'YouTube', niconico: 'ニコニコ動画' } as const
const videos = computed(() => props.circle ? circleVideos(props.circle) : [])
/** Thumbnails that failed to load (i.ytimg.com is unreachable from some networks). */
const brokenThumbnails = ref(new Set<string>())
const familyColor = computed(() => GENRE_FAMILIES.find(f => f.key === genreFamily(props.circle?.genre, props.genres))?.color ?? '#94a3b8')

const displayUrl = (url: string) => url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')

const albums = ref<AlbumSimple[]>([])
const albumsLoading = ref(false)
watch(() => props.circle?.id, async () => {
  albums.value = []
  const circle = props.circle
  nextTick(() => panel.value?.focus())
  if (!circle?.artist || !circle.album_ids.length) return
  albumsLoading.value = true
  try {
    const data = await $api<{ albums: AlbumSimple[] }>('/v1/albums', {
      query: { release_event_id: props.eventId, artist_id: circle.artist.id, per_page: 12 },
      progress: false,
    })
    if (props.circle?.id === circle.id) albums.value = data.albums
  } catch {
    albums.value = []
  } finally {
    albumsLoading.value = false
  }
}, { immediate: true })

// Esc closes from anywhere while open.
const onKey = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && props.circle) emit('close')
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<style scoped>
.drawer-heading {
  margin-bottom: 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: #64748b;
}
.drawer-enter-active, .drawer-leave-active { transition: opacity 0.25s ease; }
.drawer-enter-active .drawer-panel, .drawer-leave-active .drawer-panel { transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1); }
.drawer-enter-from, .drawer-leave-to { opacity: 0; }
.drawer-enter-from .drawer-panel, .drawer-leave-to .drawer-panel { transform: translateY(40%); }
@media (min-width: 640px) {
  .drawer-enter-from .drawer-panel, .drawer-leave-to .drawer-panel { transform: translateX(100%); }
}
</style>
