<template>
  <div class="space-y-6">
    <CatalogSection :title="$t('catalog.collection.entries')" :icon="Clapperboard" :description="$t('editor.relations.entries_hint')">
      <div class="space-y-3 p-3 sm:p-5">
        <ul v-if="album.entries.length" class="space-y-1.5">
          <template v-for="row in album.entries" :key="row.id">
            <EditorListRow :invalid="errorsOf('entries', row.id).length > 0" @edit="edit(row)" @remove="remove(album.entries, row)">
              <img v-if="entryOf(row.entry_id)?.image_url" :src="entryOf(row.entry_id)!.image_url!" alt="" class="h-8 w-8 shrink-0 rounded object-cover">
              <span v-else class="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-btn text-faint"><Clapperboard :size="14" /></span>
              <span class="min-w-0 flex-1">
                <span class="flex min-w-0 items-center gap-1.5">
                  <span class="truncate text-sm font-medium text-title">{{ entryName(row.entry_id) }}</span>
                  <span class="shrink-0 rounded-md bg-btn px-1.5 py-0.5 text-[11px] text-btn-content">{{ enumLabel('entry_album_relation', row.relation_type) }}<span v-if="labelEn('entry_album_relation', row.relation_type)" class="ml-1 opacity-60">{{ labelEn('entry_album_relation', row.relation_type) }}</span></span>
                </span>
                <span v-if="row.note" class="block truncate text-[11px] text-meta">{{ row.note }}</span>
              </span>
            </EditorListRow>
            <p v-for="error in errorsOf('entries', row.id)" :key="error.path" class="px-1 text-[11px] text-danger">{{ error.message }}</p>
          </template>
        </ul>
        <EditorAddButton @click="edit(null)">{{ $t('editor.dialog.entry_add') }}</EditorAddButton>
      </div>
    </CatalogSection>

    <CatalogSection :title="$t('catalog.collection.links')" :icon="Link2" :description="$t('editor.relations.links_hint')">
      <div class="space-y-3 p-3 sm:p-5">
        <EditorAlbumRowErrors collection="links" />
        <EditorLinkRows v-model="album.links" />
      </div>
    </CatalogSection>

    <CatalogSection :title="$t('catalog.collection.attributes')" :icon="ListChecks" :description="$t('editor.relations.attributes_hint')">
      <div class="space-y-3 p-3 sm:p-5">
        <EditorAlbumRowErrors collection="attributes" />
        <EditorAttributeRows v-model="album.attributes" subject="album" :references="editor.references" />
      </div>
    </CatalogSection>

    <EditorModal v-model="dialog" :title="$t(editing ? 'editor.dialog.entry_edit' : 'editor.dialog.entry_add')" :description="$t('editor.relations.entries_hint')" :icon="Clapperboard" @submit="save">
      <div class="space-y-4">
        <div>
          <span class="mb-1 block text-sm font-medium text-body">{{ $t('editor.dialog.entry') }}</span>
          <EditorPickedRef v-if="form.entry_id !== null" :id="form.entry_id" type="entry" :references="editor.references" :icon="Clapperboard" @remove="form.entry_id = null" />
          <EditorEntityPicker v-else kind="entry" data-autofocus :placeholder="$t('catalog.form.search_entry')" :exclude="taken" @select="pick" />
          <span v-if="tried && form.entry_id === null" class="mt-1 block text-xs text-danger">{{ $t('editor.dialog.entry_required') }}</span>
        </div>
        <div>
          <span class="mb-1.5 block text-sm font-medium text-body">{{ $t('catalog.field.relation_type') }}</span>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="value in enums.entry_album_relation ?? []"
              :key="value"
              type="button"
              class="chip chip-sm"
              :class="{ 'chip-selected': form.relation_type === value }"
              :aria-pressed="form.relation_type === value"
              @click="form.relation_type = value"
            >{{ enumLabel('entry_album_relation', value) }}<span v-if="labelEn('entry_album_relation', value)" class="ml-1 opacity-60">{{ labelEn('entry_album_relation', value) }}</span></button>
          </div>
        </div>
        <label class="block">
          <span class="mb-1 block text-sm font-medium text-body">{{ $t('catalog.form.note') }}</span>
          <input v-model="form.note" class="input input-sm w-full" maxlength="500">
        </label>
      </div>
      <template #footer>
        <button type="button" class="btn btn-ghost btn-sm" @click="dialog = false">{{ $t('common.cancel') }}</button>
        <button type="submit" class="btn btn-primary btn-sm">{{ $t(editing ? 'common.save' : 'common.add') }}</button>
      </template>
    </EditorModal>
  </div>
</template>

<script setup lang="ts">
import type { PickedEntity } from '~/components/editor/EntityPicker.vue'
import type { AggregateRef, AlbumDocument } from '~/types/document'
import { Clapperboard, Link2, ListChecks } from '@lucide/vue'
import { newKey } from '~/utils/documentKeys'

type EntryRow = AlbumDocument['entries'][number]

const editor = useAlbumEditor()
const { schema } = useCatalogSchema()
const { enumLabel } = useCatalogDisplay()
const { labelEn } = useEnglishLabels()

const album = computed(() => editor.album.value)
const enums = computed(() => schema.value?.enums ?? {})
const errorsOf = (collection: string, id: string | number) => editor.errorsIn(`${collection}.${id}`)

function remove<T>(rows: T[], row: T) {
  const index = rows.indexOf(row)
  if (index >= 0) rows.splice(index, 1)
}

const entryOf = (id: AggregateRef | null) => typeof id === 'number'
  ? editor.references.entry?.[String(id)] as { name?: string, image_url?: string | null } | undefined
  : undefined
const entryName = (id: AggregateRef | null) => entryOf(id)?.name ?? (id === null ? '—' : `#${id}`)

// ---- the dialog ----

const dialog = ref(false)
const editing = ref<EntryRow | null>(null)
const form = reactive({ entry_id: null as AggregateRef | null, relation_type: 'other', note: '' })
const tried = ref(false)
const taken = computed(() => album.value.entries.filter(row => row !== editing.value).map(row => row.entry_id))

const edit = (row: EntryRow | null) => {
  editing.value = row
  form.entry_id = row?.entry_id ?? null
  form.relation_type = row?.relation_type ?? 'other'
  form.note = row?.note ?? ''
  tried.value = false
  dialog.value = true
}

const pick = (item: PickedEntity) => {
  editor.remember('entry', item.id, { id: item.id, name: item.label, image_url: item.image_url, type: item.type })
  form.entry_id = item.id
}

const save = () => {
  tried.value = true
  if (form.entry_id === null) return
  const values = {
    entry_id: form.entry_id,
    relation_type: form.relation_type,
    note: form.note.trim() || null,
  }
  if (editing.value) Object.assign(editing.value, values)
  else album.value.entries.push({ id: newKey('ae'), ...values })
  dialog.value = false
}
</script>
