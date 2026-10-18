<template>
  <!-- Inline (in a dialog): the list itself, under a summary line. Otherwise a select-like button opens it. -->
  <div v-if="inline" class="overflow-hidden rounded-lg border border-gray-200">
    <p class="flex items-center gap-2 border-b border-gray-100 bg-white px-3 py-1.5 text-xs text-gray-600">
      <span class="min-w-0 flex-1 truncate">{{ summary }}</span>
      <button type="button" class="shrink-0 text-primary hover:underline" @click="selectAll">{{ $t('common.all') }}</button>
    </p>
    <div class="max-h-56 overflow-y-auto">
      <EditorAlbumTrackChooserList :model-value="model" @toggle="toggle" @set-disc="setDisc" />
    </div>
  </div>
  <div v-else class="relative">
    <button type="button" class="select select-sm flex w-full items-center text-left" :aria-expanded="open" @click="open = !open">
      <span class="truncate">{{ summary }}</span>
    </button>
    <template v-if="open">
      <div class="fixed inset-0 z-30" @click="open = false" />
      <div class="absolute right-0 z-40 mt-1 max-h-80 w-72 overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
        <EditorAlbumTrackChooserList :model-value="model" @toggle="toggle" @set-disc="setDisc" />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { RowId } from '~/types/document'
import { orderedTracks, tracksOn, trackRanges } from '~/utils/albumDocument'
import { sameId } from '~/utils/documentRows'

/** Picks tracks of the album for a credit; at least one stays ticked. */
defineProps<{ inline?: boolean }>()
const model = defineModel<RowId[]>({ required: true })
const editor = useAlbumEditor()
const { t } = useI18n()

const album = computed(() => editor.album.value)
const open = ref(false)

const has = (id: RowId) => model.value.some(item => sameId(item, id))
const toggle = (id: RowId) => { model.value = has(id) ? model.value.filter(item => !sameId(item, id)) : [...model.value, id] }
const setDisc = (discId: RowId, on: boolean) => {
  const ids = tracksOn(album.value, discId).map(track => track.id)
  const rest = model.value.filter(item => !ids.some(id => sameId(id, item)))
  const next = on ? [...rest, ...ids] : rest
  if (next.length) model.value = next
}
const selectAll = () => {
  const ids = orderedTracks(album.value).map(track => track.id)
  if (ids.length) model.value = ids
}

const summary = computed(() => {
  const all = orderedTracks(album.value)
  if (!model.value.length) return t('editor.credits.no_tracks')
  if (all.length > 1 && all.every(track => has(track.id))) return t('editor.credits.all_tracks')
  return `${t('editor.credits.tracks')} ${trackRanges(album.value, model.value)}`
})
</script>
