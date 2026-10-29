<script setup lang="ts">
import type { EventOption } from '~/composables/useEventSearch'

/**
 * The event filter of a list page's filter bar, as a two-level menu: event series on the left (latest held first),
 * the editions of the one pointed at or clicked on the right, newest first under year headings, each with its date
 * and how many albums came out there. On phones the two levels take turns, with a way back. No search: the series
 * are few and the editions are in order. The chip takes the bar's chip classes; chosen, it names the edition and
 * gets a ×.
 */
const props = defineProps<{
  modelValue: number | null
  label: string
  activeClass: string
  idleClass: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number | null]
}>()

interface Series { id: number, name: string, events_count: number, latest_start_date: string | null }
interface Edition { id: number, name: string, start_date: string | null, released_albums_count?: number }

const { t } = useI18n()
const { $api } = useNuxtApp()
const { selected } = useEventLookup(toRef(props, 'modelValue'))

const open = ref(false)
const series = ref<Series[] | null>(null)
const seriesFailed = ref(false)
const activeId = ref<number | null>(null)
/** Phones show one level at a time. */
const pane = ref<'series' | 'editions'>('series')

// Editions per series, loaded the first time a series is pointed at; all pages, as a series has a hundred or so.
const editions = reactive(new Map<number, Edition[] | 'loading' | 'failed'>())
const loadEditions = async (id: number) => {
  if (editions.has(id) && editions.get(id) !== 'failed') return
  editions.set(id, 'loading')
  try {
    const all: Edition[] = []
    for (let page = 1; ; page++) {
      const data = await $api<{ events: Edition[], pagination: { last_page: number } }>('/v1/events', {
        query: { series_id: id, per_page: 100, page, sort: 'start_date', direction: 'desc' },
      })
      all.push(...data.events)
      if (page >= data.pagination.last_page) break
    }
    editions.set(id, all)
  } catch {
    editions.set(id, 'failed')
  }
}

const loadSeries = async () => {
  if (series.value) return
  seriesFailed.value = false
  try {
    const { event_series: list } = await $api<{ event_series: Series[] }>('/v1/event-series')
    series.value = [...list].sort((a, b) => (b.latest_start_date ?? '').localeCompare(a.latest_start_date ?? ''))
  } catch {
    seriesFailed.value = true
  }
}

const activate = (id: number) => {
  activeId.value = id
  void loadEditions(id)
}

// Opening shows the chosen edition's series, or the latest held one.
watch(open, async (value) => {
  if (!value) return
  pane.value = props.modelValue ? 'editions' : 'series'
  await loadSeries()
  const id = selected.value?.series?.id ?? series.value?.[0]?.id
  if (id) activate(id)
})

// Pointing at a series opens its editions after a moment, so a pointer crossing the list on its way right doesn't
// flick through every one; a click opens them at once.
let hoverTimer: ReturnType<typeof setTimeout> | undefined
const hover = (id: number) => {
  clearTimeout(hoverTimer)
  hoverTimer = setTimeout(() => activate(id), 90)
}
const unhover = () => clearTimeout(hoverTimer)
const pick = (id: number) => {
  clearTimeout(hoverTimer)
  activate(id)
  pane.value = 'editions'
}
onBeforeUnmount(() => clearTimeout(hoverTimer))

const activeSeries = computed(() => series.value?.find(item => item.id === activeId.value) ?? null)
const activeEditions = computed(() => (activeId.value ? editions.get(activeId.value) : undefined))
/** The active series' editions under year headings, newest first. */
const years = computed(() => {
  const list = activeEditions.value
  if (!Array.isArray(list)) return []
  const groups: { year: string, editions: Edition[] }[] = []
  for (const edition of list) {
    const year = edition.start_date?.slice(0, 4) ?? '—'
    if (groups.at(-1)?.year !== year) groups.push({ year, editions: [] })
    groups.at(-1)!.editions.push(edition)
  }
  return groups
})

const monthDay = (date: string | null) => (date ? `${date.slice(5, 7)}/${date.slice(8, 10)}` : '')

const choose = (edition: Edition | null, close?: () => void) => {
  selected.value = edition && activeSeries.value
    ? { id: edition.id, name: edition.name, slug: '', start_date: edition.start_date, end_date: null, series: { id: activeSeries.value.id, name: activeSeries.value.name } } satisfies EventOption
    : null
  close?.()
  emit('update:modelValue', edition?.id ?? null)
}

const ROW = 'flex w-full items-center gap-2 rounded-sm px-2.5 text-left transition-colors duration-150 ease-out'
</script>

<template>
  <UiPopover v-model:open="open" placement="bottom-start" :label="label" class="w-[calc(100vw-2rem)] overflow-hidden! rounded-md! p-0! sm:w-[34rem]">
    <template #trigger="{ toggle, attrs }">
      <!-- Chosen: the bar's chosen colour; its name reopens the menu, × clears it. -->
      <div v-if="modelValue" class="inline-flex h-8 items-center rounded-lg text-xs font-medium ring-1 ring-inset" :class="activeClass">
        <button type="button" class="inline-flex h-full max-w-56 items-center gap-1.5 pl-3 pr-1.5" v-bind="attrs" @click="toggle">
          <Icon name="lucide:calendar-days" class="h-3.5 w-3.5 shrink-0" />
          <span class="truncate">{{ selected?.name ?? `#${modelValue}` }}</span>
          <Icon name="lucide:chevron-down" class="h-3 w-3 shrink-0 opacity-70" />
        </button>
        <button type="button" class="inline-flex h-full items-center pl-0.5 pr-2 opacity-80 transition-opacity duration-150 ease-out hover:opacity-100" :aria-label="t('event_picker.clear')" @click="choose(null)">
          <Icon name="lucide:x" class="h-3.5 w-3.5" />
        </button>
      </div>
      <button
        v-else
        type="button"
        class="inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-medium ring-1 ring-inset transition-colors duration-150 ease-out"
        :class="idleClass"
        v-bind="attrs"
        @click="toggle"
      >
        <Icon name="lucide:calendar-days" class="h-3.5 w-3.5" />
        {{ label }}
        <Icon name="lucide:chevron-down" class="h-3 w-3 opacity-60" />
      </button>
    </template>

    <template #default="{ close }">
      <div class="flex h-[min(24rem,70vh)] text-xs">
        <!-- Level one: the series -->
        <div class="w-full shrink-0 overflow-y-auto overscroll-contain border-line p-1.5 sm:block sm:w-48 sm:border-r" :class="pane === 'series' ? 'block' : 'hidden'">
          <p class="px-2.5 pb-1.5 pt-1 text-[11px] font-medium text-faint">{{ t('event_filter.series') }}</p>
          <template v-if="series">
            <button
              v-for="item in series"
              :key="item.id"
              type="button"
              class="h-11"
              :class="[ROW, item.id === activeId ? 'bg-ghost-hover text-title' : 'text-body hover:bg-ghost-hover/60']"
              :aria-current="item.id === activeId ? 'true' : undefined"
              @pointerenter="$event.pointerType === 'mouse' && hover(item.id)"
              @pointerleave="unhover"
              @click="pick(item.id)"
            >
              <span class="min-w-0 flex-1">
                <span class="block truncate font-semibold">{{ item.name }}</span>
                <span class="block text-[11px] tabular-nums text-meta">{{ t('event_filter.editions', { count: item.events_count }) }}</span>
              </span>
              <Icon name="lucide:chevron-right" class="h-3.5 w-3.5 shrink-0 transition-[color,translate] duration-150 ease-out" :class="item.id === activeId ? 'translate-x-0.5 text-primary' : 'text-faint'" />
            </button>
          </template>
          <p v-else-if="seriesFailed" class="px-2.5 py-2 text-meta">
            {{ t('event_filter.load_failed') }}
            <UiButton size="xs" class="ml-1 align-middle" @click="loadSeries()">{{ t('common.retry') }}</UiButton>
          </p>
          <div v-else class="space-y-1.5 px-1 pt-1">
            <div v-for="row in 3" :key="row" class="skeleton h-9 rounded-md" />
          </div>
        </div>

        <!-- Level two: the active series' editions, by year -->
        <div class="min-w-0 flex-1 flex-col sm:flex" :class="pane === 'editions' ? 'flex' : 'hidden'">
          <div class="flex h-10 shrink-0 items-center gap-1 border-b border-line px-1.5 sm:px-3">
            <UiButton icon="lucide:chevron-left" :label="t('event_filter.back')" size="xs" icon-class="size-4" class="sm:hidden" @click="pane = 'series'" />
            <span class="truncate font-semibold text-title">{{ activeSeries?.name }}</span>
          </div>

          <div class="flex-1 overflow-y-auto overscroll-contain px-1.5 pb-1.5">
            <template v-if="Array.isArray(activeEditions)">
              <p v-if="!years.length" class="px-2.5 py-6 text-center text-meta">{{ t('event_filter.empty') }}</p>
              <section v-for="group in years" :key="group.year">
                <h3 class="sticky top-0 z-10 bg-popover px-2.5 pb-1 pt-2.5 text-[11px] font-semibold tabular-nums text-faint">{{ group.year }}</h3>
                <button
                  v-for="edition in group.editions"
                  :key="edition.id"
                  type="button"
                  class="h-9"
                  :class="[ROW, edition.id === modelValue ? 'bg-primary/10 text-primary' : 'text-body hover:bg-ghost-hover']"
                  :aria-current="edition.id === modelValue ? 'true' : undefined"
                  @click="choose(edition, close)"
                >
                  <Icon name="lucide:check" class="h-3.5 w-3.5 shrink-0" :class="edition.id === modelValue ? 'opacity-100' : 'opacity-0'" />
                  <span class="min-w-0 flex-1 truncate" :class="edition.id === modelValue ? 'font-semibold' : 'font-medium'">{{ edition.name }}</span>
                  <span class="shrink-0 tabular-nums text-meta">{{ monthDay(edition.start_date) }}</span>
                  <span
                    class="inline-flex min-w-9 shrink-0 items-center justify-end gap-1 tabular-nums"
                    :class="edition.released_albums_count ? 'text-body' : 'text-faint'"
                    :title="t('catalog.albums_count', { count: edition.released_albums_count ?? 0 })"
                  >
                    <Icon name="lucide:disc-3" class="h-3 w-3 opacity-60" />{{ edition.released_albums_count ?? 0 }}
                  </span>
                </button>
              </section>
            </template>
            <p v-else-if="activeEditions === 'failed'" class="px-2.5 py-6 text-center text-meta">
              {{ t('event_filter.load_failed') }}
              <UiButton size="xs" class="ml-1 align-middle" @click="activeId && loadEditions(activeId)">{{ t('common.retry') }}</UiButton>
            </p>
            <div v-else class="space-y-1.5 px-1 pt-3">
              <div v-for="row in 6" :key="row" class="skeleton h-7 rounded-md" />
            </div>
          </div>
        </div>
      </div>
    </template>
  </UiPopover>
</template>
