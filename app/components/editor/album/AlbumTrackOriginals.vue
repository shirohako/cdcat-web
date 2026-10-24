<template>
  <div v-if="track">
    <p class="text-xs font-semibold text-body">{{ $t('editor.originals.title') }}</p>
    <p class="mb-1.5 text-[11px] text-meta">{{ $t('editor.originals.hint') }}</p>
    <ul v-if="rows.length" class="mb-2 space-y-1.5">
      <li v-for="row in rows" :key="row.id" class="flex flex-wrap items-center gap-2 text-sm">
        <template v-if="row.original_track_id !== null">
          <EditorRefLabel :id="row.original_track_id" type="track" :references="editor.references" class="min-w-0" />
          <span v-if="albumOf(row.original_track_id)" class="min-w-0 truncate text-xs text-meta">{{ albumOf(row.original_track_id) }}</span>
        </template>
        <template v-else>
          <span class="min-w-0 truncate">{{ row.original_title }}</span>
          <span class="shrink-0 rounded-full bg-btn px-1.5 py-0.5 text-[10px] text-btn-content" :title="$t('editor.originals.text_only_hint')">{{ $t('editor.originals.text_only') }}</span>
        </template>
        <button type="button" class="btn btn-ghost btn-xs ml-auto px-1.5" :aria-label="$t('common.delete')" @click="remove(row.id)"><X :size="12" /></button>
        <p v-for="error in errorsOf(row.id)" :key="error.path" class="basis-full text-[11px] text-danger">{{ error.message }}</p>
      </li>
    </ul>
    <EditorEntityPicker
      kind="track"
      allow-create
      create-label="editor.originals.use_text"
      :placeholder="$t('editor.originals.search')"
      :exclude="excluded"
      @select="link"
      @create="addText"
    />
  </div>
</template>

<script setup lang="ts">
import type { PickedEntity } from '~/components/editor/EntityPicker.vue'
import type { RowId } from '~/types/document'
import { X } from '@lucide/vue'
import { findTrack } from '~/utils/albumDocument'
import { newKey } from '~/utils/documentKeys'
import { byOrder, nextOrder, sameId } from '~/utils/documentRows'

/**
 * The 原曲 of a track: saved tracks anywhere in the catalog, picked through the site search, or only
 * a name when the original is not in the catalog (docs/catalog/README.md#原曲).
 */
const props = defineProps<{ trackId: RowId }>()

const editor = useAlbumEditor()
const album = computed(() => editor.album.value)
const track = computed(() => findTrack(album.value, props.trackId))
const rows = computed(() => byOrder(album.value.track_originals.filter(row => sameId(row.track_id, props.trackId))))
const excluded = computed(() => [props.trackId, ...rows.value.map(row => row.original_track_id)])

const albumOf = (id: number) => (editor.references.track?.[String(id)] as { album_title?: string } | undefined)?.album_title ?? null
const errorsOf = (rowId: RowId) => editor.errorsIn(`track_originals.${rowId}`)

const add = (fields: { original_track_id: number | null, original_title: string | null }) => {
  album.value.track_originals.push({ id: newKey('o'), track_id: props.trackId, ...fields, sort_order: nextOrder(rows.value) })
}

const link = (item: PickedEntity) => {
  editor.remember('track', item.id, { id: item.id, title: item.label, album_title: item.album_title ?? null, is_pending: item.is_pending ?? false })
  add({ original_track_id: item.id, original_title: null })
}

const addText = (name: string) => {
  const text = name.trim()
  if (text && !rows.value.some(row => row.original_title === text)) add({ original_track_id: null, original_title: text })
}

const remove = (rowId: RowId) => {
  album.value.track_originals = album.value.track_originals.filter(row => !sameId(row.id, rowId))
}
</script>
