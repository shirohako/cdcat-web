<script setup lang="ts">
import { Calendar, Disc3, Film, Library, Loader2, Mic2, Plus, Search, X } from '@lucide/vue'
import type { Component } from 'vue'
import { CONTENT_LINK_TYPES, type ContentLinkSummary, type ContentLinkType } from '~/types/article'

/**
 * Picks albums, artists, entries, series and events to link, searching each type through its
 * existing list endpoint. Shared by the article writer and, later, discussion topics.
 */
const props = withDefaults(defineProps<{ max?: number, disabled?: boolean }>(), { max: 10, disabled: false })
const model = defineModel<ContentLinkSummary[]>({ required: true })
const { t } = useI18n()
const { $api } = useNuxtApp()

const TYPE_META: Record<ContentLinkType, { icon: Component, endpoint: string, list: string }> = {
  album: { icon: Disc3, endpoint: '/v1/albums', list: 'albums' },
  artist: { icon: Mic2, endpoint: '/v1/artists', list: 'artists' },
  entry: { icon: Film, endpoint: '/v1/entries', list: 'entries' },
  franchise: { icon: Library, endpoint: '/v1/franchises', list: 'franchises' },
  event: { icon: Calendar, endpoint: '/v1/events', list: 'events' },
}

type SearchRow = { id: number, title?: string, name?: string, image_url?: string | null, main_visual_url?: string | null,
  release_date?: string | null, start_date?: string | null, type?: string | null, event_series_id?: number | null }

const type = ref<ContentLinkType>('album')
const query = ref('')
const results = ref<ContentLinkSummary[]>([])
const searching = ref(false)
const searchError = ref(false)
let searchTimer: ReturnType<typeof setTimeout> | undefined
let searchToken = 0

const full = computed(() => model.value.length >= props.max)
const isLinked = (link: ContentLinkSummary) => model.value.some(item => item.type === link.type && item.id === link.id)

const toSummary = (linkType: ContentLinkType, row: SearchRow): ContentLinkSummary => ({
  type: linkType,
  id: row.id,
  title: row.title ?? row.name ?? `#${row.id}`,
  image_url: row.image_url ?? row.main_visual_url ?? null,
  date: (row.release_date ?? row.start_date ?? null)?.slice(0, 10) ?? null,
  kind: linkType === 'event' ? null : row.type ?? null,
  ...(linkType === 'event' ? { event_series_id: row.event_series_id ?? null } : {}),
})

async function search() {
  const term = query.value.trim()
  const token = ++searchToken
  if (term.replace(/\s/g, '').length < 2) {
    results.value = []
    return
  }
  searching.value = true
  searchError.value = false
  try {
    const meta = TYPE_META[type.value]
    const response = await $api<Record<string, SearchRow[]>>(meta.endpoint, { query: { search: term, per_page: 8 } })
    if (token === searchToken) results.value = (response[meta.list] ?? []).map(row => toSummary(type.value, row))
  }
  catch {
    if (token === searchToken) searchError.value = true
  }
  finally {
    if (token === searchToken) searching.value = false
  }
}

watch([query, type], () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => { void search() }, 300)
})
onBeforeUnmount(() => clearTimeout(searchTimer))

function add(link: ContentLinkSummary) {
  if (full.value || isLinked(link) || props.disabled) return
  model.value = [...model.value, link]
}

function remove(link: ContentLinkSummary) {
  model.value = model.value.filter(item => !(item.type === link.type && item.id === link.id))
}
</script>

<template>
  <div class="space-y-3">
    <ul v-if="model.length" class="space-y-1.5">
      <li v-for="link in model" :key="`${link.type}:${link.id}`" class="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-white p-1.5 pr-2">
        <div class="size-9 shrink-0 overflow-hidden rounded-md bg-slate-100">
          <img v-if="link.image_url" :src="link.image_url" :alt="link.title" class="size-full object-cover" loading="lazy" referrerpolicy="no-referrer">
          <component :is="TYPE_META[link.type].icon" v-else :size="16" class="m-2.5 text-slate-400" />
        </div>
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-medium text-slate-800">{{ link.title }}</p>
          <p class="text-[11px] text-slate-400">{{ t(`article_ui.link_types.${link.type}`) }}<span v-if="link.date"> · {{ link.date }}</span></p>
        </div>
        <button
          type="button" class="grid size-7 place-items-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40"
          :disabled="disabled" :aria-label="t('article_ui.links.remove', { title: link.title })" @click="remove(link)">
          <X :size="14" />
        </button>
      </li>
    </ul>

    <div v-if="!disabled" class="rounded-lg border border-slate-200 bg-slate-50/60 p-2">
      <div class="flex flex-wrap gap-1" role="tablist" :aria-label="t('article_ui.links.type')">
        <button
          v-for="linkType in CONTENT_LINK_TYPES" :key="linkType" type="button" role="tab" :aria-selected="type === linkType"
          class="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition"
          :class="type === linkType ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-white hover:text-slate-800'"
          @click="type = linkType">
          <component :is="TYPE_META[linkType].icon" :size="12" />
          {{ t(`article_ui.link_types.${linkType}`) }}
        </button>
      </div>
      <label class="mt-2 flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 focus-within:border-violet-400">
        <Search :size="14" class="shrink-0 text-slate-400" />
        <input
          v-model="query" type="search" maxlength="100" :disabled="full" class="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-300"
          :placeholder="full ? t('article_ui.links.full', { max }) : t('article_ui.links.search', { type: t(`article_ui.link_types.${type}`) })">
        <Loader2 v-if="searching" :size="14" class="shrink-0 animate-spin text-slate-400" />
      </label>
      <p v-if="searchError" class="mt-2 text-xs text-rose-600">{{ t('article_ui.links.search_failed') }}</p>
      <ul v-else-if="results.length" class="mt-2 max-h-64 space-y-1 overflow-y-auto">
        <li v-for="result in results" :key="`${result.type}:${result.id}`">
          <button
            type="button" class="flex w-full items-center gap-2.5 rounded-md p-1.5 text-left transition hover:bg-white disabled:cursor-default disabled:opacity-50"
            :disabled="isLinked(result) || full" @click="add(result)">
            <div class="size-8 shrink-0 overflow-hidden rounded bg-slate-100">
              <img v-if="result.image_url" :src="result.image_url" :alt="result.title" class="size-full object-cover" loading="lazy" referrerpolicy="no-referrer">
            </div>
            <span class="min-w-0 flex-1">
              <span class="block truncate text-sm text-slate-800">{{ result.title }}</span>
              <span v-if="result.date" class="block text-[11px] text-slate-400">{{ result.date }}</span>
            </span>
            <Plus v-if="!isLinked(result)" :size="14" class="shrink-0 text-slate-400" />
          </button>
        </li>
      </ul>
      <p v-else-if="query.trim().length >= 2 && !searching" class="mt-2 px-1 text-xs text-slate-400">{{ t('article_ui.links.no_results') }}</p>
    </div>
  </div>
</template>
