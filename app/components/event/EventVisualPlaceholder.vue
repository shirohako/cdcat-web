<script setup lang="ts">
/**
 * Stands in for an event's missing main visual: a ticket on a wash of the theme colour, with CD grooves behind it.
 * The event code is set large on the ticket with the date under it, and the stub carries a barcode drawn from the
 * code, so no two events look quite alike. Portrait (5:7) or landscape (16:9), to match the series' visuals; it
 * draws with the theme tokens, so it follows the theme colour and dark mode.
 */
const props = defineProps<{
  code: string
  date?: string
  landscape?: boolean
}>()

const id = useId()
const label = computed(() => props.code.toUpperCase())

// Portrait 100 × 140, landscape 160 × 90: the ticket, where it tears, and the room the code has.
const layout = computed(() => props.landscape
  ? { width: 160, height: 90, ticket: { x: 14, y: 12, w: 132, h: 66 }, tear: 110, codeX: 62, codeY: 54, codeRoom: 78 }
  : { width: 100, height: 140, ticket: { x: 14, y: 16, w: 72, h: 108 }, tear: 94, codeX: 50, codeY: 66, codeRoom: 60 })

// Bold capitals and digits run up to about 0.7em wide; long codes shrink to fit.
const codeSize = computed(() => Math.min(props.landscape ? 18 : 20, layout.value.codeRoom / (label.value.length * 0.7)))

/** A barcode that only depends on the code: bar and gap widths from a small hash, filling the stub. */
const bars = computed(() => {
  let seed = 7
  for (const char of props.code) seed = (seed * 31 + char.charCodeAt(0)) >>> 0
  const next = () => {
    seed = (seed * 1103515245 + 12345) >>> 0
    return (seed >>> 16) / 65536
  }
  const { ticket, tear } = layout.value
  // Portrait: across the stub under the tear. Landscape: across the stub right of it.
  const [start, end] = props.landscape ? [tear + 7, ticket.x + ticket.w - 7] : [ticket.x + 10, ticket.x + ticket.w - 10]
  const result: { at: number, size: number }[] = []
  for (let at = start; at < end;) {
    const size = Math.min(0.6 + next() * 1.6, end - at)
    result.push({ at: Math.round(at * 100) / 100, size: Math.round(size * 100) / 100 })
    at += size + 0.7 + next() * 1.1
  }
  return result
})

const RINGS = [18, 30, 42, 54, 66, 78]

/** The two notches where the ticket tears, cut out by the mask and outlined inside the ticket. */
const notches = computed(() => {
  const { ticket, tear } = layout.value
  return props.landscape
    ? [{ x: tear, y: ticket.y }, { x: tear, y: ticket.y + ticket.h }]
    : [{ x: ticket.x, y: tear }, { x: ticket.x + ticket.w, y: tear }]
})
</script>

<template>
  <svg :viewBox="`0 0 ${layout.width} ${layout.height}`" class="size-full" role="img" :aria-label="label">
    <defs>
      <mask :id="`${id}-ticket`">
        <rect :x="layout.ticket.x" :y="layout.ticket.y" :width="layout.ticket.w" :height="layout.ticket.h" rx="6" fill="#fff" />
        <circle v-for="(notch, index) in notches" :key="index" :cx="notch.x" :cy="notch.y" r="4.5" fill="#000" />
      </mask>
      <clipPath :id="`${id}-inside`">
        <rect :x="layout.ticket.x" :y="layout.ticket.y" :width="layout.ticket.w" :height="layout.ticket.h" />
      </clipPath>
    </defs>

    <rect :width="layout.width" :height="layout.height" class="fill-primary/10" />
    <g fill="none" class="stroke-primary/20" stroke-width="0.6">
      <circle v-for="r in RINGS" :key="r" :cx="layout.width" cy="0" :r="r" />
    </g>

    <g :mask="`url(#${id}-ticket)`">
      <rect :x="layout.ticket.x" :y="layout.ticket.y" :width="layout.ticket.w" :height="layout.ticket.h" class="fill-card" />
      <rect
        :x="layout.ticket.x + 0.4"
        :y="layout.ticket.y + 0.4"
        :width="layout.ticket.w - 0.8"
        :height="layout.ticket.h - 0.8"
        rx="5.6"
        fill="none"
        class="stroke-primary/35"
        stroke-width="0.8"
      />
    </g>
    <g :clip-path="`url(#${id}-inside)`" fill="none" class="stroke-primary/35" stroke-width="0.8">
      <circle v-for="(notch, index) in notches" :key="index" :cx="notch.x" :cy="notch.y" r="4.5" />
    </g>

    <line
      v-if="landscape"
      :x1="layout.tear" :y1="layout.ticket.y + 6" :x2="layout.tear" :y2="layout.ticket.y + layout.ticket.h - 6"
      class="stroke-primary/40" stroke-width="0.8" stroke-dasharray="2 2"
    />
    <line
      v-else
      :x1="layout.ticket.x + 6" :y1="layout.tear" :x2="layout.ticket.x + layout.ticket.w - 6" :y2="layout.tear"
      class="stroke-primary/40" stroke-width="0.8" stroke-dasharray="2 2"
    />

    <!-- A small disc above the code. -->
    <g :transform="`translate(${layout.codeX} ${layout.codeY - codeSize - 9})`">
      <circle r="6" class="fill-primary" />
      <circle r="3.6" fill="none" class="stroke-card/40" stroke-width="0.5" />
      <circle r="1.6" class="fill-card" />
    </g>

    <text
      :x="layout.codeX" :y="layout.codeY"
      text-anchor="middle" :font-size="codeSize" font-weight="800" letter-spacing="0.02em"
      class="fill-primary-strong"
    >{{ label }}</text>
    <text
      v-if="date"
      :x="layout.codeX" :y="layout.codeY + 11"
      text-anchor="middle" font-size="6" font-weight="600" letter-spacing="0.04em"
      class="fill-meta tabular-nums"
    >{{ date }}</text>

    <g class="fill-primary/55">
      <template v-if="landscape">
        <rect v-for="bar in bars" :key="bar.at" :x="bar.at" :y="layout.ticket.y + 14" :width="bar.size" :height="layout.ticket.h - 28" />
      </template>
      <template v-else>
        <rect v-for="bar in bars" :key="bar.at" :x="bar.at" :y="layout.tear + 8" :width="bar.size" height="15" />
      </template>
    </g>
  </svg>
</template>
