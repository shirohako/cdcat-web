<template>
  <Teleport to="body">
    <!-- Above the navbar (z-50) and sidebar, which would otherwise cover the top bar with its close button; below
         popovers and tooltips. A click on the dark area around the picture closes it too. Opens with the dark
         fading in and the picture growing a little; closes the other way, quicker. -->
    <Transition name="viewer" :duration="{ enter: 360, leave: 200 }">
      <div v-if="current" ref="viewer" class="viewer fixed inset-0 z-[70] flex flex-col bg-black/90" tabindex="-1" @keydown.esc.stop="close" @keydown.left="step(-1)" @keydown.right="step(1)">
        <div class="flex items-center gap-3 px-4 py-3 text-sm text-white/80">
          <span class="font-semibold text-white">{{ current.title }}</span>
          <span v-if="current.label">{{ current.label }}</span>
          <span v-if="current.scope" class="text-white/60">{{ current.scope }}</span>
          <span class="ml-auto tabular-nums text-white/60">{{ index! + 1 }} / {{ items.length }}</span>
          <a :href="current.image.url" target="_blank" rel="noopener" class="-mx-1.5 rounded-md px-1.5 py-0.5 text-xs transition-colors duration-150 ease-out hover:bg-white/15 hover:text-white">{{ $t('album.gallery.original', { width: current.image.width, height: current.image.height }) }}</a>
          <button type="button" class="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-white transition-colors duration-150 ease-out hover:bg-white/15" @click="close"><X :size="18" /></button>
        </div>

        <div class="relative min-h-0 flex-1" @click.self="close">
          <!-- The picture's box takes the image's own shape (from its known size) the moment it is chosen, so nothing
               jumps when the image arrives; the box never grows past the medium image's own size. It keeps clear of
               the edges on every side: past the side buttons left and right, a margin above and below. -->
          <div class="zoom absolute inset-x-14 inset-y-4 [container-type:size] sm:inset-x-20 sm:inset-y-8 lg:inset-x-24 lg:inset-y-10" @click.self="close">
            <Transition :name="direction > 0 ? 'slide-next' : 'slide-prev'">
              <div
                :key="index!"
                class="frame absolute inset-0 m-auto overflow-hidden rounded-md"
                :class="state === 'loaded' ? 'is-loaded' : 'bg-white/[0.06]'"
                :style="frameStyle(current.image)"
              >
                <!-- While the image downloads: its thumbnail (already on screen in the gallery), blurred, with a light
                     sweeping across it and a spinner, so a click always shows at once that something is coming. -->
                <div class="placeholder absolute inset-0" aria-hidden="true">
                  <img :src="current.image.thumbnail_url" alt="" class="size-full scale-110 object-cover blur-xl">
                  <div v-if="state === 'loading'" class="shimmer absolute inset-0" />
                </div>

                <img
                  v-if="state !== 'failed'"
                  :src="current.image.medium_url"
                  :alt="current.caption || ''"
                  decoding="async"
                  class="photo relative size-full object-contain"
                  @load="settleFrom($event, 'loaded')"
                  @error="settleFrom($event, 'failed')"
                >

                <div v-if="state === 'loading'" class="spinner absolute inset-0 m-auto size-11 rounded-full bg-black/40 p-2.5 backdrop-blur-sm" role="status">
                  <svg viewBox="0 0 24 24" class="spin size-full" aria-hidden="true">
                    <circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" stroke-width="2.5" class="text-white/15" />
                    <circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" class="arc text-white" />
                  </svg>
                  <span class="sr-only">{{ $t('album.gallery.loading') }}</span>
                </div>

                <div v-else-if="state === 'failed'" class="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/40 text-sm text-white/85">
                  <ImageOff :size="24" class="text-white/60" />
                  {{ $t('album.gallery.failed') }}
                </div>
              </div>
            </Transition>
          </div>

          <button v-if="items.length > 1" type="button" class="side-button absolute left-2 top-1/2 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-full text-white transition-[background-color,scale] duration-150 ease-out hover:bg-white/15" @click="step(-1)"><ChevronLeft :key="`prev-${kicks.prev}`" :size="22" :class="kicks.prev ? 'kick-prev' : undefined" /></button>
          <button v-if="items.length > 1" type="button" class="side-button absolute right-2 top-1/2 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-full text-white transition-[background-color,scale] duration-150 ease-out hover:bg-white/15" @click="step(1)"><ChevronRight :key="`next-${kicks.next}`" :size="22" :class="kicks.next ? 'kick-next' : undefined" /></button>
        </div>

        <div v-if="current.caption || current.attributes?.length" class="space-y-2 px-6 py-3 text-sm text-white/80">
          <p v-if="current.caption">{{ current.caption }}</p>
          <CatalogAttributeList v-if="current.attributes?.length" :attributes="current.attributes" class="text-white/80 [&_dd]:text-white/90 [&_dt]:text-white/50" />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import type { CatalogAttribute, CatalogImage } from '~/types/catalog'
import { ChevronLeft, ChevronRight, ImageOff, X } from '@lucide/vue'

export interface CatalogImageViewerItem {
  image: CatalogImage
  /** The kind, e.g. 背面 */
  title: string
  label?: string | null
  /** What the image belongs to, e.g. an edition */
  scope?: string | null
  caption?: string | null
  attributes?: CatalogAttribute[]
}

/**
 * The full-screen viewer of a page's images (the album gallery, the artist page's 图片): one at a time with its kind,
 * label and caption, ← and → or the side buttons to step through, Esc or a click beside the picture to close.
 * `index` is the image shown, null while closed.
 *
 * The medium images are large and slow, so a step never waits for one: the counter, the titles and a box of the new
 * image's shape (its blurred thumbnail, a sweeping light and a spinner) slide in at once, and the image fades in
 * sharp over them when it has arrived. Once an image is in, its neighbours are fetched in the background.
 */
const props = defineProps<{ items: CatalogImageViewerItem[] }>()
const index = defineModel<number | null>('index', { required: true })

const viewer = ref<HTMLElement | null>(null)
const current = computed(() => index.value === null ? null : props.items[index.value] ?? null)

/** Medium images known to be in the browser, or to have failed; an image seen before shows without the wait. */
const settled = reactive(new Map<string, 'loaded' | 'failed'>())
const state = computed(() => current.value ? settled.get(current.value.image.medium_url) ?? 'loading' : 'loading')
const settle = (url: string, value: 'loaded' | 'failed') => { settled.set(url, value) }
/** From the image element itself: a frame sliding out may still finish loading after the next one is chosen. */
const settleFrom = (event: Event, value: 'loaded' | 'failed') => {
  const url = (event.target as HTMLImageElement).getAttribute('src')
  if (url) settle(url, value)
}

/** The medium variant's long edge (CatalogPresenter: variantUrl(1200)); smaller images are served as they are. */
const MEDIUM = 1200

/** As large as the stage allows in the image's shape, but never past the medium image's own size. */
const frameStyle = (image: CatalogImage) => {
  const known = image.width > 0 && image.height > 0
  const ratio = known ? image.width / image.height : 1
  const scale = known ? Math.min(1, MEDIUM / Math.max(image.width, image.height)) : 1
  const width = known ? image.width * scale : MEDIUM
  const height = known ? image.height * scale : MEDIUM
  return {
    width: `min(100cqw, 100cqh * ${ratio}, ${width}px)`,
    height: `min(100cqh, 100cqw / ${ratio}, ${height}px)`,
  }
}

/** Fetches the images either side of the shown one, the thumbnails at once and the medium ones after it is in. */
const fetching = new Set<string>()
const preload = (url: string, track: boolean) => {
  if (fetching.has(url) || (track && settled.has(url))) return
  fetching.add(url)
  const image = new Image()
  image.decoding = 'async'
  const done = (value: 'loaded' | 'failed') => {
    fetching.delete(url)
    if (track) settle(url, value)
  }
  image.onload = () => done('loaded')
  image.onerror = () => done('failed')
  image.src = url
}
const neighbours = () => {
  if (index.value === null || props.items.length < 2) return []
  const at = index.value
  return [1, -1].map(delta => props.items[(at + delta + props.items.length) % props.items.length]!)
}
watch(index, () => {
  // A failed image gets another try each time it is shown.
  if (current.value && settled.get(current.value.image.medium_url) === 'failed') settled.delete(current.value.image.medium_url)
  for (const item of neighbours()) preload(item.image.thumbnail_url, false)
})
// The index too: stepping onto an image that was already in leaves the state 'loaded'.
watch([index, state], ([, value]) => {
  if (value !== 'loaded') return
  for (const item of neighbours()) preload(item.image.medium_url, true)
})

/** Which way the last step went, so the next image slides in from that side. */
const direction = ref(1)
/** Steps each way so far: a new count remounts that arrow, which plays its kick again. */
const kicks = reactive({ prev: 0, next: 0 })

// Focused when it opens, so the keys work at once.
watch(index, async (value, previous) => {
  if (value === null || previous !== null) return
  // Opened afresh: the arrows don't kick until stepped.
  kicks.prev = 0
  kicks.next = 0
  await nextTick()
  viewer.value?.focus()
})
const close = () => { index.value = null }
const step = (delta: number) => {
  if (index.value === null) return
  direction.value = delta
  kicks[delta > 0 ? 'next' : 'prev']++
  index.value = (index.value + delta + props.items.length) % props.items.length
}
</script>

<style scoped>
/* Open and close: the dark fades, the bars fade, the picture grows from a little smaller. */
.viewer-enter-active,
.viewer-leave-active {
  transition: opacity 220ms ease-out;
}

.viewer-leave-active {
  transition-duration: 180ms;
  transition-timing-function: ease-in;
}

.viewer-enter-from,
.viewer-leave-to {
  opacity: 0;
}

.viewer-enter-active .zoom {
  transition: scale 360ms cubic-bezier(0.22, 1, 0.36, 1);
}

.viewer-leave-active .zoom {
  transition: scale 200ms ease-in;
}

.viewer-enter-from .zoom,
.viewer-leave-to .zoom {
  scale: 0.94;
}

/* The box's fill fades as its image arrives. Before the slides: they repeat it, as their own `transition` would
   otherwise be overruled by this one (same specificity, later wins) and the frames would just swap. */
.frame {
  transition: background-color 300ms ease-out;
}

/* Stepping: both images move at once. The old one speeds off the far side, shrinking and fading; the new one
   glides in from the side it comes from, growing to full size and settling. A quarter of the stage's width, so it
   reads as travel and not a nudge. */
.slide-next-enter-active,
.slide-prev-enter-active {
  transition:
    translate 480ms cubic-bezier(0.22, 1, 0.36, 1),
    scale 480ms cubic-bezier(0.22, 1, 0.36, 1),
    opacity 320ms ease-out,
    background-color 300ms ease-out;
}

.slide-next-leave-active,
.slide-prev-leave-active {
  transition:
    translate 360ms cubic-bezier(0.55, 0, 0.75, 0.3),
    scale 360ms cubic-bezier(0.55, 0, 0.75, 0.3),
    opacity 260ms ease-in,
    background-color 300ms ease-out;
}

.slide-next-enter-from,
.slide-prev-leave-to {
  opacity: 0;
  translate: 25cqw 0;
  scale: 0.9;
}

.slide-next-leave-to,
.slide-prev-enter-from {
  opacity: 0;
  translate: -25cqw 0;
  scale: 0.9;
}

/* The side buttons give way when pressed and their arrow kicks the way it goes (the arrow keys kick them too). */
.side-button:active {
  scale: 0.9;
}

.kick-prev {
  animation: kick-prev 360ms cubic-bezier(0.22, 1, 0.36, 1);
}

.kick-next {
  animation: kick-next 360ms cubic-bezier(0.22, 1, 0.36, 1);
}

@keyframes kick-prev {
  35% { translate: -5px 0; }
}

@keyframes kick-next {
  35% { translate: 5px 0; }
}

/* The image develops: from a little blurred and see-through to sharp, while the placeholder under it fades away
   (so a see-through image doesn't keep the blurred thumbnail behind it). An image already in the browser is drawn
   loaded from the start, so none of this plays. */
.photo {
  opacity: 0;
  filter: blur(12px);
  scale: 1.02;
  transition: opacity 420ms ease-out, filter 520ms ease-out, scale 520ms cubic-bezier(0.22, 1, 0.36, 1);
}

.is-loaded .photo {
  opacity: 1;
  filter: none;
  scale: 1;
}

.placeholder {
  transition: opacity 400ms ease-out 120ms;
}

.is-loaded .placeholder {
  opacity: 0;
}

.shimmer {
  background: linear-gradient(105deg, transparent 35%, rgb(255 255 255 / 0.14) 50%, transparent 65%) no-repeat;
  background-size: 250% 100%;
  animation: shimmer 1.6s ease-in-out infinite;
}

/* The spinner waits a moment before it shows, so a quick image doesn't flash it. */
.spinner {
  animation: spinner-in 220ms ease-out 160ms both;
}

.spin {
  animation: spin 900ms linear infinite;
}

.arc {
  stroke-dasharray: 60;
  stroke-dashoffset: 45;
  animation: arc 1.8s ease-in-out infinite;
}

@keyframes shimmer {
  from { background-position: 150% 0; }
  to { background-position: -50% 0; }
}

@keyframes spinner-in {
  from { opacity: 0; scale: 0.8; }
  to { opacity: 1; scale: 1; }
}

@keyframes spin {
  to { rotate: 360deg; }
}

@keyframes arc {
  0%, 100% { stroke-dashoffset: 52; }
  50% { stroke-dashoffset: 22; }
}

@media (prefers-reduced-motion: reduce) {
  .viewer-enter-from .zoom,
  .viewer-leave-to .zoom,
  .slide-next-enter-from,
  .slide-next-leave-to,
  .slide-prev-enter-from,
  .slide-prev-leave-to {
    scale: none;
    translate: none;
  }

  .photo {
    filter: none;
    scale: none;
  }

  .shimmer,
  .kick-prev,
  .kick-next {
    animation: none;
  }

  .side-button:active {
    scale: none;
  }
}
</style>
