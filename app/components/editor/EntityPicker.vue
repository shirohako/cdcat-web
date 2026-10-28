<template>
  <div class="relative">
    <Search class="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-faint" aria-hidden="true" />
    <input
      ref="input"
      v-model="query"
      type="text"
      role="combobox"
      autocomplete="off"
      spellcheck="false"
      enterkeyhint="search"
      aria-autocomplete="list"
      class="input input-sm w-full pl-8 pr-8"
      :placeholder="placeholderText"
      :aria-label="placeholderText"
      :aria-expanded="expanded"
      :aria-controls="expanded ? listId : undefined"
      :aria-activedescendant="expanded && active >= 0 ? optionId(active) : undefined"
      @focus="open = true"
      @click="open = true"
      @input="open = true"
      @blur="open = false"
      @keydown="onKeydown"
    >
    <span class="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center">
      <Loader2 v-if="searching" class="m-1 h-3.5 w-3.5 animate-spin text-faint" aria-hidden="true" />
      <button
        v-else-if="query"
        type="button"
        tabindex="-1"
        class="flex h-6 w-6 items-center justify-center rounded-md bg-btn text-btn-content hover:bg-btn-hover ring-1 ring-inset ring-line shadow-xs transition active:translate-y-px"
        :aria-label="$t('common.clear')"
        @mousedown.prevent
        @click="clear"
      ><X :size="13" /></button>
    </span>

    <!-- Rendered on <body> so sections and dialogs with overflow-hidden don't clip it. -->
    <Teleport to="body">
      <div
        v-if="expanded"
        :id="listId"
        ref="panel"
        role="listbox"
        class="fixed z-[60] overflow-y-auto rounded-xl bg-popover py-1 shadow-overlay ring-1 ring-line"
        :style="panelStyle"
        @mousedown.prevent
      >
        <p v-if="term.length < 2" class="px-3 py-2 text-xs text-meta">{{ $t('catalog.form.search_min') }}</p>
        <p v-else-if="failed" class="px-3 py-2 text-xs text-danger">{{ $t('catalog.form.search_failed') }}</p>
        <p v-else-if="stale && !results.length" class="px-3 py-2 text-xs text-meta">{{ $t('catalog.form.searching') }}</p>
        <p v-else-if="!results.length" class="px-3 py-2 text-xs text-meta">{{ $t('catalog.form.no_results') }}</p>

        <template v-for="(option, index) in options" :key="option.kind === 'item' ? option.item.id : 'create'">
          <div
            v-if="option.kind === 'item'"
            :id="optionId(index)"
            role="option"
            :aria-selected="index === active"
            class="flex cursor-pointer items-center gap-2.5 px-3 py-1.5 transition-opacity"
            :class="[index === active ? 'bg-ghost-hover' : '', stale ? 'opacity-60' : '']"
            @mousemove="active = index"
            @click="choose(option)"
          >
            <img v-if="option.item.image_url" :src="option.item.image_url" alt="" class="h-8 w-8 shrink-0 rounded object-cover">
            <span v-else class="h-8 w-8 shrink-0 rounded bg-btn" />
            <span class="min-w-0 flex-1">
              <span class="flex min-w-0 items-center gap-1.5">
                <span class="truncate text-sm text-title">{{ option.item.label }}</span>
                <CatalogPendingBadge v-if="option.item.is_pending" />
              </span>
              <span v-if="option.item.subtitle" class="block truncate text-[11px] text-meta">{{ option.item.subtitle }}</span>
            </span>
            <span class="shrink-0 text-[11px] text-faint">#{{ option.item.id }}</span>
          </div>
          <div
            v-else
            :id="optionId(index)"
            role="option"
            :aria-selected="index === active"
            class="flex cursor-pointer items-center gap-2 border-t border-line px-3 py-2 text-sm text-primary"
            :class="{ 'bg-ghost-hover': index === active }"
            @mousemove="active = index"
            @click="choose(option)"
          >
            <Plus :size="14" class="shrink-0" /><span class="truncate">{{ $t(createLabel ?? 'editor.create_new', { name: option.name }) }}</span>
          </div>
        </template>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import type { EventOption } from '~/composables/useEventSearch'
import type { DatePrecision } from '~/types/entry'
import { Loader2, Plus, Search, X } from '@lucide/vue'

export type PickerKind = 'artist' | 'track' | 'entry' | 'album' | 'franchise' | 'event'

export interface PickedEntity {
  id: number
  label: string
  subtitle: string
  image_url: string | null
  /** The artist's or entry's type, e.g. game */
  type?: string | null
  /** A track's album */
  album_title?: string | null
  /** Awaiting review: still worth picking, so nobody enters it twice. */
  is_pending?: boolean
}

const props = defineProps<{
  kind: PickerKind
  placeholder?: string
  exclude?: Array<number | string | null>
  allowCreate?: boolean
  /** The i18n key of the "create" option, given `name`; "Create {name}" by default. */
  createLabel?: string
  /** Leave out content awaiting review (e.g. merge targets); editors include it by default. */
  excludePending?: boolean
}>()
const emit = defineEmits<{ select: [item: PickedEntity], create: [name: string] }>()

const { $api } = useNuxtApp()
const { t } = useI18n()
const { enumLabel, formatDate } = useCatalogDisplay()

const input = useTemplateRef<HTMLInputElement>('input')
const panel = useTemplateRef<HTMLElement>('panel')
const listId = useId()
const optionId = (index: number) => `${listId}-${index}`
const placeholderText = computed(() => props.placeholder ?? t('editor.search_placeholder'))

const query = ref('')
const open = ref(false)
const results = ref<PickedEntity[]>([])
/** The term the shown results belong to; while it differs from the typed one they are stale. */
const resultsFor = ref<string | null>(null)
const searching = ref(false)
const failed = ref(false)
const active = ref(-1)

const term = computed(() => query.value.trim())
const stale = computed(() => resultsFor.value !== term.value)
const expanded = computed(() => open.value && term.value.length > 0)

type Option = { kind: 'item', item: PickedEntity } | { kind: 'create', name: string }
const options = computed<Option[]>(() => {
  const list: Option[] = term.value.length < 2 ? [] : results.value.map(item => ({ kind: 'item', item }))
  // Offering "create" before the search has answered invites duplicates.
  if (props.allowCreate && term.value && (term.value.length < 2 || !stale.value)) list.push({ kind: 'create', name: term.value })
  return list
})

/** The fields the pickers read from the search endpoints' rows. */
interface Row {
  id: number
  name?: string
  title?: string
  type?: string | null
  image_url?: string | null
  catalog_prefixes?: string[]
  /** Site search results (tracks): album title and position */
  meta?: { album_title?: string, disc_number?: number | null, track_number?: number }
  catalog_number?: string | null
  release_date?: string | null
  release_date_precision?: DatePrecision | null
  parent?: { name: string } | null
  is_pending?: boolean
}
/** "Album title · 2-05": where a track is. */
const describeTrack = (row: Row) => {
  const number = row.meta?.track_number === undefined ? '' : [row.meta.disc_number, String(row.meta.track_number).padStart(2, '0')].filter(part => part !== null && part !== undefined).join('-')
  return [row.meta?.album_title, number].filter(Boolean).join(' · ')
}

/** Most kinds search their own list endpoint with `search`; tracks go through the site search, which takes `q`. */
const endpoints: Record<PickerKind, { url: string, key: string, param?: string, query?: Record<string, string>, map: (row: Row) => PickedEntity }> = {
  artist: { url: '/v1/artists', key: 'artists', map: row => ({ id: row.id, label: row.name ?? '', subtitle: [row.type ? enumLabel('artist_type', row.type) : null, (row.catalog_prefixes ?? []).join(', ')].filter(Boolean).join(' · '), image_url: row.image_url ?? null, type: row.type }) },
  track: { url: '/v1/search', key: 'results', param: 'q', query: { type: 'track' }, map: row => ({ id: row.id, label: row.title ?? '', subtitle: describeTrack(row), image_url: row.image_url ?? null, album_title: row.meta?.album_title ?? null }) },
  entry: { url: '/v1/entries', key: 'entries', map: row => ({ id: row.id, label: row.name ?? '', subtitle: [row.type ? enumLabel('entry_type', row.type) : null, formatDate(row.release_date, row.release_date_precision)].filter(Boolean).join(' · '), image_url: row.image_url ?? null, type: row.type }) },
  album: { url: '/v1/albums', key: 'albums', map: row => ({ id: row.id, label: row.title ?? '', subtitle: [row.catalog_number, formatDate(row.release_date, row.release_date_precision)].filter(Boolean).join(' · '), image_url: row.image_url ?? null }) },
  franchise: { url: '/v1/franchises', key: 'franchises', map: row => ({ id: row.id, label: row.name ?? '', subtitle: row.parent ? `↳ ${row.parent.name}` : '', image_url: row.image_url ?? null }) },
  event: { url: '/v1/events', key: 'events', map: row => ({ id: row.id, label: row.name ?? '', subtitle: describeEvent(row as unknown as EventOption), image_url: null }) },
}

// ---- searching ----

let timer: ReturnType<typeof setTimeout> | undefined
let requestId = 0

const search = async (value: string) => {
  const current = ++requestId
  searching.value = true
  try {
    const endpoint = endpoints[props.kind]
    const params = { [endpoint.param ?? 'search']: value, ...endpoint.query, per_page: 10, ...(props.excludePending || props.kind === 'event' ? {} : { include_pending: 1 }) }
    const data = await $api<Record<string, Row[]>>(endpoint.url, { query: params, progress: false })
    if (current !== requestId) return
    results.value = (data[endpoint.key] ?? [])
      .map(row => ({ ...endpoint.map(row), is_pending: row.is_pending ?? false }))
      .filter(item => !props.exclude?.includes(item.id))
    failed.value = false
  } catch {
    if (current !== requestId) return
    results.value = []
    failed.value = true
  } finally {
    if (current === requestId) {
      resultsFor.value = value
      searching.value = false
    }
  }
}

watch(term, (value) => {
  clearTimeout(timer)
  active.value = -1
  failed.value = false
  if (value.length < 2) {
    requestId++
    results.value = []
    resultsFor.value = null
    searching.value = false
    return
  }
  timer = setTimeout(() => search(value), 250)
})

// Fresh results highlight the first option, so Enter picks the best match as before.
watch(options, (list) => {
  if (!stale.value || term.value.length < 2) active.value = list.length ? 0 : -1
  else if (active.value >= list.length) active.value = -1
})

// ---- choosing ----

const reset = () => {
  clearTimeout(timer)
  requestId++
  query.value = ''
  results.value = []
  resultsFor.value = null
  searching.value = false
}

const choose = (option: Option) => {
  if (option.kind === 'item') emit('select', option.item)
  else emit('create', option.name)
  reset()
  // Focus stays here so the next one can be typed straight away; typing reopens the list.
  open.value = false
}

const clear = () => {
  reset()
  input.value?.focus()
}

const move = (step: number) => {
  open.value = true
  const count = options.value.length
  if (!count) return
  active.value = active.value < 0 ? (step > 0 ? 0 : count - 1) : (active.value + step + count) % count
}

const onKeydown = (event: KeyboardEvent) => {
  if (event.isComposing) return
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      move(1)
      break
    case 'ArrowUp':
      event.preventDefault()
      move(-1)
      break
    case 'Enter': {
      // Never submit the surrounding form from here.
      event.preventDefault()
      const option = expanded.value ? options.value[active.value] : undefined
      if (option) choose(option)
      break
    }
    case 'Escape':
      // Close the list first; dialogs listening for Escape only see the second press.
      if (expanded.value) {
        event.stopPropagation()
        open.value = false
      }
      else if (query.value) {
        event.stopPropagation()
        reset()
      }
      break
    case 'Tab':
      open.value = false
      break
  }
}

watch(active, async (index) => {
  if (index < 0) return
  await nextTick()
  document.getElementById(optionId(index))?.scrollIntoView({ block: 'nearest' })
})

// ---- placing the list ----

const panelStyle = ref<Record<string, string>>({})
const GAP = 4
const MARGIN = 8

/** Below the input, or above it when there's clearly more room there; never off-screen. */
const place = () => {
  const box = input.value?.getBoundingClientRect()
  if (!box) return
  const width = Math.min(Math.max(box.width, 256), window.innerWidth - MARGIN * 2)
  const left = Math.max(MARGIN, Math.min(box.left, window.innerWidth - width - MARGIN))
  const below = window.innerHeight - box.bottom - GAP - MARGIN
  const above = box.top - GAP - MARGIN
  const up = below < 240 && above > below
  panelStyle.value = {
    left: `${left}px`,
    width: `${width}px`,
    maxHeight: `${Math.max(120, Math.min(320, up ? above : below))}px`,
    ...(up ? { bottom: `${window.innerHeight - box.top + GAP}px` } : { top: `${box.bottom + GAP}px` }),
  }
}

let frame = 0
const schedulePlace = () => {
  cancelAnimationFrame(frame)
  frame = requestAnimationFrame(place)
}
const onScroll = (event: Event) => {
  // Scrolling the list itself doesn't move the input.
  if (panel.value && event.target instanceof Node && panel.value.contains(event.target)) return
  schedulePlace()
}

watch(expanded, (value) => {
  if (value) {
    place()
    window.addEventListener('scroll', onScroll, { capture: true, passive: true })
    window.addEventListener('resize', schedulePlace, { passive: true })
  }
  else {
    window.removeEventListener('scroll', onScroll, { capture: true })
    window.removeEventListener('resize', schedulePlace)
  }
})

onBeforeUnmount(() => {
  clearTimeout(timer)
  cancelAnimationFrame(frame)
  window.removeEventListener('scroll', onScroll, { capture: true })
  window.removeEventListener('resize', schedulePlace)
})
</script>
