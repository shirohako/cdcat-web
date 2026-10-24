<template>
  <div class="space-y-6">
    <CatalogSection :title="$t('catalog.collection.artists')" :icon="Users" :description="$t('editor.album.artists_hint')">
      <div class="space-y-3 p-5">
        <p v-if="preview" class="rounded-lg bg-sunken px-3 py-2 text-sm text-body">
          <span class="mr-2 text-[11px] uppercase tracking-wider text-meta">{{ $t('editor.preview') }}</span>{{ preview }}
        </p>
        <EditorAlbumRowErrors collection="artists" />

        <ul v-if="artists.length" class="space-y-1.5">
          <EditorListRow v-for="(row, index) in artists" :key="row.id" :invalid="rowError('artists', row.id)" @edit="editArtist(row)" @remove="remove(album.artists, row)">
            <span class="flex shrink-0 flex-col" @click.stop>
              <button type="button" class="text-faint transition-colors hover:text-primary disabled:opacity-30" :disabled="index === 0" :aria-label="$t('catalog.form.move_up')" @click="moveRow(album.artists, row, -1)"><ChevronUp :size="14" /></button>
              <button type="button" class="text-faint transition-colors hover:text-primary disabled:opacity-30" :disabled="index === artists.length - 1" :aria-label="$t('catalog.form.move_down')" @click="moveRow(album.artists, row, 1)"><ChevronDown :size="14" /></button>
            </span>
            <span class="min-w-0 truncate text-sm font-medium text-title">{{ nameOf('artist', row.artist_id) || '—' }}</span>
            <span v-if="isNew(row.artist_id)" class="shrink-0 rounded-full bg-success/15 px-1.5 py-0.5 text-[10px] font-bold text-success">{{ $t('editor.new') }}</span>
            <span v-if="row.credited_as" class="min-w-0 truncate text-xs text-meta">{{ $t('editor.dialog.shown_as', { name: row.credited_as }) }}</span>
            <span v-if="index < artists.length - 1" class="shrink-0 rounded bg-btn px-1.5 py-0.5 font-mono text-[11px] text-btn-content" :title="$t('catalog.field.join_phrase')">{{ shownPhrase(row.join_phrase) }}</span>
          </EditorListRow>
        </ul>
        <EditorAddButton @click="editArtist(null)">{{ $t('editor.dialog.artist_add') }}</EditorAddButton>
      </div>
    </CatalogSection>

    <CatalogSection :title="$t('catalog.collection.labels')" :icon="Building2" :description="$t('editor.album.labels_hint')">
      <div class="space-y-3 p-5">
        <EditorAlbumRowErrors collection="labels" />
        <ul v-if="labels.length" class="space-y-1.5">
          <EditorListRow v-for="(row, index) in labels" :key="row.id" :invalid="rowError('labels', row.id)" @edit="editLabel(row)" @remove="remove(album.labels, row)">
            <span class="flex shrink-0 flex-col" @click.stop>
              <button type="button" class="text-faint transition-colors hover:text-primary disabled:opacity-30" :disabled="index === 0" :aria-label="$t('catalog.form.move_up')" @click="moveRow(album.labels, row, -1)"><ChevronUp :size="14" /></button>
              <button type="button" class="text-faint transition-colors hover:text-primary disabled:opacity-30" :disabled="index === labels.length - 1" :aria-label="$t('catalog.form.move_down')" @click="moveRow(album.labels, row, 1)"><ChevronDown :size="14" /></button>
            </span>
            <span class="min-w-0 truncate text-sm font-medium text-title">{{ nameOf('label', row.label_id) || '—' }}</span>
            <span v-if="isNew(row.label_id)" class="shrink-0 rounded-full bg-success/15 px-1.5 py-0.5 text-[10px] font-bold text-success">{{ $t('editor.new') }}</span>
            <span class="shrink-0 rounded-md bg-btn px-1.5 py-0.5 text-[11px] text-btn-content">{{ enumLabel('label_role', row.role) }}</span>
            <span v-if="row.credited_as" class="min-w-0 truncate text-xs text-meta">{{ $t('editor.dialog.shown_as', { name: row.credited_as }) }}</span>
          </EditorListRow>
        </ul>
        <EditorAddButton @click="editLabel(null)">{{ $t('editor.dialog.label_add') }}</EditorAddButton>
      </div>
    </CatalogSection>

    <EditorModal v-model="dialog" :title="dialogTitle" :description="kind === 'artist' ? $t('editor.album.artists_hint') : $t('editor.album.labels_hint')" :icon="kind === 'artist' ? Users : Building2" @submit="save(false)">
      <div class="space-y-4">
        <div ref="picker">
          <span class="mb-1 block text-sm font-medium text-body">{{ $t(kind === 'artist' ? 'editor.dialog.credit_artist' : 'editor.dialog.label') }}</span>
          <EditorPickedRef v-if="form.ref !== null" :id="form.ref" :type="kind" :references="editor.references" :pending="editor.pending.value" :icon="kind === 'artist' ? User : Building2" @remove="form.ref = null" />
          <div v-else-if="form.newName" class="flex h-8 items-center gap-2 rounded-lg border border-success/25 bg-success/10 pl-2.5 pr-1 text-sm text-title">
            <component :is="kind === 'artist' ? User : Building2" :size="14" class="shrink-0 text-success" />
            <span class="min-w-0 flex-1 truncate font-medium">{{ form.newName }}</span>
            <span class="shrink-0 rounded-full bg-success/15 px-1.5 py-0.5 text-[10px] font-bold text-success">{{ $t('editor.new') }}</span>
            <button type="button" class="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-success/70 transition-colors hover:bg-success/15 hover:text-success" :aria-label="$t('common.delete')" @click="form.newName = ''"><X :size="13" /></button>
          </div>
          <EditorEntityPicker v-else :kind="kind" allow-create data-autofocus :exclude="kind === 'artist' ? takenArtists : []" :placeholder="$t(kind === 'artist' ? 'editor.album.add_artist' : 'editor.album.add_label')" @select="pick" @create="form.newName = $event" />
          <span v-if="tried && form.ref === null && !form.newName" class="mt-1 block text-xs text-danger">{{ $t(kind === 'artist' ? 'editor.dialog.artist_required' : 'editor.dialog.label_required') }}</span>
        </div>
        <EditorArtistTypePicker v-if="kind === 'artist' && form.ref === null && form.newName" v-model="form.newType" :invalid="tried && !form.newType" />

        <div v-if="kind === 'label'">
          <span class="mb-1.5 block text-sm font-medium text-body">{{ $t('catalog.field.role') }}</span>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="value in enums.label_role ?? []"
              :key="value"
              type="button"
              class="chip chip-sm"
              :class="{ 'chip-selected': form.role === value }"
              :aria-pressed="form.role === value"
              @click="form.role = value"
            >{{ enumLabel('label_role', value) }}</button>
          </div>
        </div>

        <div class="grid gap-4" :class="{ 'sm:grid-cols-[minmax(0,1fr)_9rem]': kind === 'artist' }">
          <label class="block">
            <span class="mb-1 block text-sm font-medium text-body">{{ $t('editor.album.credited_as_placeholder') }}</span>
            <input v-model="form.creditedAs" class="input input-sm w-full" maxlength="200" :placeholder="kind === 'artist' ? $t('editor.artist_examples.credited_placeholder') : ''">
            <span class="mt-1 block text-[11px] text-meta">{{ $t('editor.dialog.shown_as_hint') }}</span>
          </label>
          <label v-if="kind === 'artist'" class="block">
            <span class="mb-1 block text-sm font-medium text-body">{{ $t('catalog.field.join_phrase') }}</span>
            <input v-model="form.joinPhrase" class="input input-sm w-full font-mono" placeholder=", ">
          </label>
        </div>

        <template v-if="kind === 'artist'">
          <div class="-mt-2 flex flex-wrap items-center gap-1.5">
            <span class="text-[11px] text-meta">{{ $t('editor.dialog.join_phrase_hint') }}</span>
            <button
              v-for="phrase in JOIN_PHRASES"
              :key="phrase"
              type="button"
              class="chip chip-sm font-mono"
              :class="{ 'chip-selected': form.joinPhrase === phrase }"
              :title="JSON.stringify(phrase)"
              @click="form.joinPhrase = form.joinPhrase === phrase ? '' : phrase"
            >{{ phrase.trim() || phrase }}</button>
          </div>

          <div class="rounded-lg bg-sunken px-3 py-2 text-sm text-body">
            <span class="mr-2 text-[11px] uppercase tracking-wider text-meta">{{ $t('editor.preview') }}</span>
            <template v-for="(part, index) in dialogPreview" :key="index">
              <span :class="part.mine ? 'rounded bg-primary/15 px-0.5 font-semibold text-primary' : ''">{{ part.name }}</span><span class="whitespace-pre text-meta">{{ part.join }}</span>
            </template>
          </div>

          <details class="group rounded-xl border border-warning/25 bg-warning/10 px-3.5 py-2.5 text-xs text-body" open>
            <summary class="flex cursor-pointer list-none items-center gap-1.5 font-semibold text-title">
              <Lightbulb :size="14" class="shrink-0 text-warning" />{{ $t('editor.artist_examples.title') }}
              <ChevronDown :size="13" class="ml-auto shrink-0 transition-transform group-open:rotate-180" />
            </summary>
            <ul class="mt-2 space-y-2">
              <li v-for="example in ARTIST_EXAMPLES" :key="example.key" class="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-2.5">
                <span class="w-fit shrink-0 rounded-md border border-warning/25 bg-card px-2 py-0.5 font-medium text-title sm:w-40">{{ example.printed }}</span>
                <span class="leading-5">{{ $t(`editor.artist_examples.${example.key}`) }}</span>
              </li>
            </ul>
          </details>
        </template>
      </div>
      <template #footer>
        <span v-if="addedCount" class="mr-auto text-xs text-success">{{ $t('editor.dialog.credit_added', { count: addedCount }) }}</span>
        <button type="button" class="btn btn-ghost btn-sm" @click="dialog = false">{{ $t(addedCount ? 'common.close' : 'common.cancel') }}</button>
        <button v-if="!editing" type="button" class="btn btn-sm" @click="save(true)">{{ $t('editor.dialog.add_another') }}</button>
        <button type="submit" class="btn btn-primary btn-sm">{{ $t(editing ? 'common.save' : 'common.add') }}</button>
      </template>
    </EditorModal>
  </div>
</template>

<script setup lang="ts">
import type { PickedEntity } from '~/components/editor/EntityPicker.vue'
import type { AggregateRef, AlbumDocument } from '~/types/document'
import { Building2, ChevronDown, ChevronUp, Lightbulb, User, Users, X } from '@lucide/vue'
import { newKey } from '~/utils/documentKeys'
import { byOrder, moveRow, nextOrder } from '~/utils/documentRows'

type ArtistRow = AlbumDocument['artists'][number]
type LabelRow = AlbumDocument['labels'][number]

const JOIN_PHRASES = [', ', ' & ', ' × ', ' feat. ', ' and ', ' with ', ' / ', '、']
/** How a printed artist line is entered. The printed text is the same in every language. */
const ARTIST_EXAMPLES = [
  { key: 'featuring', printed: '梶浦由記 feat. Joelle' },
  { key: 'credited', printed: 'Yuki Kajiura' },
  { key: 'circle', printed: 'IOSYS' },
]

const editor = useAlbumEditor()
const { t } = useI18n()
const { schema } = useCatalogSchema()
const { enumLabel } = useCatalogDisplay()

const album = computed(() => editor.album.value)
const references = editor.references
const enums = computed(() => schema.value?.enums ?? {})
const artists = computed(() => byOrder(album.value.artists))
const labels = computed(() => byOrder(album.value.labels))
const rowError = (collection: string, id: string | number) => editor.errorsIn(`${collection}.${id}`).length > 0
const isNew = (id: AggregateRef | null) => typeof id === 'string'

const nameOf = (type: string, id: AggregateRef | null) => {
  if (id === null) return ''
  if (typeof id === 'string') return editor.pending.value[id.replace(/^@/, '')] ?? ''
  const row = references[type]?.[String(id)] as { name?: string } | undefined
  return row?.name ?? `#${id}`
}
/** Spaces made visible, so " & " and "&" can be told apart. */
const shownPhrase = (phrase: string | null) => (phrase || ', ').replace(/ /g, '·')

/** The artist line as the album page prints it: names joined by their join phrases. */
const preview = computed(() => artists.value.map((row, index) =>
  `${row.credited_as || nameOf('artist', row.artist_id)}${index < artists.value.length - 1 ? (row.join_phrase || ', ') : ''}`).join(''))

function remove<T>(rows: T[], row: T) {
  const index = rows.indexOf(row)
  if (index >= 0) rows.splice(index, 1)
}

// ---- the dialog, shared by artists and labels ----

const dialog = ref(false)
const kind = ref<'artist' | 'label'>('artist')
const editing = ref<ArtistRow | LabelRow | null>(null)
const form = reactive({
  ref: null as AggregateRef | null,
  /** A new artist's or label's name; it is created only when the row is added. */
  newName: '',
  /** The type of a new artist, chosen in the dialog. */
  newType: null as string | null,
  creditedAs: '',
  joinPhrase: '',
  role: 'label',
})
const tried = ref(false)
const addedCount = ref(0)
const picker = ref<HTMLElement | null>(null)

const dialogTitle = computed(() => t(kind.value === 'artist'
  ? (editing.value ? 'editor.dialog.artist_edit' : 'editor.dialog.artist_add')
  : (editing.value ? 'editor.dialog.label_edit' : 'editor.dialog.label_add')))
/** The artist line with this row as the dialog has it now; its own name is marked. */
const dialogPreview = computed(() => {
  const mine = { name: form.creditedAs.trim() || (form.ref !== null ? nameOf('artist', form.ref) : form.newName) || '…', join: form.joinPhrase || null, mine: true }
  const list = artists.value.map(row => row === editing.value ? mine : { name: row.credited_as || nameOf('artist', row.artist_id), join: row.join_phrase, mine: false })
  if (!editing.value) list.push(mine)
  return list.map((item, index) => ({ name: item.name, mine: item.mine, join: index < list.length - 1 ? (item.join || ', ') : '' }))
})
const takenArtists = computed(() => album.value.artists.filter(row => row !== editing.value).map(row => row.artist_id))

const reset = () => {
  form.ref = null
  form.newName = ''
  form.newType = null
  form.creditedAs = ''
  form.joinPhrase = ''
  tried.value = false
}

const editArtist = (row: ArtistRow | null) => {
  kind.value = 'artist'
  editing.value = row
  reset()
  form.ref = row?.artist_id ?? null
  form.creditedAs = row?.credited_as ?? ''
  form.joinPhrase = row?.join_phrase ?? ''
  addedCount.value = 0
  dialog.value = true
}

const editLabel = (row: LabelRow | null) => {
  kind.value = 'label'
  editing.value = row
  reset()
  form.ref = row?.label_id ?? null
  form.creditedAs = row?.credited_as ?? ''
  form.role = row?.role ?? 'label'
  addedCount.value = 0
  dialog.value = true
}

const pick = (item: PickedEntity) => {
  editor.remember(kind.value, item.id, { id: item.id, name: item.label, image_url: item.image_url })
  form.ref = item.id
}

const save = async (another: boolean) => {
  tried.value = true
  if (form.ref === null && !form.newName) return
  if (kind.value === 'artist' && form.ref === null && !form.newType) return
  const ref = form.ref ?? editor.createItem(kind.value, kind.value === 'artist' ? { name: form.newName, type: form.newType } : { name: form.newName })
  const creditedAs = form.creditedAs.trim() || null
  if (kind.value === 'artist') {
    const values = { artist_id: ref, credited_as: creditedAs, join_phrase: form.joinPhrase || null }
    if (editing.value) Object.assign(editing.value, values)
    else album.value.artists.push({ id: newKey('aa'), ...values, sort_order: nextOrder(album.value.artists) })
  } else {
    const values = { label_id: ref, role: form.role, credited_as: creditedAs }
    if (editing.value) Object.assign(editing.value, values)
    else album.value.labels.push({ id: newKey('al'), ...values, sort_order: nextOrder(album.value.labels) })
  }
  if (!another) {
    dialog.value = false
    return
  }
  addedCount.value++
  reset()
  await nextTick()
  picker.value?.querySelector('input')?.focus()
}
</script>
