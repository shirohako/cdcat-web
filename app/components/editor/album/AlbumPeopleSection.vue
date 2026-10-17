<template>
  <div class="space-y-6">
    <CatalogSection :title="$t('catalog.collection.artists')" :icon="Users" tone="indigo">
      <div class="space-y-3 p-5">
        <p class="text-xs text-gray-500">{{ $t('editor.album.artists_hint') }}</p>
        <p v-if="preview" class="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700">
          <span class="mr-2 text-[11px] uppercase tracking-wider text-gray-400">{{ $t('editor.preview') }}</span>{{ preview }}
        </p>
        <EditorAlbumRowErrors collection="artists" />

        <ul class="space-y-2">
          <li v-for="(row, index) in artists" :key="row.id" class="flex flex-wrap items-center gap-2 rounded-lg border border-gray-100 px-3 py-2" :class="{ 'border-rose-200 bg-rose-50/40': rowError('artists', row.id) }">
            <div class="flex flex-col">
              <button type="button" class="text-gray-300 hover:text-gray-600 disabled:opacity-30" :disabled="index === 0" :aria-label="$t('catalog.form.move_up')" @click="moveRow(album.artists, row, -1)"><ChevronUp :size="14" /></button>
              <button type="button" class="text-gray-300 hover:text-gray-600 disabled:opacity-30" :disabled="index === artists.length - 1" :aria-label="$t('catalog.form.move_down')" @click="moveRow(album.artists, row, 1)"><ChevronDown :size="14" /></button>
            </div>
            <EditorRefLabel :id="row.artist_id" type="artist" :references="references" :pending="editor.pending.value" class="min-w-32 flex-1 text-sm font-medium" />
            <input v-model="row.credited_as" class="input input-sm w-40" :placeholder="$t('editor.album.credited_as_placeholder')">
            <input v-if="index < artists.length - 1" v-model="row.join_phrase" list="editor-join-phrases" class="input input-sm w-24 font-mono" :placeholder="', '" :title="$t('catalog.field.join_phrase')">
            <button type="button" class="btn btn-ghost btn-sm px-2" :aria-label="$t('common.delete')" @click="remove(album.artists, row)"><Trash2 :size="14" /></button>
          </li>
        </ul>
        <datalist id="editor-join-phrases">
          <option v-for="phrase in JOIN_PHRASES" :key="phrase" :value="phrase" />
        </datalist>
        <EditorEntityPicker kind="artist" allow-create :exclude="artists.map(row => row.artist_id)" :placeholder="$t('editor.album.add_artist')" class="max-w-md" @select="addArtist" @create="createArtist" />
      </div>
    </CatalogSection>

    <CatalogSection :title="$t('catalog.collection.labels')" :icon="Building2" tone="amber">
      <div class="space-y-3 p-5">
        <p class="text-xs text-gray-500">{{ $t('editor.album.labels_hint') }}</p>
        <EditorAlbumRowErrors collection="labels" />
        <ul class="space-y-2">
          <li v-for="(row, index) in labels" :key="row.id" class="flex flex-wrap items-center gap-2 rounded-lg border border-gray-100 px-3 py-2" :class="{ 'border-rose-200 bg-rose-50/40': rowError('labels', row.id) }">
            <div class="flex flex-col">
              <button type="button" class="text-gray-300 hover:text-gray-600 disabled:opacity-30" :disabled="index === 0" :aria-label="$t('catalog.form.move_up')" @click="moveRow(album.labels, row, -1)"><ChevronUp :size="14" /></button>
              <button type="button" class="text-gray-300 hover:text-gray-600 disabled:opacity-30" :disabled="index === labels.length - 1" :aria-label="$t('catalog.form.move_down')" @click="moveRow(album.labels, row, 1)"><ChevronDown :size="14" /></button>
            </div>
            <EditorRefLabel :id="row.label_id" type="label" :references="references" :pending="editor.pending.value" class="min-w-32 flex-1 text-sm font-medium" />
            <select v-model="row.role" class="select select-sm w-36">
              <option v-for="value in enums.label_role ?? []" :key="value" :value="value">{{ enumLabel('label_role', value) }}</option>
            </select>
            <input v-model="row.credited_as" class="input input-sm w-40" :placeholder="$t('editor.album.credited_as_placeholder')">
            <button type="button" class="btn btn-ghost btn-sm px-2" :aria-label="$t('common.delete')" @click="remove(album.labels, row)"><Trash2 :size="14" /></button>
          </li>
        </ul>
        <EditorEntityPicker kind="label" allow-create :placeholder="$t('editor.album.add_label')" class="max-w-md" @select="addLabel" @create="createLabel" />
      </div>
    </CatalogSection>
  </div>
</template>

<script setup lang="ts">
import type { PickedEntity } from '~/components/editor/EntityPicker.vue'
import type { AggregateRef } from '~/types/document'
import { Building2, ChevronDown, ChevronUp, Trash2, Users } from '@lucide/vue'
import { newKey } from '~/utils/documentKeys'
import { byOrder, moveRow, nextOrder } from '~/utils/documentRows'

const JOIN_PHRASES = [', ', ' & ', ' × ', ' feat. ', ' and ', ' with ', ' / ', '、']

const editor = useAlbumEditor()
const { schema } = useCatalogSchema()
const { enumLabel } = useCatalogDisplay()

const album = computed(() => editor.album.value)
const references = editor.references
const enums = computed(() => schema.value?.enums ?? {})
const artists = computed(() => byOrder(album.value.artists))
const labels = computed(() => byOrder(album.value.labels))
const rowError = (collection: string, id: string | number) => editor.errorsIn(`${collection}.${id}`).length > 0

const nameOf = (type: string, id: AggregateRef | null) => {
  if (id === null) return ''
  if (typeof id === 'string') return editor.pending.value[id.replace(/^@/, '')] ?? ''
  const row = references[type]?.[String(id)] as { name?: string } | undefined
  return row?.name ?? `#${id}`
}

/** The artist line as the album page prints it: names joined by their join phrases. */
const preview = computed(() => artists.value.map((row, index) =>
  `${row.credited_as || nameOf('artist', row.artist_id)}${index < artists.value.length - 1 ? (row.join_phrase || ', ') : ''}`).join(''))

function remove<T>(rows: T[], row: T) {
  const index = rows.indexOf(row)
  if (index >= 0) rows.splice(index, 1)
}

const addArtistRef = (artistId: AggregateRef) => {
  album.value.artists.push({ id: newKey('aa'), artist_id: artistId, credited_as: null, join_phrase: null, sort_order: nextOrder(album.value.artists) })
}
const addArtist = (item: PickedEntity) => {
  editor.remember('artist', item.id, { id: item.id, name: item.label, image_url: item.image_url })
  addArtistRef(item.id)
}
const createArtist = (name: string) => addArtistRef(editor.createItem('artist', { name, type: 'person' }))

const addLabelRef = (labelId: AggregateRef) => {
  album.value.labels.push({ id: newKey('al'), label_id: labelId, role: 'label', credited_as: null, sort_order: nextOrder(album.value.labels) })
}
const addLabel = (item: PickedEntity) => {
  editor.remember('label', item.id, { id: item.id, name: item.label, image_url: item.image_url })
  addLabelRef(item.id)
}
const createLabel = (name: string) => addLabelRef(editor.createItem('label', { name }))
</script>
