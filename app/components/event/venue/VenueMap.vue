<template>
  <div
    ref="root"
    class="venue-map relative select-none overflow-hidden bg-sunken"
    :class="{ 'is-detailed': detailed, 'is-filtered': highlighted !== null }"
    @pointerleave="engaged = false"
  >
    <svg
      ref="svg"
      class="block h-full w-full touch-none"
      :viewBox="`0 0 ${size.w} ${size.h}`"
      role="img"
      :aria-label="t('event_page.map.aria')"
      @pointerdown="engaged = true"
    >
      <defs>
        <pattern id="venue-dots" width="14" height="14" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" class="venue-dot" />
        </pattern>
        <filter id="venue-hall-shadow" x="-5%" y="-5%" width="110%" height="110%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="2.5" flood-opacity="0.12" class="venue-shadow" />
        </filter>
      </defs>
      <rect width="100%" height="100%" fill="url(#venue-dots)" />

      <g ref="scene">
        <!-- Hall floors; in the overview they are what one clicks to go in. -->
        <g>
          <rect
            v-for="hall in map.halls"
            :key="hall.id"
            :x="hall.bbox[0]"
            :y="hall.bbox[1]"
            :width="hall.bbox[2]"
            :height="hall.bbox[3]"
            rx="2"
            class="venue-hall"
            :class="{ 'is-current': hall.id === currentHallId }"
            filter="url(#venue-hall-shadow)"
            @click="focusHall(hall.id)"
          />
        </g>

        <g class="pointer-events-none">
          <path
            v-for="(shape, i) in map.background"
            :key="i"
            :d="shape.d"
            :fill="shape.w ? 'none' : undefined"
            :style="shape.w ? { stroke: tone(shape.s) } : { fill: tone(shape.s) }"
            :stroke-width="shape.w"
            :fill-rule="shape.e ? 'evenodd' : undefined"
          />
          <text
            v-for="(label, i) in map.labels"
            :key="`l${i}`"
            :x="label.x"
            :y="label.y"
            :font-size="label.kind === 'area' ? label.size * 1.05 : label.size * 0.82"
            :transform="label.rotate ? `rotate(${label.rotate} ${label.x} ${label.y})` : undefined"
            :writing-mode="label.vertical ? 'vertical-rl' : undefined"
            text-anchor="middle"
            dominant-baseline="central"
            :class="label.kind === 'area' ? 'venue-area-label' : 'venue-label'"
          >{{ label.text }}</text>
        </g>

        <!-- Booths: one listener for the whole layer; each piece carries its key. -->
        <g
          class="venue-booths"
          @pointermove="onPointerMove"
          @pointerleave="scheduleHide"
          @click="onClick"
        >
          <g v-for="space in spaces" :key="space.id">
            <rect
              v-for="piece in space.pieces"
              :key="piece.key"
              :data-piece="piece.key"
              :x="piece.x + 0.35"
              :y="piece.y + 0.35"
              :width="Math.max(piece.w - 0.7, 0.5)"
              :height="Math.max(piece.h - 0.7, 0.5)"
              rx="0.9"
              :style="{ fill: pieceFill(piece) }"
              :class="pieceClass(piece)"
            />
          </g>
        </g>

        <g class="venue-numbers pointer-events-none">
          <text
            v-for="space in spaces"
            :key="space.id"
            :x="space.x + space.w / 2"
            :y="space.y + space.h / 2"
            :font-size="Math.min(space.w, space.h) * 0.42"
            :class="{ 'on-light': space.pieces.some(piece => !piece.circle) }"
            text-anchor="middle"
            dominant-baseline="central"
          >{{ Number(space.number) }}</text>
        </g>

        <!-- Hover and selection on top, so the booth layer never re-renders for them. -->
        <rect
          v-if="hovered"
          class="venue-hover pointer-events-none"
          :x="hovered.x"
          :y="hovered.y"
          :width="hovered.w"
          :height="hovered.h"
          rx="1"
        />
        <g v-if="selectedPiece" class="pointer-events-none">
          <rect class="venue-selected-pulse" :x="selectedPiece.x - 1.5" :y="selectedPiece.y - 1.5" :width="selectedPiece.w + 3" :height="selectedPiece.h + 3" rx="2" />
          <rect class="venue-selected" :x="selectedPiece.x" :y="selectedPiece.y" :width="selectedPiece.w" :height="selectedPiece.h" rx="1" />
        </g>

        <!-- Hall names in the overview -->
        <g v-if="!currentHallId" class="pointer-events-none">
          <g v-for="hall in map.halls" :key="hall.id" :transform="`translate(${hall.bbox[0] + 6} ${hall.bbox[1] - 5})`">
            <text class="venue-hall-name" :font-size="hallNameSize">{{ hall.name }}</text>
          </g>
        </g>
      </g>
    </svg>

    <!-- Breadcrumb and halls -->
    <div class="pointer-events-none absolute inset-x-0 top-0 flex flex-wrap items-center gap-2 p-3">
      <nav class="pointer-events-auto flex items-center gap-1 rounded-full bg-card/80 p-1 text-sm ring-1 ring-line backdrop-blur">
        <button
          type="button"
          class="rounded-full px-3 py-1 font-medium transition-colors duration-150 ease-out"
          :class="currentHallId ? 'text-meta hover:bg-ghost-hover hover:text-primary' : 'bg-primary text-on-primary'"
          @click="showOverview()"
        >
          {{ t('event_page.map.overview') }}
        </button>
        <button
          v-for="hall in map.halls"
          :key="hall.id"
          type="button"
          class="rounded-full px-3 py-1 font-medium whitespace-nowrap transition-colors duration-150 ease-out"
          :class="hall.id === currentHallId ? 'bg-primary text-on-primary' : 'text-body hover:bg-ghost-hover hover:text-primary'"
          @click="focusHall(hall.id)"
        >
          {{ hall.name }}
        </button>
      </nav>
    </div>

    <!-- Zoom -->
    <div class="absolute bottom-3 right-3 flex flex-col overflow-hidden rounded-xl bg-card/80 ring-1 ring-line backdrop-blur">
      <button type="button" class="venue-zoom-button" :aria-label="t('event_page.map.zoom_in')" @click="zoomBy(1.6)"><Plus :size="16" /></button>
      <button type="button" class="venue-zoom-button border-y border-line" :aria-label="t('event_page.map.zoom_out')" @click="zoomBy(1 / 1.6)"><Minus :size="16" /></button>
      <button type="button" class="venue-zoom-button" :aria-label="t('event_page.map.reset')" @click="currentHallId ? focusHall(currentHallId) : showOverview()"><Maximize2 :size="15" /></button>
    </div>

    <Transition name="fade">
      <div v-if="wheelHint" class="pointer-events-none absolute inset-0 flex items-center justify-center bg-hero/25">
        <span class="rounded-full bg-hero/85 px-4 py-2 text-sm text-on-media shadow-overlay">{{ t('event_page.map.wheel_hint', { key: isMac ? '⌘' : 'Ctrl' }) }}</span>
      </div>
    </Transition>

    <EventVenueBoothCard
      v-if="hovered && hoverAnchor"
      :piece="hovered"
      :anchor="hoverAnchor"
      :space-label="spaceLabel(hovered)"
      :genres="map.genres"
      :checked="hovered.circle ? checked.has(hovered.circle.id) : false"
      @enter="cancelHide"
      @leave="scheduleHide"
      @open="openPiece(hovered)"
    />
  </div>
</template>

<script setup lang="ts">
import type { ZoomBehavior, ZoomTransform } from 'd3-zoom'
import type { VenueMapData } from '~/types/event'
import type { VenuePiece, VenueSpace } from '~/utils/eventVenue'
import { Maximize2, Minus, Plus } from '@lucide/vue'
import { select } from 'd3-selection'
import 'd3-transition'
import { zoom, zoomIdentity } from 'd3-zoom'

const props = defineProps<{
  map: VenueMapData
  spaces: VenueSpace[]
  /** Circles matching the filters; null when nothing is filtered. */
  highlighted: Set<number> | null
  checked: ReadonlySet<number>
  colorByGenre: boolean
  selectedCircleId: number | null
}>()
const emit = defineEmits<{ select: [circleId: number], hall: [hallId: number | null] }>()
const { t } = useI18n()
const route = useRoute()

const root = ref<HTMLElement | null>(null)
const svg = ref<SVGSVGElement | null>(null)
const scene = ref<SVGGElement | null>(null)
const size = reactive({ w: 960, h: 600 })
const currentHallId = ref<number | null>(null)
const detailed = ref(false)
const engaged = ref(false)
const wheelHint = ref(false)
const isMac = import.meta.client && /Mac|iPhone|iPad/.test(navigator.platform)

const pieces = computed(() => {
  const all = new Map<string, VenuePiece>()
  for (const space of props.spaces) for (const piece of space.pieces) all.set(piece.key, piece)
  return all
})
const spaceById = computed(() => new Map(props.spaces.map(s => [s.id, s])))
const hallById = computed(() => new Map(props.map.halls.map(h => [h.id, h])))
const pieceOfCircle = computed(() => {
  const found = new Map<number, VenuePiece>()
  for (const piece of pieces.value.values()) if (piece.circle) found.set(piece.circle.id, piece)
  return found
})
const selectedPiece = computed(() => props.selectedCircleId ? pieceOfCircle.value.get(props.selectedCircleId) ?? null : null)

// Colours: the --map-* properties in the style block, which follow the theme (walls in the ink colour, grey areas as
// shades of it); booths by genre family, the same in both themes. Used as inline styles, since SVG attributes don't
// take var().
const tone = (s: number) => (s < 0.35 ? 'var(--map-wall)' : s > 0.97 ? 'var(--map-floor)' : s > 0.75 ? 'var(--map-shade)' : 'var(--map-mid)')
const families = Object.fromEntries(GENRE_FAMILIES.map(f => [f.key, f]))
const pieceFill = (piece: VenuePiece) => {
  if (!piece.circle) return 'var(--map-empty)'
  if (!props.colorByGenre) return 'var(--map-plain)'
  const family = genreFamily(piece.circle.genre, props.map.genres)
  return family ? families[family]!.color : 'var(--map-plain)'
}
const pieceClass = (piece: VenuePiece) => ({
  'venue-piece': true,
  'is-empty': !piece.circle,
  'is-dimmed': props.highlighted !== null && (!piece.circle || !props.highlighted.has(piece.circle.id)),
  'is-checked': piece.circle !== null && props.checked.has(piece.circle.id),
})

const spaceLabel = (piece: VenuePiece) => {
  const space = spaceById.value.get(piece.spaceId)
  const hall = space ? hallById.value.get(space.hallId) : null
  return [hall?.name, piece.circle?.space_code ?? (space ? `${space.area}-${space.number}` : '')].filter(Boolean).join(' · ')
}

// ── Zoom ────────────────────────────────────────────────────────────────
let behavior: ZoomBehavior<SVGSVGElement, unknown> | null = null
let current: ZoomTransform = zoomIdentity
const fitScale = ref(1)
let hintTimer: ReturnType<typeof setTimeout> | null = null
let observer: ResizeObserver | null = null
let placed = false
onBeforeUnmount(() => observer?.disconnect())

const contentBox = () => {
  const xs = props.map.halls.map(h => h.bbox)
  if (!xs.length) return [0, 0, props.map.width, props.map.height] as const
  const x0 = Math.min(...xs.map(b => b[0]))
  const y0 = Math.min(...xs.map(b => b[1]))
  const x1 = Math.max(...xs.map(b => b[0] + b[2]))
  const y1 = Math.max(...xs.map(b => b[1] + b[3]))
  return [x0 - 8, y0 - 22, x1 - x0 + 16, y1 - y0 + 30] as const
}

const transformFor = ([x, y, w, h]: readonly number[], padding = 0.92) => {
  const top = 56 // breadcrumb
  const k = Math.min(size.w / w!, (size.h - top) / h!) * padding
  return zoomIdentity.translate(size.w / 2 - k * (x! + w! / 2), top + (size.h - top) / 2 - k * (y! + h! / 2)).scale(k)
}

const apply = (target: ZoomTransform, duration = 650) => {
  if (!svg.value || !behavior) return
  const selection = select(svg.value)
  if (duration) selection.transition().duration(duration).call(behavior.transform, target)
  else selection.call(behavior.transform, target)
}

const showOverview = (duration = 650) => {
  currentHallId.value = null
  emit('hall', null)
  apply(transformFor(contentBox()), duration)
}

const focusHall = (hallId: number, duration = 650) => {
  const hall = hallById.value.get(hallId)
  if (!hall) return
  currentHallId.value = hallId
  emit('hall', hallId)
  apply(transformFor(hall.bbox, 0.96), duration)
}

const zoomBy = (factor: number) => {
  if (svg.value && behavior) select(svg.value).transition().duration(250).call(behavior.scaleBy, factor)
}

/** Brings a circle's booth into view, close enough to read the numbers around it. */
const focusCircle = (circleId: number, duration = 650) => {
  const piece = pieceOfCircle.value.get(circleId)
  const space = piece ? spaceById.value.get(piece.spaceId) : null
  if (!piece || !space) return false
  currentHallId.value = space.hallId
  emit('hall', space.hallId)
  apply(transformFor([piece.x + piece.w / 2 - 45, piece.y + piece.h / 2 - 30, 90, 60], 1), duration)
  return true
}

const hallNameSize = computed(() => Math.max(7, 14 / Math.max(fitScale.value, 0.5)))

onMounted(() => {
  if (!svg.value || !root.value) return
  observer = new ResizeObserver(([entry]) => {
    if (!entry) return
    size.w = Math.max(entry.contentRect.width, 1)
    size.h = Math.max(entry.contentRect.height, 1)
    fitScale.value = transformFor(contentBox()).k
    behavior?.scaleExtent([fitScale.value * 0.7, fitScale.value * 40])
    // The first size places the view; later resizes keep what the reader is looking at.
    if (!placed) {
      placed = true
      if (!initialFocus()) showOverview(0)
    }
  })
  observer.observe(root.value)

  behavior = zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.2, 60])
    .filter((event: Event) => {
      if (event.type === 'wheel') {
        const wheel = event as WheelEvent
        if (wheel.ctrlKey || wheel.metaKey || engaged.value) return true
        wheelHint.value = true
        if (hintTimer) clearTimeout(hintTimer)
        hintTimer = setTimeout(() => (wheelHint.value = false), 1100)
        return false
      }
      return (!(event as MouseEvent).ctrlKey || event.type === 'wheel') && !(event as MouseEvent).button
    })
    .on('zoom', (event: { transform: ZoomTransform }) => {
      current = event.transform
      scene.value?.setAttribute('transform', current.toString())
      detailed.value = current.k > fitScale.value * 3.2
      hide()
    })
  select(svg.value).call(behavior).on('dblclick.zoom', null)
  // Ctrl + wheel would also zoom the page in some browsers.
  svg.value.addEventListener('wheel', (event) => {
    if (event.ctrlKey || event.metaKey || engaged.value) event.preventDefault()
  }, { passive: false })
})

/** Opens the hall or booth the URL asks for (?hall=, ?circle=). Returns whether it did. */
const initialFocus = () => {
  if (props.selectedCircleId && focusCircle(props.selectedCircleId, 0)) return true
  const hall = Number(route.query.hall)
  if (hall && hallById.value.has(hall)) {
    focusHall(hall, 0)
    return true
  }
  return false
}

// ── Hover & click ───────────────────────────────────────────────────────
const hovered = shallowRef<VenuePiece | null>(null)
const hoverAnchor = shallowRef<Element | null>(null)
let hideTimer: ReturnType<typeof setTimeout> | null = null

const hide = () => {
  hovered.value = null
  hoverAnchor.value = null
}
const cancelHide = () => {
  if (hideTimer) clearTimeout(hideTimer)
  hideTimer = null
}
const scheduleHide = () => {
  cancelHide()
  hideTimer = setTimeout(hide, 140)
}

const pieceAt = (event: Event) => {
  const key = (event.target as Element | null)?.getAttribute?.('data-piece')
  return key ? pieces.value.get(key) ?? null : null
}

const onPointerMove = (event: PointerEvent) => {
  if (event.pointerType === 'touch' || event.buttons) return
  const piece = pieceAt(event)
  if (!piece) return scheduleHide()
  cancelHide()
  if (hovered.value?.key !== piece.key) {
    hovered.value = piece
    hoverAnchor.value = event.target as Element
  }
}

const openPiece = (piece: VenuePiece) => {
  if (piece.circle) emit('select', piece.circle.id)
}

const onClick = (event: MouseEvent) => {
  const piece = pieceAt(event)
  if (!piece) return
  event.stopPropagation()
  hide()
  openPiece(piece)
}

defineExpose({ focusCircle, focusHall, showOverview })
</script>

<style scoped>
/*
 * Map colours, from the theme tokens: the map follows the light and dark themes (the admin console shows it light).
 * The tokens for ink and lines are white or black at a fixed strength, so walls and grey areas keep their contrast
 * on the floor in either theme. Booths take their genre family's colour (utils/eventVenue.ts) in both.
 */
.venue-map {
  --map-floor: var(--card);
  --map-wall: var(--body);
  --map-shade: var(--line);
  --map-mid: var(--faint);
  --map-empty: var(--sunken);
  --map-plain: var(--meta);
  /* The checklist's gold star */
  --map-checked: var(--warning);
}
.venue-dot {
  fill: var(--line);
}
.venue-shadow {
  flood-color: var(--hero);
}
.venue-hall {
  fill: var(--map-floor);
  stroke: var(--line);
  stroke-width: 0.6;
  cursor: zoom-in;
  transition: stroke 0.2s;
}
.venue-hall:hover:not(.is-current) {
  stroke: var(--primary);
  stroke-width: 1.4;
}
.venue-hall.is-current {
  cursor: grab;
}
.venue-label {
  fill: var(--meta);
  font-weight: 500;
}
.venue-area-label {
  fill: var(--title);
  font-weight: 800;
}
.venue-hall-name {
  fill: var(--title);
  font-weight: 700;
  paint-order: stroke;
  /* A halo in the colour around the halls */
  stroke: var(--sunken);
  stroke-width: 3px;
}
.venue-piece {
  /* The seams between booths in the floor's colour */
  stroke: var(--map-floor);
  stroke-width: 0.35;
  cursor: pointer;
  transition: opacity 0.2s;
}
.venue-piece.is-empty {
  cursor: default;
  stroke: var(--line);
}
.venue-piece.is-dimmed {
  opacity: 0.16;
}
.venue-piece.is-checked {
  stroke: var(--map-checked);
  stroke-width: 1.1;
  opacity: 1;
}
.venue-numbers text {
  /* One number spans the whole desk, across the seam between halves (a/b) and thirds (x/y/z):
     white with a thin dark outline reads on the genre colours and on the seam alike, in both themes. */
  fill: var(--on-media);
  stroke: color-mix(in oklab, var(--hero) 55%, transparent);
  stroke-width: 0.45px;
  stroke-linejoin: round;
  paint-order: stroke;
  font-weight: 700;
  opacity: 0;
  transition: opacity 0.2s;
}
/* A desk with an empty part is mostly the empty booth's colour: the theme's ink instead, on a halo of the floor. */
.venue-numbers text.on-light {
  fill: var(--body);
  stroke: color-mix(in oklab, var(--map-floor) 90%, transparent);
}
.is-detailed .venue-numbers text {
  opacity: 1;
}
/* Filtering fades most booths towards the floor, so the numbers take the theme's ink over them. */
.is-filtered .venue-numbers text {
  fill: var(--body);
  stroke: color-mix(in oklab, var(--map-floor) 85%, transparent);
  opacity: 0;
}
.is-filtered.is-detailed .venue-numbers text {
  opacity: 0.8;
}
.venue-hover {
  fill: color-mix(in oklab, var(--on-media) 25%, transparent);
  stroke: var(--title);
  stroke-width: 0.9;
}
.venue-selected {
  fill: none;
  stroke: var(--title);
  stroke-width: 1.2;
}
.venue-selected-pulse {
  fill: none;
  stroke: var(--primary);
  stroke-width: 1.5;
  animation: venue-pulse 1.4s ease-out infinite;
  transform-box: fill-box;
  transform-origin: center;
}
@keyframes venue-pulse {
  from { opacity: 0.9; transform: scale(1); }
  to { opacity: 0; transform: scale(2.4); }
}
.venue-zoom-button {
  display: flex;
  height: 2.25rem;
  width: 2.25rem;
  align-items: center;
  justify-content: center;
  color: var(--body);
  transition: background-color 150ms ease-out, color 150ms ease-out;
}
.venue-zoom-button:hover {
  background: var(--ghost-hover);
  color: var(--primary);
}
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
