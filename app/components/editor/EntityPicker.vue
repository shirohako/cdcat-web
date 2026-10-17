<template>
  <div class="relative">
    <label class="input input-sm flex w-full items-center gap-2">
      <Search class="h-3.5 w-3.5 shrink-0 text-gray-400" />
      <input
        v-model="query"
        type="search"
        class="grow"
        :placeholder="placeholder ?? $t('editor.search_placeholder')"
        @focus="open = true"
        @blur="close"
        @keydown.enter.prevent="results[0] ? choose(results[0]) : createNew()"
      >
    </label>
    <div v-if="open && query.trim()" class="absolute z-30 mt-1 max-h-80 w-full min-w-64 overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
      <p v-if="query.trim().length < 2" class="px-3 py-2 text-xs text-gray-500">{{ $t('catalog.form.search_min') }}</p>
      <p v-else-if="searching" class="px-3 py-2 text-xs text-gray-500">{{ $t('catalog.form.searching') }}</p>
      <template v-else>
        <button
          v-for="item in results"
          :key="item.id"
          type="button"
          class="flex w-full items-center gap-2.5 px-3 py-1.5 text-left hover:bg-gray-50"
          @mousedown.prevent="choose(item)"
        >
          <img v-if="item.image_url" :src="item.image_url" alt="" class="h-8 w-8 shrink-0 rounded object-cover">
          <span v-else class="h-8 w-8 shrink-0 rounded bg-gray-100" />
          <span class="min-w-0">
            <span class="block truncate text-sm text-gray-900">{{ item.label }}</span>
            <span v-if="item.subtitle" class="block truncate text-[11px] text-gray-500">{{ item.subtitle }}</span>
          </span>
          <span class="ml-auto shrink-0 text-[11px] text-gray-400">#{{ item.id }}</span>
        </button>
        <p v-if="!results.length" class="px-3 py-2 text-xs text-gray-500">{{ $t('catalog.form.no_results') }}</p>
        <button v-if="allowCreate" type="button" class="flex w-full items-center gap-2 border-t border-gray-100 px-3 py-2 text-left text-sm text-primary hover:bg-gray-50" @mousedown.prevent="createNew">
          <Plus :size="14" />{{ $t('editor.create_new', { name: query.trim() }) }}
        </button>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { EventOption } from '~/composables/useEventSearch'
import type { DatePrecision } from '~/types/entry'
import { Plus, Search } from '@lucide/vue'

export type PickerKind = 'artist' | 'label' | 'work' | 'entry' | 'album' | 'franchise' | 'event'

export interface PickedEntity {
  id: number
  label: string
  subtitle: string
  image_url: string | null
  /** The artist's or entry's type, e.g. game */
  type?: string | null
}

const props = defineProps<{
  kind: PickerKind
  placeholder?: string
  exclude?: Array<number | string | null>
  allowCreate?: boolean
}>()
const emit = defineEmits<{ select: [item: PickedEntity], create: [name: string] }>()

const { $api } = useNuxtApp()
const { enumLabel, formatDate } = useCatalogDisplay()

const query = ref('')
const results = ref<PickedEntity[]>([])
const searching = ref(false)
const open = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined
let requestId = 0

/** The fields the pickers read from the search endpoints' rows. */
interface Row {
  id: number
  name?: string
  title?: string
  type?: string | null
  image_url?: string | null
  catalog_prefixes?: string[]
  tracks_count?: number
  catalog_number?: string | null
  release_date?: string | null
  release_date_precision?: DatePrecision | null
  parent?: { name: string } | null
}
const endpoints: Record<PickerKind, { url: string, key: string, map: (row: Row) => PickedEntity }> = {
  artist: { url: '/v1/artists', key: 'artists', map: row => ({ id: row.id, label: row.name ?? '', subtitle: row.type ? enumLabel('artist_type', row.type) : '', image_url: row.image_url ?? null, type: row.type }) },
  label: { url: '/v1/labels', key: 'labels', map: row => ({ id: row.id, label: row.name ?? '', subtitle: (row.catalog_prefixes ?? []).join(', '), image_url: row.image_url ?? null }) },
  work: { url: '/v1/works', key: 'works', map: row => ({ id: row.id, label: row.title ?? '', subtitle: row.tracks_count ? `${row.tracks_count} ♪` : '', image_url: null }) },
  entry: { url: '/v1/entries', key: 'entries', map: row => ({ id: row.id, label: row.name ?? '', subtitle: [row.type ? enumLabel('entry_type', row.type) : null, formatDate(row.release_date, row.release_date_precision)].filter(Boolean).join(' · '), image_url: row.image_url ?? null, type: row.type }) },
  album: { url: '/v1/albums', key: 'albums', map: row => ({ id: row.id, label: row.title ?? '', subtitle: [row.catalog_number, formatDate(row.release_date, row.release_date_precision)].filter(Boolean).join(' · '), image_url: row.image_url ?? null }) },
  franchise: { url: '/v1/franchises', key: 'franchises', map: row => ({ id: row.id, label: row.name ?? '', subtitle: row.parent ? `↳ ${row.parent.name}` : '', image_url: row.image_url ?? null }) },
  event: { url: '/v1/events', key: 'events', map: row => ({ id: row.id, label: row.name ?? '', subtitle: describeEvent(row as unknown as EventOption), image_url: null }) },
}

const search = async (term: string) => {
  const current = ++requestId
  searching.value = true
  try {
    const endpoint = endpoints[props.kind]
    const data = await $api<Record<string, Row[]>>(endpoint.url, { query: { search: term, per_page: 10 } })
    if (current === requestId) {
      results.value = (data[endpoint.key] ?? []).map(endpoint.map).filter(item => !props.exclude?.includes(item.id))
    }
  } catch {
    if (current === requestId) results.value = []
  } finally {
    if (current === requestId) searching.value = false
  }
}

watch(query, (value) => {
  clearTimeout(timer)
  const term = value.trim()
  if (term.length < 2) {
    results.value = []
    return
  }
  timer = setTimeout(() => search(term), 250)
})

const choose = (item: PickedEntity) => {
  emit('select', item)
  query.value = ''
  results.value = []
  open.value = false
}

const createNew = () => {
  if (!props.allowCreate || query.value.trim().length < 1) return
  emit('create', query.value.trim())
  query.value = ''
  open.value = false
}

const close = () => setTimeout(() => { open.value = false }, 150)
onBeforeUnmount(() => clearTimeout(timer))
</script>
