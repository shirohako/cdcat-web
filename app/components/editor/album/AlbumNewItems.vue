<template>
  <section v-if="created.length || edited.length" class="rounded-xl border border-emerald-200 bg-emerald-50/40 shadow-sm">
    <div class="flex items-center gap-2 border-b border-emerald-100 px-5 py-3">
      <Sparkles :size="15" class="text-emerald-600" />
      <h2 class="text-sm font-bold text-emerald-900">{{ $t('editor.new_items.title') }}</h2>
      <span class="text-xs text-emerald-700/70">{{ $t('editor.new_items.hint') }}</span>
    </div>
    <ul class="divide-y divide-emerald-100">
      <li v-for="item in created" :key="item.ref" class="space-y-2 px-5 py-3">
        <div class="flex flex-wrap items-center gap-2">
          <span class="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">{{ enumLabel('catalog_type', item.resource_type) }}</span>
          <input
            v-if="item.resource_type === 'work'"
            v-model="docOf(item).title"
            class="input input-sm min-w-48 flex-1"
            :class="{ 'input-error': errorsOf(item.ref).length }"
            :placeholder="$t('catalog.field.title')"
          >
          <input v-else v-model="docOf(item).name" class="input input-sm min-w-48 flex-1" :class="{ 'input-error': errorsOf(item.ref).length }" :placeholder="$t('catalog.field.name')">
          <select v-if="item.resource_type === 'artist'" v-model="docOf(item).type" class="select select-sm w-36">
            <option v-for="value in enums.artist_type ?? []" :key="value" :value="value">{{ enumLabel('artist_type', value) }}</option>
          </select>
          <span class="text-[11px] text-gray-500">{{ usage(item.ref) }}</span>
          <button type="button" class="btn btn-ghost btn-xs ml-auto px-1.5 text-gray-400 hover:text-error" :title="$t('editor.new_items.remove')" @click="remove(item.ref)"><Trash2 :size="12" /></button>
        </div>

        <div v-if="item.resource_type === 'work'" class="space-y-2 pl-1">
          <div v-for="credit in docOf(item).credits ?? []" :key="credit.id" class="flex flex-wrap items-center gap-2">
            <EditorRoleSelect v-model="credit.role" level="work" class="w-36" />
            <EditorRefLabel v-if="credit.artist_id !== null" :id="credit.artist_id" type="artist" :references="editor.references" :pending="editor.pending.value" class="text-sm" />
            <input v-else v-model="credit.credited_as" class="input input-sm w-44" :placeholder="$t('editor.credits.name_only')">
            <button type="button" class="btn btn-ghost btn-xs px-1" :aria-label="$t('common.delete')" @click="removeRow(docOf(item).credits ?? [], credit)"><X :size="12" /></button>
          </div>
          <div v-for="entry in docOf(item).entries ?? []" :key="entry.id" class="flex flex-wrap items-center gap-2">
            <select v-model="entry.relation_type" class="select select-sm w-36">
              <option v-for="value in enums.entry_work_relation ?? []" :key="value" :value="value">{{ enumLabel('entry_work_relation', value) }}</option>
            </select>
            <EditorRefLabel :id="entry.entry_id" type="entry" :references="editor.references" class="text-sm" />
            <button type="button" class="btn btn-ghost btn-xs px-1" :aria-label="$t('common.delete')" @click="removeRow(docOf(item).entries ?? [], entry)"><X :size="12" /></button>
          </div>
          <div class="grid gap-2 sm:grid-cols-2">
            <EditorEntityPicker kind="artist" allow-create :placeholder="$t('editor.new_items.add_composer')" @select="addComposer(item, $event.id, $event)" @create="addComposer(item, editor.createItem('artist', { name: $event, type: 'person' }))" />
            <EditorEntityPicker kind="entry" :placeholder="$t('editor.new_items.add_source')" @select="addSource(item, $event)" />
          </div>
        </div>
        <p v-for="error in errorsOf(item.ref)" :key="error.path" class="text-[11px] text-error">{{ error.message }}</p>
      </li>
      <li v-for="item in edited" :key="item.ref" class="flex flex-wrap items-center gap-2 px-5 py-2.5 text-sm">
        <span class="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-700">{{ $t('editor.new_items.edited', { type: enumLabel('catalog_type', item.resource_type) }) }}</span>
        <EditorRefLabel :id="item.resource_id ?? null" :type="item.resource_type" :references="editor.references" />
        <span class="text-[11px] text-gray-500">{{ $t('editor.new_items.edited_hint') }}</span>
        <p v-for="error in errorsOf(item.ref)" :key="error.path" class="basis-full text-[11px] text-error">{{ error.message }}</p>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import type { PickedEntity } from '~/components/editor/EntityPicker.vue'
import type { DraftItem } from '~/composables/useRevisionDraft'
import type { AggregateRef, WorkDocument } from '~/types/document'
import { Sparkles, Trash2, X } from '@lucide/vue'
import { newKey } from '~/utils/documentKeys'
import { nextOrder } from '~/utils/documentRows'

/** Artists, labels and works created in this revision, and other entities it edits (works that get originals). */
const editor = useAlbumEditor()
const { t } = useI18n()
const { confirm } = useConfirm()
const { schema } = useCatalogSchema()
const { enumLabel } = useCatalogDisplay()
const enums = computed(() => schema.value?.enums ?? {})

const others = computed(() => editor.draft.items.value.filter(item => item.ref !== editor.mainRef.value))
const created = computed(() => others.value.filter(item => item.action === 'create'))
const edited = computed(() => others.value.filter(item => item.action === 'update'))

/** The fields this panel edits on new artists, labels and works. */
interface NewItemDocument {
  name?: string
  title?: string
  type?: string
  credits?: WorkDocument['credits']
  entries?: WorkDocument['entries']
}
const docOf = (item: DraftItem) => item.document as NewItemDocument
const errorsOf = (ref: string) => editor.errors.value.filter(error => error.path.startsWith(`items.${ref}.`) || error.path === `items.${ref}`)

/** Where the album uses the new item, e.g. "2 tracks". */
const usage = (ref: string) => {
  const album = editor.album.value
  const target = `@${ref}`
  const tracks = album.tracks.filter(track => track.work_id === target).length
  const credits = album.credits.filter(credit => credit.artist_id === target).length + album.artists.filter(row => row.artist_id === target).length
  if (tracks) return t('editor.new_items.used_tracks', { count: tracks })
  if (credits) return t('editor.new_items.used_credits', { count: credits })
  return editor.referenced(target) ? t('editor.new_items.used_elsewhere') : t('editor.new_items.unused')
}

function removeRow<T>(rows: T[], row: T) {
  const index = rows.indexOf(row)
  if (index >= 0) rows.splice(index, 1)
}

const remove = async (ref: string) => {
  if (editor.referenced(`@${ref}`) && !await confirm({ title: t('editor.new_items.remove_confirm'), confirmText: t('editor.new_items.remove') })) return
  editor.removeItem(ref)
}

const addComposer = (item: DraftItem, artistId: AggregateRef, picked?: PickedEntity) => {
  if (picked) editor.remember('artist', picked.id, { id: picked.id, name: picked.label, image_url: picked.image_url })
  const doc = docOf(item)
  doc.credits ??= []
  doc.credits.push({ id: newKey('wc'), artist_id: artistId, credited_as: null, role: 'composer', detail: null, sort_order: nextOrder(doc.credits) })
}

const addSource = (item: DraftItem, entry: PickedEntity) => {
  editor.remember('entry', entry.id, { id: entry.id, name: entry.label, image_url: entry.image_url })
  const doc = docOf(item)
  doc.entries ??= []
  doc.entries.push({ id: newKey('we'), entry_id: entry.id, relation_type: 'bgm', episode: null, note: null, sort_order: nextOrder(doc.entries) })
}
</script>
