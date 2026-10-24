<template>
  <CatalogSection :title="$t('editor.translate.title')" :icon="Languages" :description="$t('editor.translate.hint')">
    <template #actions>{{ $t('editor.translate.progress', { done: done, total: rows.length }) }}</template>
    <div class="space-y-4 p-3 sm:p-5">
      <div class="flex flex-wrap items-end gap-3">
        <label class="block">
          <span class="mb-1 block text-xs font-medium text-body">{{ $t('editor.translate.language') }}</span>
          <UiSelect v-model="locale" :options="localeOptions" size="sm" class="w-48" />
        </label>
        <label class="block">
          <span class="mb-1 block text-xs font-medium text-body">{{ $t('catalog.field.kind') }}</span>
          <UiSelect v-model="kind" :options="kindOptions" size="sm" class="w-40" />
        </label>
        <p class="pb-2 text-[11px] text-meta">{{ $t(`editor.translate.kind_hint.${kind}`) }}</p>
      </div>

      <div class="overflow-hidden rounded-xl border border-line">
        <div v-for="row in rows" :key="row.key">
          <div v-if="row.heading" class="border-b border-line bg-sunken px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-meta">{{ row.heading }}</div>
          <div class="grid items-center gap-2 border-b border-line px-3 py-1.5 last:border-b-0 sm:grid-cols-2" :class="{ 'bg-warning/5': !nameOf(row) }">
            <p class="flex min-w-0 items-baseline gap-2 text-sm text-body">
              <span v-if="row.number" class="w-8 shrink-0 text-right font-mono text-xs text-meta">{{ row.number }}</span>
              <span class="truncate" :title="row.original">{{ row.original }}</span>
            </p>
            <input
              :value="nameOf(row)"
              class="input input-sm w-full"
              :lang="locale"
              :placeholder="row.original"
              @input="set(row, ($event.target as HTMLInputElement).value)"
            >
          </div>
        </div>
      </div>
    </div>
  </CatalogSection>
</template>

<script setup lang="ts">
import type { TitleCollection } from '~/utils/albumDocument'
import type { RowId } from '~/types/document'
import type { UiSelectOption } from '~/components/ui/Select.vue'
import { Languages } from '@lucide/vue'
import { setTitleIn, sortedDiscs, titleIn, tracksOn } from '~/utils/albumDocument'

/**
 * 翻译曲目表: names of the album, its discs and tracks in one language, submitted together as
 * one revision (docs/catalog/editing.md#曲目表翻译). Blank inputs remove that name.
 */
const props = defineProps<{ initialLocale?: string }>()

const LOCALES = ['zh-Hans', 'zh-Hant', 'en', 'ja', 'ja-Latn', 'ja-Hrkt', 'ko']
const KINDS = ['translation', 'official', 'transliteration'] as const

const editor = useAlbumEditor()
const { t, locale: uiLocale } = useI18n()
const { enumLabel, localeName } = useCatalogDisplay()

const album = computed(() => editor.album.value)
const locale = ref(props.initialLocale && LOCALES.includes(props.initialLocale) ? props.initialLocale : LOCALES.includes(uiLocale.value) && uiLocale.value !== 'ja' ? uiLocale.value : 'en')
const kind = ref<typeof KINDS[number]>('translation')
const localeOptions = computed<UiSelectOption<string>[]>(() => LOCALES.map(code => ({ value: code, label: localeName(code) })))
const kindOptions = computed<UiSelectOption<typeof KINDS[number]>[]>(() => KINDS.map(value => ({ value, label: enumLabel('title_kind', value) })))
watch(locale, (code) => { if (code.endsWith('-Latn') || code.endsWith('-Hrkt')) kind.value = 'transliteration' })

interface Row {
  key: string
  collection: TitleCollection
  owner: { field: 'disc_id' | 'track_id', id: RowId } | null
  original: string
  number?: string
  heading?: string
}

const rows = computed<Row[]>(() => {
  const discs = sortedDiscs(album.value)
  const list: Row[] = [{ key: 'album', collection: 'titles', owner: null, original: album.value.title, heading: t('editor.translate.album_title') }]
  for (const disc of discs) {
    const heading = discs.length > 1 || disc.title ? t('editor.album.disc_n', { n: disc.position }) : undefined
    let first = true
    if (disc.title) {
      list.push({ key: `d${disc.id}`, collection: 'disc_titles', owner: { field: 'disc_id', id: disc.id }, original: disc.title, heading, number: '◎' })
      first = false
    }
    for (const track of tracksOn(album.value, disc.id)) {
      list.push({
        key: `t${track.id}`, collection: 'track_titles', owner: { field: 'track_id', id: track.id }, original: track.title,
        number: track.number_label || String(track.track_number).padStart(2, '0'), heading: first ? (heading ?? t('editor.translate.tracks')) : undefined,
      })
      first = false
    }
  }
  return list
})

const nameOf = (row: Row) => titleIn(album.value, row.collection, row.owner, locale.value, kind.value)
const set = (row: Row, text: string) => setTitleIn(album.value, row.collection, row.owner, locale.value, kind.value, text)
const done = computed(() => rows.value.filter(row => nameOf(row).trim()).length)
</script>
