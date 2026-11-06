<template>
  <CatalogSection :title="$t('editor.translate.title')" :icon="Languages" :description="$t('editor.translate.hint')">
    <template v-if="current" #actions>{{ $t('editor.translate.progress', { done: doneOf(current), total: rows.length }) }}</template>

    <UiEmpty v-if="!sets.length" :icon="Languages" :title="$t('editor.translate.empty_title')" :description="$t('editor.translate.empty_hint')">
      <template #actions>
        <EditorAlbumTranslationAdd primary :taken="[]" @add="open" />
      </template>
    </UiEmpty>

    <div v-else class="space-y-4 p-3 sm:p-5">
      <div class="flex flex-wrap items-center gap-2">
        <button
          v-for="item in sets"
          :key="keyOf(item)"
          type="button"
          class="inline-flex h-8 items-center gap-2 rounded-lg px-3 text-sm transition-colors"
          :class="current && keyOf(item) === keyOf(current) ? 'bg-primary/12 font-semibold text-primary ring-1 ring-inset ring-primary/30' : 'bg-btn text-body hover:bg-btn-hover'"
          @click="active = keyOf(item)"
        >
          {{ localeName(item.locale) }}<span class="text-xs font-normal opacity-75">· {{ enumLabel('title_kind', item.kind) }}</span>
          <span class="text-xs font-normal tabular-nums opacity-75">{{ doneOf(item) }}/{{ rows.length }}</span>
        </button>
        <EditorAlbumTranslationAdd :taken="sets.map(keyOf)" @add="open" />
      </div>

      <template v-if="current">
        <div class="flex flex-wrap items-center gap-2">
          <p class="text-[11px] text-meta">{{ $t(`editor.translate.kind_hint.${current.kind}`) }}<EditorHelp id="translate.names" /></p>
          <UiButton variant="danger-soft" size="xs" :icon="Trash2" class="ml-auto ring-1 ring-inset ring-danger/20" @click="remove(current)">{{ $t('editor.translate.remove') }}</UiButton>
        </div>

        <div class="overflow-hidden rounded-xl border border-line">
          <div v-for="row in rows" :key="row.key">
            <div v-if="row.heading" class="border-b border-line bg-sunken px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-meta">{{ row.heading }}</div>
            <div class="grid items-center gap-2 border-b border-line px-3 py-1.5 last:border-b-0 sm:grid-cols-2" :class="{ 'bg-warning/5': !nameOf(row, current) }">
              <p class="flex min-w-0 items-baseline gap-2 text-sm text-body">
                <span v-if="row.number" class="w-8 shrink-0 text-right font-mono text-xs text-meta">{{ row.number }}</span>
                <span class="truncate" :title="row.original">{{ row.original }}</span>
              </p>
              <input
                :value="nameOf(row, current)"
                class="input input-sm w-full"
                :lang="current.locale"
                :placeholder="row.original"
                @input="set(row, current, ($event.target as HTMLInputElement).value)"
              >
            </div>
          </div>
        </div>
      </template>
    </div>

    <div class="border-t border-line px-3 py-4 sm:px-5">
      <h3 class="mb-1 text-sm font-semibold text-body">{{ $t('editor.translate.aliases') }}</h3>
      <EditorTitleRows v-model="album.titles" :groups="['alias']" />
    </div>
  </CatalogSection>
</template>

<script setup lang="ts">
import type { TitleCollection } from '~/utils/albumDocument'
import type { RowId } from '~/types/document'
import { Languages, Trash2 } from '@lucide/vue'
import { setTitleIn, sortedDiscs, titleIn, tracksOn } from '~/utils/albumDocument'
import { isReading, languageTag } from '~/utils/contentLanguages'

/**
 * 专辑标题和曲目翻译: names of the album, its discs and tracks in other languages (docs/catalog/editing.md#曲目表翻译), and
 * the album's aliases and abbreviations (EditorTitleRows), as the album's other names all live here. Each
 * translation is one language and kind; the album's own names in the three title lists show as the translations it
 * has, one tab each, with as many new ones as wanted (新建翻译, TranslationAdd). Nothing shows but a placeholder while
 * there are none. Blank inputs remove that name; removing a translation removes all of its names.
 */
const props = defineProps<{ initialLocale?: string }>()

const KINDS = ['translation', 'official', 'transliteration'] as const
type Kind = typeof KINDS[number]
const COLLECTIONS = ['titles', 'disc_titles', 'track_titles'] as const

interface TranslationSet { locale: string, kind: Kind }

const editor = useAlbumEditor()
const { t } = useI18n()
const { enumLabel, localeName } = useCatalogDisplay()
const { confirm } = useConfirm()

const album = computed(() => editor.album.value)
const keyOf = (set: TranslationSet) => `${set.locale}|${set.kind}`

/** Translations made here that have no names yet, so their tab stays while they are filled in. */
const added = ref<TranslationSet[]>([])
const sets = computed<TranslationSet[]>(() => {
  const found = new Map<string, TranslationSet>()
  for (const collection of COLLECTIONS) {
    for (const row of album.value[collection]) {
      if (!row.locale || !row.title?.trim() || !KINDS.includes(row.kind as Kind)) continue
      const set = { locale: row.locale, kind: row.kind as Kind }
      found.set(keyOf(set), set)
    }
  }
  for (const set of added.value) found.set(keyOf(set), set)
  return [...found.values()]
})
const active = ref<string | null>(null)
const current = computed(() => sets.value.find(set => keyOf(set) === active.value) ?? sets.value[0] ?? null)

// ---- adding and removing ----

/** Opens the translation, adding it when the album has none like it. */
const open = (set: TranslationSet) => {
  if (!sets.value.some(item => keyOf(item) === keyOf(set))) added.value.push({ ...set })
  active.value = keyOf(set)
}
const remove = async (set: TranslationSet) => {
  const names = doneOf(set)
  if (names && !await confirm({
    title: t('editor.translate.remove_confirm', { name: `${localeName(set.locale)} · ${enumLabel('title_kind', set.kind)}`, count: names }),
    confirmText: t('editor.translate.remove'),
  })) return
  for (const collection of COLLECTIONS) {
    const rows = album.value[collection] as Array<{ locale: string | null, kind: string }>
    album.value[collection] = rows.filter(row => !(row.locale === set.locale && row.kind === set.kind)) as never
  }
  added.value = added.value.filter(item => keyOf(item) !== keyOf(set))
  if (active.value === keyOf(set)) active.value = null
}

// Opened from the album page for one language (?mode=translate&locale=en): that language's translation.
onMounted(() => {
  const code = props.initialLocale && languageTag(props.initialLocale)
  if (!code) return
  const existing = sets.value.find(set => set.locale === code)
  open(existing ?? { locale: code, kind: isReading(code) ? 'transliteration' : 'translation' })
})

// ---- the rows ----

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

const nameOf = (row: Row, set: TranslationSet) => titleIn(album.value, row.collection, row.owner, set.locale, set.kind)
const set = (row: Row, target: TranslationSet, text: string) => setTitleIn(album.value, row.collection, row.owner, target.locale, target.kind, text)
const doneOf = (target: TranslationSet) => rows.value.filter(row => nameOf(row, target).trim()).length
</script>
