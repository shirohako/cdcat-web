<script setup lang="ts">
import { Search } from '@lucide/vue'
import type { EntrySummary, FranchiseSummary } from '~/types/entry'

export interface PickedItem {
  id: number
  label: string
  subtitle: string
  image_url: string | null
}

// Searches entries, works or series by name and emits the chosen one.
const props = defineProps<{
  kind: 'entry' | 'work' | 'franchise'
  exclude?: number[]
  placeholder?: string
  /** Extra query parameters, e.g. { top_level: 1 } to offer only top-level series. */
  extraQuery?: Record<string, string | number>
}>()
const emit = defineEmits<{ select: [item: PickedItem] }>()

const { $api } = useNuxtApp()
const { displayName, typeWithFormat, formatReleaseDate } = useEntryDisplay()

const query = ref('')
const results = ref<PickedItem[]>([])
const searching = ref(false)
const open = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined
let requestId = 0

const tooShort = computed(() => query.value.trim().length > 0 && query.value.trim().length < 2)

const search = async (term: string) => {
  const current = ++requestId
  searching.value = true
  try {
    let items: PickedItem[] = []
    if (props.kind === 'entry') {
      const data = await $api<{ entries: EntrySummary[] }>('/v1/entries', { query: { search: term, per_page: 10, ...props.extraQuery } })
      items = data.entries.map(entry => ({
        id: entry.id,
        label: displayName(entry),
        subtitle: [typeWithFormat(entry.type, entry.format), formatReleaseDate(entry.release_date, entry.release_date_precision)].filter(Boolean).join(' · '),
        image_url: entry.image_url,
      }))
    } else if (props.kind === 'franchise') {
      const data = await $api<{ franchises: FranchiseSummary[] }>('/v1/franchises', { query: { search: term, per_page: 10, ...props.extraQuery } })
      items = data.franchises.map(franchise => ({
        id: franchise.id,
        label: displayName(franchise),
        subtitle: franchise.parent ? `↳ ${franchise.parent.name}` : '',
        image_url: franchise.image_url,
      }))
    } else {
      const data = await $api<{ works: Array<{ id: number, title: string, catalog_number: string | null, release_date: string | null, image_url: string | null }> }>('/v1/works', { query: { search: term, per_page: 10 } })
      items = data.works.map(work => ({
        id: work.id,
        label: work.title,
        subtitle: [work.catalog_number, work.release_date].filter(Boolean).join(' · '),
        image_url: work.image_url,
      }))
    }
    if (current === requestId) results.value = items.filter(item => !props.exclude?.includes(item.id))
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

const choose = (item: PickedItem) => {
  emit('select', item)
  query.value = ''
  results.value = []
  open.value = false
}

const close = () => setTimeout(() => { open.value = false }, 150)
onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <div class="relative">
    <label class="input input-bordered input-sm flex w-full items-center gap-2">
      <Search class="h-4 w-4 text-gray-400" />
      <input
        v-model="query"
        type="search"
        class="grow"
        :placeholder="placeholder"
        :aria-label="placeholder"
        @focus="open = true"
        @blur="close"
        @keydown.enter.prevent="results[0] && choose(results[0])"
      >
    </label>

    <div
      v-if="open && query.trim()"
      class="absolute z-20 mt-1 max-h-80 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
    >
      <p v-if="tooShort" class="px-3 py-2 text-sm text-gray-500">{{ $t('catalog.form.search_min') }}</p>
      <p v-else-if="searching" class="px-3 py-2 text-sm text-gray-500">{{ $t('catalog.form.searching') }}</p>
      <p v-else-if="!results.length" class="px-3 py-2 text-sm text-gray-500">{{ $t('catalog.form.no_results') }}</p>
      <button
        v-for="item in results"
        v-else
        :key="item.id"
        type="button"
        class="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-gray-50"
        @mousedown.prevent="choose(item)"
      >
        <img v-if="item.image_url" :src="item.image_url" alt="" class="h-10 w-10 shrink-0 rounded object-cover" >
        <span v-else class="h-10 w-10 shrink-0 rounded bg-gray-100" />
        <span class="min-w-0">
          <span class="block truncate text-sm font-medium text-gray-900">{{ item.label }}</span>
          <span v-if="item.subtitle" class="block truncate text-xs text-gray-500">{{ item.subtitle }}</span>
        </span>
        <span class="ml-auto shrink-0 text-xs text-gray-400">#{{ item.id }}</span>
      </button>
    </div>
  </div>
</template>
