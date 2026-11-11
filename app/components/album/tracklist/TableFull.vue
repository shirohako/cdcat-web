<script setup lang="ts">
import type { TracklistDisc, TracklistRow, TracklistTableColumn } from '~/utils/tracklistView'
import { ChevronLeft, ChevronRight } from '@lucide/vue'
import { tableLayout } from '~/utils/tracklistView'

/**
 * One disc of 表格 · 完整 (user design of 2026-11-11, picks B2 C2 D2 E1 F2). The number and title on the left and
 * the row's controls on the right (歌词 · ⋯ · ♥ · 时长) stay put; only the columns between them scroll sideways:
 * - a column per credit group on two tracks or more (tableLayout, worked out here, so only while this view shows), names only
 * - 其他人员 for the rest, a line of role tags and names per set held by the same people (参与人员 with no columns)
 * - then the tracks' attributes (BPM …) and ISRC
 * While columns are hidden on a side, they fade into that side's pinned edge, and ‹ › in the header move one
 * column at a time.
 *
 * The column header sticks under the disc header (or the navbar; `--tl-top` moves both, 0 in the full-screen
 * dialog). A table's header can't stick while the table scrolls sideways in a box of its own, so the header shown is
 * a copy above that box: it follows the box's scroll and takes its column widths from the table's own header, which
 * is there for the widths only, folded to no height once the copy has them (until then, as in the server render, it
 * is the header). The scrollbar works the same way: a bar of its own under the scrolling columns only, sticking to the
 * bottom of the window (or the dialog) while the table runs past it, and in step with the table both ways; the box's
 * own scrollbar is hidden then.
 *
 * On a narrow card each row turns into a block, in CSS alone: the number, title and controls on one line, then the
 * track's credits (a line per set of roles held by the same people), then its attributes.
 */
const props = withDefaults(defineProps<{
  disc: TracklistDisc
  /** Rows get their `track-{id}` anchors; off for a second copy, such as the full-screen dialog's */
  anchors?: boolean
}>(), { anchors: true })

const { t } = useI18n()

type Head = { key: string, class: string } & (
  | { kind: 'number' | 'title' | 'end' }
  | { kind: 'credit', column: TracklistTableColumn }
  | { kind: 'text', label: string }
)

const { roleOrder } = useCatalogSchema()
const layout = computed(() => tableLayout(props.disc.rows, roleOrder))
const hasOthers = computed(() => props.disc.rows.some(row => layout.value.others.get(row.id)?.length))
/** Whether anything sits between the pinned sides; without, the title takes the room and nothing is pinned. */
const scrolls = computed(() => Boolean(layout.value.columns.length || hasOthers.value || layout.value.attributes.length || layout.value.isrc))
const heads = computed((): Head[] => [
  { key: 'number', kind: 'number', class: 'c-number' },
  { key: 'title', kind: 'title', class: scrolls.value ? 'c-title' : 'c-title c-title-wide' },
  ...layout.value.columns.map(column => ({ key: `credit:${column.key}`, kind: 'credit' as const, column, class: 'c-credit' })),
  ...(hasOthers.value ? [{ key: 'others', kind: 'text' as const, label: t(layout.value.columns.length ? 'album.tracklist.columns.others' : 'album.tracklist.columns.people'), class: 'c-others' }] : []),
  ...layout.value.attributes.map(attribute => ({ key: `attribute:${attribute.key}`, kind: 'text' as const, label: attribute.label, class: 'c-info' })),
  ...(layout.value.isrc ? [{ key: 'isrc', kind: 'text' as const, label: 'ISRC', class: 'c-info' }] : []),
  { key: 'end', kind: 'end', class: 'c-end' },
])
/** ‹ › at the size of the row's ⋯ and heart */
const STEP_BUTTON = 'size-5! min-h-5! rounded-[0.3125rem]!'
const groupIn = (row: TracklistRow, key: string) => row.groups.find(group => group.key === key)
const attributeIn = (row: TracklistRow, key: string) => row.attributes.find(attribute => attribute.key === key)?.value ?? ''

// ── The header copy: the table's column widths, its scroll, and the edges with something hidden past them
const scroller = ref<HTMLElement | null>(null)
const table = ref<HTMLTableElement | null>(null)
const headBox = ref<HTMLElement | null>(null)
const bar = ref<HTMLElement | null>(null)
/** Where the box last put the bar's scroll */
let barSetTo = 0
const widths = shallowRef<number[] | null>(null)
const tableWidth = ref(0)
/** The box's visible width */
const boxWidth = ref(0)
const edges = reactive({ start: false, end: false })
const overflows = computed(() => edges.start || edges.end)

const sync = () => {
  const box = scroller.value
  if (!box) return
  if (headBox.value) headBox.value.scrollLeft = box.scrollLeft
  if (bar.value && Math.abs(bar.value.scrollLeft - box.scrollLeft) >= 1) {
    bar.value.scrollLeft = box.scrollLeft
    barSetTo = bar.value.scrollLeft
  }
  edges.start = box.scrollLeft > 1
  edges.end = box.scrollLeft < box.scrollWidth - box.clientWidth - 1
}

const measure = () => {
  const cells = table.value?.tHead?.rows[0]?.cells
  if (!table.value || !cells) return
  // Widths as laid out, not as drawn: a dialog opening scales its content for a moment, and the copy isn't scaled then
  const drawn = table.value.getBoundingClientRect().width
  const ratio = table.value.offsetWidth ? drawn / table.value.offsetWidth : 1
  const scale = Math.abs(ratio - 1) < 0.01 ? 1 : ratio
  const next = [...cells].map(cell => cell.getBoundingClientRect().width / scale)
  const width = drawn / scale
  if (width !== tableWidth.value || next.length !== widths.value?.length || next.some((value, index) => value !== widths.value![index])) {
    widths.value = next
    tableWidth.value = width
  }
  boxWidth.value = scroller.value?.clientWidth ?? 0
  void nextTick(sync)
}
const cellWidth = (index: number) => {
  const width = widths.value?.[index]
  return width ? { width: `${width}px`, minWidth: `${width}px`, maxWidth: `${width}px` } : undefined
}

/** The bar runs under the scrolling columns, between the pinned sides; its track is as long as theirs plus the scroll. */
const barBox = computed(() => {
  const list = widths.value
  if (!list || list.length < 3) return null
  const left = list[0]! + list[1]!
  const right = list.at(-1)!
  return { left, right, span: boxWidth.value - left - right + Math.max(0, tableWidth.value - boxWidth.value) }
})
/**
 * The bar moves the box only from a position the box didn't give it (barSetTo): the reader dragging the bar. A scroll
 * event comes a frame after the scroll, so the bar's event for a position the box gave it arrives once a smooth ‹ ›
 * scroll has moved the box on; taking it as the reader's set the box back and ended that scroll after a frame (user
 * report: ‹ › hardly moved).
 */
const onBarScroll = () => {
  if (!bar.value || !scroller.value || Math.abs(bar.value.scrollLeft - barSetTo) < 1) return
  barSetTo = bar.value.scrollLeft
  scroller.value.scrollLeft = bar.value.scrollLeft
}

let observer: ResizeObserver | undefined
onMounted(() => {
  measure()
  observer = new ResizeObserver(measure)
  if (table.value) observer.observe(table.value)
  if (scroller.value) observer.observe(scroller.value)
})
onBeforeUnmount(() => observer?.disconnect())
// New rows (a title language, a favourite) may move the columns without resizing the table
watch(() => props.disc, measure, { flush: 'post' })

/**
 * ‹ › turn a page of columns (user ask: one column a press was too slow), each lining up with the title's edge: › to
 * the first column not wholly in view, ‹ back to the first column that the visible width reaches from there, a single
 * column wider than the view one at a time; past the last, the end.
 */
const step = (direction: 1 | -1) => {
  const box = scroller.value
  const cells = table.value?.tHead?.rows[0]?.cells
  if (!box || !cells) return
  const columns = [...cells].filter(cell => cell.dataset.scrolls !== undefined)
  const start = columns[0]?.offsetLeft ?? 0
  const view = box.clientWidth - start - (cells[cells.length - 1]?.offsetWidth ?? 0)
  const at = box.scrollLeft
  const lefts = columns.map(cell => ({ left: cell.offsetLeft - start, right: cell.offsetLeft - start + cell.offsetWidth }))
  let left: number
  if (direction > 0) {
    const cut = lefts.find(column => column.right > at + view + 1 && column.left > at + 1)
    left = cut ? cut.left : box.scrollWidth
  } else {
    const back = lefts.find(column => column.left >= at - view - 1 && column.left < at - 1) ?? [...lefts].reverse().find(column => column.left < at - 1)
    left = back ? back.left : 0
  }
  box.scrollTo({ left, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
}

/** The copy doesn't scroll by itself: a sideways wheel or trackpad swipe over it scrolls the table. */
const onHeadWheel = (event: WheelEvent) => {
  const dx = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.shiftKey ? event.deltaY : 0
  if (!dx || !scroller.value || !overflows.value) return
  event.preventDefault()
  scroller.value.scrollLeft += dx
}
</script>

<template>
  <div class="tl-full" :class="{ 'is-measured': widths, 'has-start': edges.start, 'has-end': edges.end }">
    <!-- The header shown, sticking under the disc header: a copy of the table's own at its column widths -->
    <div v-if="widths" ref="headBox" class="tl-head sticky top-[calc(var(--tl-top,3.5rem)+var(--tl-disc-head,0px))] z-[9] overflow-hidden bg-card" @wheel="onHeadWheel">
      <table class="tl-table border-separate border-spacing-0 text-13 leading-5" :style="{ width: `${tableWidth}px`, tableLayout: 'fixed' }" role="presentation">
        <thead>
          <tr>
            <th v-for="(head, index) in heads" :key="head.key" :class="head.class" :style="cellWidth(index)" :aria-hidden="head.kind === 'end' ? undefined : 'true'">
              <!-- ‹ ›, 20px like the row's ⋯ and heart, only while there is more to a side; no 时长 (user ask) -->
              <div v-if="head.kind === 'end'" class="tl-th flex items-center justify-end gap-0.5">
                <template v-if="overflows">
                  <UiButton size="xs" :icon="ChevronLeft" icon-class="size-3" :label="t('album.tracklist.scroll_prev')" :disabled="!edges.start" :class="STEP_BUTTON" @click="step(-1)" />
                  <UiButton size="xs" :icon="ChevronRight" icon-class="size-3" :label="t('album.tracklist.scroll_next')" :disabled="!edges.end" :class="STEP_BUTTON" @click="step(1)" />
                </template>
              </div>
              <div v-else class="tl-th">
                <CatalogRoleTag v-if="head.kind === 'credit'" :label="head.column.label" :tip="head.column.tip" :category="head.column.category" />
                <template v-else-if="head.kind === 'number'">#</template>
                <template v-else-if="head.kind === 'title'">{{ t('album.tracklist.columns.title') }}</template>
                <template v-else-if="head.kind === 'text'">{{ head.label }}</template>
              </div>
            </th>
          </tr>
        </thead>
      </table>
    </div>

    <div
      ref="scroller"
      class="scrollbar-always overflow-x-auto overflow-y-hidden"
      :class="barBox && overflows && 'tl-no-bar'"
      role="region"
      :tabindex="overflows ? 0 : undefined"
      :aria-label="t('album.tracklist.scroll_area')"
      @scroll.passive="sync"
    >
      <table ref="table" class="tl-table w-full border-separate border-spacing-0 text-13 leading-5">
        <!-- For the column widths (and the header itself until the copy above has them) -->
        <thead class="tl-measure">
          <tr>
            <th v-for="head in heads" :key="head.key" :class="head.class" :data-scrolls="head.kind === 'credit' || head.kind === 'text' ? '' : undefined">
              <div class="tl-th">
                <CatalogRoleTag v-if="head.kind === 'credit'" :label="head.column.label" :tip="head.column.tip" :category="head.column.category" />
                <template v-else-if="head.kind === 'number'">#</template>
                <template v-else-if="head.kind === 'title'">{{ t('album.tracklist.columns.title') }}</template>
                <template v-else-if="head.kind === 'text'">{{ head.label }}</template>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in disc.rows" :id="anchors ? `track-${row.id}` : undefined" :key="row.id" :data-track-id="row.id" class="group scroll-mt-36">
            <td class="c-number">{{ row.number }}</td>
            <td :class="scrolls ? 'c-title' : 'c-title c-title-wide'">
              <AlbumTracklistTitle :row="row" class="font-medium" />
              <AlbumTracklistLabel v-if="row.instrumental" class="ml-1.5 align-[1px]">{{ t('content_display.instrumental') }}</AlbumTracklistLabel>
              <span v-if="row.subtitle || row.originals.length" class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-meta">
                <span v-if="row.subtitle" class="inline-flex items-center gap-1.5"><AlbumTracklistLabel size="md">{{ t('album.tracklist.original_title') }}</AlbumTracklistLabel>{{ row.subtitle }}</span>
                <span v-if="row.originals.length" class="inline-flex items-center gap-1.5"><AlbumTracklistLabel size="md">{{ t('album.tracklist.original_song') }}</AlbumTracklistLabel><AlbumTracklistOriginals :originals="row.originals" /></span>
              </span>
            </td>
            <td v-for="column in layout.columns" :key="column.key" class="c-credit text-title">
              <AlbumTracklistPeople v-if="groupIn(row, column.key)" :people="groupIn(row, column.key)!.people" stack class="pt-px" />
            </td>
            <td v-if="hasOthers" class="c-others text-title">
              <AlbumTracklistCreditLines v-if="layout.others.get(row.id)?.length" :credits="layout.others.get(row.id)!" />
            </td>
            <td v-for="attribute in layout.attributes" :key="attribute.key" class="c-info">{{ attributeIn(row, attribute.key) }}</td>
            <td v-if="layout.isrc" class="c-info font-mono">{{ row.isrc }}</td>
            <!-- The row's credits and attributes once rows turn into blocks; hidden in the table -->
            <td class="c-lines text-title">
              <AlbumTracklistCreditLines v-if="layout.lines.get(row.id)?.length" :credits="layout.lines.get(row.id)!" />
              <span v-if="row.attributes.length || row.isrc" class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-meta">
                <span v-for="attribute in row.attributes" :key="attribute.key" class="inline-flex items-center gap-1.5"><AlbumTracklistLabel size="md">{{ attribute.label }}</AlbumTracklistLabel>{{ attribute.value }}</span>
                <span v-if="row.isrc" class="inline-flex items-center gap-1.5"><AlbumTracklistLabel size="md">ISRC</AlbumTracklistLabel><span class="font-mono">{{ row.isrc }}</span></span>
              </span>
            </td>
            <td class="c-end">
              <span class="flex items-center justify-end gap-1">
                <AlbumTracklistLyrics :row="row" merged always />
                <AlbumTracklistMoreButton :row="row" always />
                <AlbumTracklistFavorite :row="row" always />
                <span class="-ml-0.5 min-w-[2.25em] text-right text-xs/5 tabular-nums" :class="row.duration ? 'text-meta' : 'text-faint'">{{ row.duration || '—' }}</span>
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- The scrollbar, sticking to the bottom of the window while the table runs past it: a strip the card's colour,
         the bar itself under the scrolling columns only -->
    <div v-if="barBox && overflows" class="tl-bar sticky bottom-0 z-[9] bg-card pt-0.5" :style="{ paddingLeft: `${barBox.left}px`, paddingRight: `${barBox.right}px` }">
      <div ref="bar" class="scrollbar-always overflow-x-auto overflow-y-hidden" aria-hidden="true" @scroll.passive="onBarScroll">
        <div class="h-px" :style="{ width: `${barBox.span}px` }" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.tl-table {
  --tl-row-hover: color-mix(in oklab, var(--card) 94%, black);
}

[data-theme="dark"] .tl-table {
  --tl-row-hover: color-mix(in oklab, var(--card) 93%, white);
}

.tl-table th {
  padding: 0.4375rem 0.5rem;
  border-bottom: 1px solid var(--line);
  --tl-cell: var(--card);
  background-color: var(--tl-cell);
  color: var(--meta);
  font-size: 0.6875rem;
  font-weight: 600;
  line-height: 1.125rem;
  text-align: left;
  vertical-align: middle;
  white-space: nowrap;
}

/* Every cell is opaque, so the columns pass under the pinned ones; the row's hover is a darker opaque card colour.
   --tl-cell is the cell's colour, for the pinned edges' fade. */
.tl-table td {
  --tl-cell: var(--card);
  padding: 0.5rem;
  border-bottom: 1px solid var(--line);
  background-color: var(--tl-cell);
  vertical-align: top;
  transition: background-color 150ms;
}

.tl-table tbody tr:last-child td {
  border-bottom: 0;
}

.tl-table tbody tr:hover td {
  --tl-cell: var(--tl-row-hover);
}

/* Pinned: the number and the title on the left, the row's controls on the right. */
.tl-table .c-number {
  position: sticky;
  left: 0;
  z-index: 2;
  width: 2.25rem;
  min-width: 2.25rem;
  max-width: 2.25rem;
  padding-left: 0.125rem;
  padding-right: 0.25rem;
}

.tl-table td.c-number {
  color: var(--meta);
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;
}

.tl-table .c-title {
  position: sticky;
  left: 2.25rem;
  z-index: 2;
  width: 13rem;
  min-width: 13rem;
  max-width: 13rem;
}

.tl-table .c-title-wide {
  position: static;
  width: auto;
  max-width: none;
}

.tl-table .c-end {
  position: sticky;
  right: 0;
  z-index: 2;
  width: 1px;
  padding-left: 0.375rem;
  padding-right: 0;
  white-space: nowrap;
}

/* The 22px lyrics button centred on the title's first line */
.tl-table td.c-end {
  padding-top: 0.4375rem;
}

.tl-table th.c-end {
  padding-block: 0.3125rem;
}

.tl-table .c-credit {
  min-width: 5.5rem;
}

.tl-table .c-others {
  min-width: 13rem;
}

.tl-table .c-info {
  white-space: nowrap;
}

.tl-table td.c-info {
  color: var(--body);
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;
}

.tl-table .c-lines {
  display: none;
}

/* While columns are hidden past a pinned side, they fade into it over 2.5rem in the row's own colour, nearly solid for
   the first third, then easing out, so a cut name tag dissolves rather than being sliced; no line (user pick B of the
   edge board, 2026-11-11: a line with a short fade looked smudged, and a dark shadow muddy on the dark card). Inside
   the cell's height: a pixel more would let the box scroll up and down too, and its scrollbar would narrow the rows
   but not the header copy. */
.tl-table .c-title::after,
.tl-table .c-end::before {
  content: "";
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2.5rem;
  pointer-events: none;
  opacity: 0;
  transition: opacity 200ms;
}

.tl-table .c-title::after {
  left: 100%;
  background: linear-gradient(to right, var(--tl-cell), color-mix(in oklab, var(--tl-cell) 70%, transparent) 35%, transparent);
}

.tl-table .c-end::before {
  right: 100%;
  background: linear-gradient(to left, var(--tl-cell), color-mix(in oklab, var(--tl-cell) 70%, transparent) 35%, transparent);
}

.has-start .tl-table .c-title::after,
.has-end .tl-table .c-end::before {
  opacity: 1;
}

.tl-table .c-title-wide::after {
  display: none;
}

/* The table's own header, once the copy has its widths: no height, still there for the widths and screen readers. */
.is-measured .tl-measure th {
  padding-block: 0;
  border-bottom-width: 0;
}

.is-measured .tl-measure .tl-th {
  height: 0;
  overflow: hidden;
}

/* The box's own scrollbar while the sticking bar stands in for it */
.tl-no-bar {
  scrollbar-width: none;
}

.tl-no-bar::-webkit-scrollbar {
  display: none;
}

@media (prefers-reduced-motion: reduce) {
  .tl-table td,
  .tl-table .c-title::after,
  .tl-table .c-end::before {
    transition: none;
  }
}

/* A narrow card: each row becomes a block, the number, title and controls on its first line and the track's credits
   and attributes under the title, a line per set of roles held by the same people. */
@container (max-width: 40rem) {
  .tl-head,
  .tl-bar,
  .tl-table thead {
    display: none;
  }

  .tl-table tbody {
    display: block;
  }

  .tl-table tr {
    display: grid;
    grid-template-columns: 1.5rem minmax(0, 1fr) auto;
    column-gap: 0.5rem;
    padding-block: 0.5rem;
    border-bottom: 1px solid var(--line);
    transition: background-color 150ms;
  }

  .tl-table tr:last-child {
    border-bottom: 0;
  }

  .tl-table tbody tr:hover {
    background-color: var(--tl-row-hover);
  }

  .tl-full .tl-table tbody tr td {
    display: block;
    position: static;
    width: auto;
    min-width: 0;
    max-width: none;
    padding: 0;
    border: 0;
    background: none;
  }

  .tl-full .tl-table td.c-number {
    grid-column: 1;
    grid-row: 1;
    line-height: 1.5rem;
  }

  .tl-full .tl-table td.c-title {
    grid-column: 2;
    grid-row: 1;
    line-height: 1.5rem;
  }

  .tl-full .tl-table td.c-end {
    grid-column: 3;
    grid-row: 1;
    padding-top: 0.0625rem;
  }

  .tl-full .tl-table td.c-credit,
  .tl-full .tl-table td.c-others,
  .tl-full .tl-table td.c-info {
    display: none;
  }

  .tl-full .tl-table td.c-lines {
    grid-column: 2 / -1;
    margin-top: 0.25rem;
  }

  .tl-full .tl-table td.c-lines:empty {
    display: none;
  }

  .tl-table .c-title::after,
  .tl-table .c-end::before {
    display: none;
  }
}
</style>
