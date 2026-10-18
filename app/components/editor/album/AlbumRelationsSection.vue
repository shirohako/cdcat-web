<template>
  <div class="space-y-6">
    <CatalogSection :title="$t('catalog.collection.entries')" :icon="Clapperboard" tone="rose">
      <div class="space-y-3 p-3 sm:p-5">
        <p class="text-xs text-gray-500">{{ $t('editor.relations.entries_hint') }}</p>
        <ul class="space-y-2">
          <li v-for="row in album.entries" :key="row.id" class="grid gap-2 rounded-lg border border-gray-100 px-3 py-2 sm:grid-cols-[minmax(0,1fr)_9rem_9rem_5rem_auto] sm:items-center" :class="{ 'border-rose-200 bg-rose-50/40': errorsOf('entries', row.id).length }">
            <EditorRefLabel :id="row.entry_id" type="entry" :references="editor.references" class="min-w-0 text-sm font-medium" />
            <select v-model="row.relation_type" class="select select-sm w-full">
              <option v-for="value in enums.entry_album_relation ?? []" :key="value" :value="value">{{ enumLabel('entry_album_relation', value) }}</option>
            </select>
            <input v-model="row.character_name" class="input input-sm w-full" :placeholder="$t('catalog.form.character_name')">
            <input v-model.number="row.episode" type="number" min="0" class="input input-sm w-full" :placeholder="$t('catalog.form.episode')">
            <button type="button" class="btn btn-ghost btn-sm justify-self-end px-2" :aria-label="$t('common.delete')" @click="remove(album.entries, row)"><Trash2 :size="14" /></button>
            <input v-model="row.note" class="input input-sm w-full sm:col-span-4" :placeholder="$t('catalog.form.note')">
            <p v-for="error in errorsOf('entries', row.id)" :key="error.path" class="text-[11px] text-error sm:col-span-5">{{ error.message }}</p>
          </li>
        </ul>
        <EditorEntityPicker kind="entry" class="max-w-md" :placeholder="$t('catalog.form.search_entry')" :exclude="album.entries.map(row => row.entry_id)" @select="addEntry" />
      </div>
    </CatalogSection>

    <CatalogSection :title="$t('catalog.collection.links')" :icon="Link2" tone="gray">
      <div class="space-y-3 p-3 sm:p-5">
        <p class="text-xs text-gray-500">{{ $t('editor.relations.links_hint') }}</p>
        <EditorAlbumRowErrors collection="links" />
        <EditorLinkRows v-model="album.links" />
      </div>
    </CatalogSection>

    <CatalogSection :title="$t('catalog.collection.attributes')" :icon="ListChecks" tone="amber">
      <div class="space-y-3 p-3 sm:p-5">
        <p class="text-xs text-gray-500">{{ $t('editor.relations.attributes_hint') }}</p>
        <EditorAlbumRowErrors collection="attributes" />
        <EditorAttributeRows v-model="album.attributes" subject="album" :references="editor.references" />
      </div>
    </CatalogSection>
  </div>
</template>

<script setup lang="ts">
import type { PickedEntity } from '~/components/editor/EntityPicker.vue'
import { Clapperboard, Link2, ListChecks, Trash2 } from '@lucide/vue'
import { newKey } from '~/utils/documentKeys'

const editor = useAlbumEditor()
const { schema } = useCatalogSchema()
const { enumLabel } = useCatalogDisplay()

const album = computed(() => editor.album.value)
const enums = computed(() => schema.value?.enums ?? {})
const errorsOf = (collection: string, id: string | number) => editor.errorsIn(`${collection}.${id}`)

function remove<T>(rows: T[], row: T) {
  const index = rows.indexOf(row)
  if (index >= 0) rows.splice(index, 1)
}

const addEntry = (item: PickedEntity) => {
  editor.remember('entry', item.id, { id: item.id, name: item.label, image_url: item.image_url, type: item.type })
  album.value.entries.push({ id: newKey('ae'), entry_id: item.id, relation_type: 'other', character_name: null, episode: null, note: null })
}
</script>
