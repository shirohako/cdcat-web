<template>
  <figure ref="root" class="teardown">
    <div
      ref="stage"
      :class="['td-stage', { 'is-live': live }]"
      :style="{ aspectRatio: `${viewBox[2]} / ${viewBox[3]}`, '--td-unit': unit }"
      role="img"
      :aria-label="title"
    >
      <!-- One wrapper fades the drawing in: the layers themselves get reordered, which would restart an animation. -->
      <div v-if="data" class="td-drawing">
        <!-- Assembly trails first: the parts' layers cover them wherever a part is in front. -->
        <svg class="td-sheet" :viewBox="viewBox.join(' ')" aria-hidden="true">
          <line v-for="(trail, i) in trails" :key="i" class="td-line td-axis td-trail" v-bind="trail" />
        </svg>

        <!-- Every part (and a container's front walls) on a layer of its own, slid with a transform: moving them
             never repaints the drawing. Their order is the painting order. -->
        <svg
          v-for="layer in layers"
          :key="layer.key"
          class="td-layer"
          :viewBox="layer.extent.join(' ')"
          :style="layerStyle(layer)"
          aria-hidden="true"
        >
          <g v-if="layer.kind === 'part'" :class="['td-part', `td-${layer.part.id}`, { 'td-glass': layer.part.glass }]">
            <path v-if="layer.part.fill" class="td-fill" :d="layer.part.fill" :style="{ fill: toneOf(layer.part.id) }" />
            <template v-for="(overlay, i) in layer.part.overlays" :key="i">
              <path
                v-for="(d, j) in overlay.paths"
                :key="j"
                :class="overlay.kind === 'arcs' ? ['td-arc', `td-arc-${j % 4}`] : j ? 'td-hole' : 'td-label'"
                :d="d"
              />
            </template>
            <g :id="`${uid}-${layer.part.id}-lines`">
              <path v-for="(d, role) in layer.part.lines" :key="role" :class="['td-line', `td-${role}`]" :d="d" />
            </g>
          </g>
          <g v-else :class="`td-${layer.skirt.of}`">
            <clipPath :id="`${uid}-${layer.skirt.of}-front`">
              <path :d="layer.skirt.fill" />
            </clipPath>
            <path class="td-fill" :d="layer.skirt.fill" :style="{ fill: toneOf(layer.skirt.of) }" />
            <use :href="`#${uid}-${layer.skirt.of}-lines`" :clip-path="`url(#${uid}-${layer.skirt.of}-front)`" />
          </g>
        </svg>

        <svg
          v-if="data.assembled && assembledOpacity > 0"
          class="td-sheet"
          :viewBox="viewBox.join(' ')"
          :style="{ opacity: assembledOpacity }"
          aria-hidden="true"
        >
          <path v-for="(f, i) in data.assembled.fills" :key="i" class="td-fill" :d="f.d" :style="{ fill: toneOf(f.part) }" />
          <g v-for="item in data.assembled.lines" :key="item.part" :class="[`td-${item.part}`, { 'td-glass': parts.get(item.part)?.glass }]">
            <path v-for="(d, role) in item.lines" :key="role" :class="['td-line', `td-${role}`]" :d="d" />
          </g>
        </svg>

        <svg :class="['td-sheet', 'td-leaders', { 'is-on': labelsOn }]" :viewBox="viewBox.join(' ')" aria-hidden="true">
          <g v-for="label in placed" :key="label.anchor">
            <line :x1="label.from[0]" :y1="label.from[1]" :x2="label.at[0]" :y2="label.at[1]" />
            <circle :cx="label.from[0]" :cy="label.from[1]" r="1.4" />
          </g>
        </svg>
      </div>

      <span
        v-for="(label, i) in placed"
        :key="label.anchor"
        :class="['td-sticker', 'td-placed', `td-tone-${label.tone}`, `td-${label.align}`, { 'is-on': labelsOn }]"
        :style="{ left: `${label.left}%`, top: `${label.top}%`, '--td-turn': `${TURNS[i % TURNS.length]}deg`, transitionDelay: labelsOn ? `${i * 70}ms` : '0ms' }"
        aria-hidden="true"
      >{{ label.text }}</span>
      <slot name="overlay" :on="labelsOn" :at="at" />
    </div>

    <!-- Phones: the same stickers in a row under the drawing, which is too small to label in place. -->
    <ul v-if="placed.length" class="td-legend" aria-hidden="true">
      <li
        v-for="(label, i) in placed"
        :key="label.anchor"
        :class="['td-sticker', `td-tone-${label.tone}`, { 'is-on': labelsOn }]"
        :style="{ '--td-turn': `${(TURNS[i % TURNS.length] ?? 0) / 2}deg`, transitionDelay: labelsOn ? `${i * 50}ms` : '0ms' }"
      >
        {{ label.text }}
      </li>
    </ul>
  </figure>
</template>

<script setup lang="ts">
import type { TeardownData, TeardownLabel, TeardownLayer, TeardownTone } from '~/utils/teardown'

/**
 * One of the home page's exploded drawings (utils/teardown.ts). It loads in the browser and, while on screen, plays
 * on a loop: it comes apart, holds still with its parts' English name stickers showing, goes back together, rests,
 * and starts again. Off screen it pauses where it is. Without motion it simply shows the device apart, labelled.
 */
const props = withDefaults(defineProps<{
  device: string
  /** The visible window in the drawing's units, room for the stickers included. */
  viewBox: [number, number, number, number]
  tones: Record<string, TeardownTone>
  labels?: TeardownLabel[]
  /** The accessible name of the picture. */
  title: string
}>(), { labels: () => [] })

defineSlots<{
  /**
   * HTML over the drawing, such as the mascot or a speech bubble. `on` while the stickers show; `at(part, point)`
   * places an element at a point of the apart drawing belonging to a part, wherever that part is now (left and top
   * in %, plus a transform, so it moves without layout). Anything that moves or animates belongs here rather than
   * in the SVG, where it would make the drawing repaint.
   */
  overlay?: (props: { on: boolean, at: (part: string, point: [number, number]) => { left: string, top: string, transform: string } }) => unknown
}>()

const TURNS = [-4, 3, -2, 4, -3, 2, -1]
/** One loop, in ms: coming apart, held apart (stickers showing), going back together, held together. */
const APART = 1800
const OPEN = 4600
const TOGETHER = 1500
const CLOSED = 1300
const LOOP = APART + OPEN + TOGETHER + CLOSED

const uid = `td-${props.device}-${useId().replace(/[^\w-]/g, '')}`
const root = ref<HTMLElement>()
const stage = ref<HTMLElement>()
const data = shallowRef<TeardownData | null>(null)
const t = ref(0)
const labelsOn = ref(false)
/** Playing on screen: the layers are promoted only then. */
const live = ref(false)
/** Drawing units per CSS pixel, for stroke widths in pixels at any size. */
const unit = ref(0.5)

const progress = computed(() => (data.value ? partProgress(data.value, t.value) : new Map<string, number>()))
const layers = computed(() => (data.value ? layersAt(data.value, progress.value) : []))
const parts = computed(() => new Map((data.value?.parts ?? []).map(p => [p.id, p])))
const assembledOpacity = computed(() => (data.value?.assembled ? 1 - Math.min(1, t.value / 0.05) : 0))

const toneOf = (id: string) => `var(--td-${props.tones[id] ?? 'white'})`
const offsetOf = (id: string): [number, number] => {
  const part = parts.value.get(id)
  return part ? moved([0, 0], part.shift, progress.value.get(id) ?? 0) : [0, 0]
}

/** A layer placed over the stage by its extent and slid by its part's offset, both as fractions of its own box. */
function layerStyle(layer: TeardownLayer) {
  const [x0, y0, w, h] = props.viewBox
  const [x, y, lw, lh] = layer.extent
  const [dx, dy] = offsetOf(layer.kind === 'part' ? layer.part.id : layer.skirt.of)
  return {
    left: `${((x - x0) / w) * 100}%`,
    top: `${((y - y0) / h) * 100}%`,
    width: `${(lw / w) * 100}%`,
    height: `${(lh / h) * 100}%`,
    transform: dx || dy ? `translate(${((dx / lw) * 100).toFixed(3)}%, ${((dy / lh) * 100).toFixed(3)}%)` : undefined,
    opacity: data.value?.assembled ? 1 - assembledOpacity.value : undefined
  }
}

const trails = computed(() => (data.value?.trails ?? []).map((trail) => {
  const a = trail.from ? offsetOf(trail.from) : [0, 0], b = trail.to ? offsetOf(trail.to) : [0, 0]
  return { x1: trail.a[0] + a[0]!, y1: trail.a[1] + a[1]!, x2: trail.b[0] + b[0]!, y2: trail.b[1] + b[1]! }
}).filter(l => Math.hypot(l.x2 - l.x1, l.y2 - l.y1) > 1))

const at = (part: string, [x, y]: [number, number]) => {
  const p = parts.value.get(part), [x0, y0, w, h] = props.viewBox
  const [dx, dy] = p ? offsetOf(part) : [0, 0], [sx, sy] = p?.shift ?? [0, 0]
  return {
    left: `${((x - x0) / w) * 100}%`,
    top: `${((y - y0) / h) * 100}%`,
    transform: `translate(${((dx - sx) / unit.value).toFixed(1)}px, ${((dy - sy) / unit.value).toFixed(1)}px)`
  }
}

const placed = computed(() => {
  const [x0, y0, w, h] = props.viewBox
  return props.labels.flatMap((label) => {
    const anchor = data.value?.anchors[label.anchor]
    if (!anchor) return []
    const [dx, dy] = offsetOf(anchor.part)
    return [{
      ...label,
      from: [anchor.at[0] + dx, anchor.at[1] + dy] as [number, number],
      left: ((label.at[0] - x0) / w) * 100,
      top: ((label.at[1] - y0) / h) * 100
    }]
  })
})

// The loop's clock starts just before its end, so a device first rests assembled for a moment, then comes apart.
let clock = LOOP - 500
let last = 0
let frame = 0
let observer: IntersectionObserver | undefined
let sizer: ResizeObserver | undefined

function show(c: number) {
  if (c < APART) {
    t.value = c / APART
    labelsOn.value = false
  } else if (c < APART + OPEN) {
    t.value = 1
    labelsOn.value = true
  } else if (c < APART + OPEN + TOGETHER) {
    t.value = 1 - (c - APART - OPEN) / TOGETHER
    labelsOn.value = false
  } else {
    t.value = 0
  }
}

function tick(now: number) {
  // A long gap (a busy page, a background tab) moves the loop on by one frame, never by a jump.
  if (last) clock = (clock + Math.min(now - last, 50)) % LOOP
  last = now
  show(clock)
  frame = requestAnimationFrame(tick)
}

function resume() {
  if (frame) return
  last = 0
  live.value = true
  frame = requestAnimationFrame(tick)
}

function pause() {
  if (frame) cancelAnimationFrame(frame)
  frame = 0
  live.value = false
}

onMounted(async () => {
  sizer = new ResizeObserver(([entry]) => {
    if (entry?.contentRect.width) unit.value = props.viewBox[2] / entry.contentRect.width
  })
  if (stage.value) sizer.observe(stage.value)
  try {
    data.value = await loadTeardown(props.device)
  } catch {
    return
  }
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    t.value = 1
    labelsOn.value = true
    return
  }
  show(clock)
  observer = new IntersectionObserver(([entry]) => (entry?.isIntersecting ? resume() : pause()), { threshold: 0.15 })
  if (root.value) observer.observe(root.value)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  sizer?.disconnect()
  pause()
})
</script>

<style scoped>
/* Fixed colours: the pastel parts and navy ink look the same in both themes (the user's 夜色贴纸 for dark); only what
   is drawn straight on the page (see-through parts, trails, leaders) turns light in dark. */
.teardown {
  --td-ink: #1d2444;
  --td-glass: #1d2444;
  --td-trail: #1d2444;
  --td-leader: #1d2444;
  --td-record-ink: #c9cfe6;
  --td-pink: #f7c3d0;
  --td-butter: #fde7a4;
  --td-mint: #bfe7d2;
  --td-sky: #bcd8f6;
  --td-lilac: #d8cff6;
  --td-coral: #ffb7a5;
  --td-silver: #e8ecf2;
  --td-white: #ffffff;
  --td-night: #2a3150;
  margin: 0;
  width: 100%;
}

[data-theme="dark"] .teardown {
  --td-glass: #e8ebf7;
  --td-trail: #8c94b6;
  --td-leader: #c9cfe6;
}

.td-stage { position: relative; }

.td-drawing {
  position: absolute;
  inset: 0;
  animation: td-appear 0.4s ease-out;
}

.td-sheet,
.td-layer {
  position: absolute;
  display: block;
  overflow: visible;
}

.td-sheet {
  inset: 0;
  width: 100%;
  height: 100%;
}

.is-live .td-layer { will-change: transform; }

.td-line {
  fill: none;
  stroke: var(--td-ink);
  stroke-linecap: round;
  stroke-linejoin: round;
}

/* Widths in CSS pixels: --td-unit is drawing units per pixel at the figure's current size. */
.td-outline { stroke-width: calc(1.6 * var(--td-unit)); }
.td-edge { stroke-width: calc(1 * var(--td-unit)); }
.td-detail { stroke-width: calc(0.75 * var(--td-unit)); }
.td-texture { stroke-width: calc(0.55 * var(--td-unit)); }
.td-axis {
  stroke-width: calc(0.7 * var(--td-unit));
  stroke-dasharray: calc(9 * var(--td-unit)) calc(2.5 * var(--td-unit)) calc(2 * var(--td-unit)) calc(2.5 * var(--td-unit));
  stroke-linecap: butt;
}
.td-trail { stroke: var(--td-trail); }
.td-glass .td-line { stroke: var(--td-glass); }
.td-record .td-line { stroke: var(--td-record-ink); }

.td-arc { fill: none; stroke-width: 1.1; stroke-linecap: round; }
.td-arc-0 { stroke: #f4a9bc; }
.td-arc-1 { stroke: #f6d27a; }
.td-arc-2 { stroke: #9ad7b8; }
.td-arc-3 { stroke: #9cc3ef; }
.td-label { fill: var(--td-pink); stroke: var(--td-ink); stroke-width: 0.45; }
.td-hole { fill: var(--td-white); stroke: var(--td-ink); stroke-width: 0.3; }

.td-leaders line {
  stroke: var(--td-leader);
  stroke-width: var(--td-unit);
  stroke-dasharray: calc(2 * var(--td-unit)) calc(3 * var(--td-unit));
  stroke-linecap: round;
}

.td-leaders circle {
  fill: #ffffff;
  stroke: var(--td-ink);
  stroke-width: var(--td-unit);
}

.td-leaders { opacity: 0; transition: opacity 0.3s ease-out; }
.td-leaders.is-on { opacity: 1; }

/* Label-maker tape: English part names in monospace capitals, tilted a little. */
.td-sticker {
  position: absolute;
  z-index: 1;
  padding: 0.2rem 0.45rem;
  border: 1px solid var(--td-ink);
  border-radius: 0.25rem;
  color: var(--td-ink);
  font-family: var(--font-mono);
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  line-height: 1.2;
  text-transform: uppercase;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transform: translate(var(--td-x), -50%) rotate(var(--td-turn)) scale(0.8);
  transition: opacity 0.25s ease-out, transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.td-sticker.is-on {
  opacity: 1;
  transform: translate(var(--td-x), -50%) rotate(var(--td-turn)) scale(1);
}

.td-start { --td-x: 0%; }
.td-center { --td-x: -50%; }
.td-end { --td-x: -100%; }

.td-tone-pink { background: var(--td-pink); }
.td-tone-butter { background: var(--td-butter); }
.td-tone-mint { background: var(--td-mint); }
.td-tone-sky { background: var(--td-sky); }
.td-tone-lilac { background: var(--td-lilac); }
.td-tone-coral { background: var(--td-coral); }
.td-tone-silver { background: var(--td-silver); }
.td-tone-white { background: var(--td-white); }

.td-legend {
  display: none;
  flex-wrap: wrap;
  gap: 0.5rem 0.4rem;
  margin: 0.75rem 0 0;
  padding: 0;
  list-style: none;
}

.td-legend .td-sticker {
  position: static;
  transform: rotate(var(--td-turn)) scale(0.8);
}

.td-legend .td-sticker.is-on { transform: rotate(var(--td-turn)); }

@media (max-width: 639px) {
  .td-placed,
  .td-leaders { display: none; }
  .td-legend { display: flex; }
  .td-outline { stroke-width: calc(1.25 * var(--td-unit)); }
  .td-edge { stroke-width: calc(0.8 * var(--td-unit)); }
  .td-detail { stroke-width: calc(0.6 * var(--td-unit)); }
  .td-texture { stroke-width: calc(0.45 * var(--td-unit)); }
}

@keyframes td-appear {
  from { opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .td-drawing { animation: none; }
  .td-sticker,
  .td-leaders { transition: none; }
}
</style>
