<template>
  <EditorModal v-model="open" :title="$t('editor.toc.title', { n: disc?.position ?? '' })" wide>
    <div class="space-y-4">
      <p class="text-sm text-body">{{ $t('editor.toc.hint') }}</p>
      <ul v-if="tocs.length" class="space-y-2">
        <li v-for="toc in tocs" :key="toc.id" class="flex flex-wrap items-center gap-3 rounded-lg bg-sunken px-3 py-2 text-xs">
          <span class="font-medium text-body">{{ $t('editor.toc.tracks', { first: toc.first_track, last: toc.last_track }) }}</span>
          <span class="font-mono text-meta">{{ $t('editor.toc.leadout', { offset: toc.leadout_offset }) }}</span>
          <span class="rounded bg-btn px-1.5 py-0.5 text-[10px] uppercase text-btn-content">{{ toc.source }}</span>
          <span v-if="toc.last_track - toc.first_track + 1 !== trackCount" class="text-warning">{{ $t('editor.toc.count_mismatch', { count: trackCount }) }}</span>
          <UiButton :icon="Trash2" :label="$t('common.delete')" icon-class="size-3" size="xs" class="ml-auto ring-1 ring-inset ring-line shadow-xs active:translate-y-px" @click="remove(toc.id)" />
        </li>
      </ul>
      <p v-else class="text-xs text-meta">{{ $t('editor.toc.none') }}</p>
      <div class="space-y-2">
        <textarea v-model="text" rows="6" class="textarea w-full font-mono text-[11px]" :placeholder="PLACEHOLDER" />
        <p v-if="text && !parsed" class="text-xs text-danger">{{ $t('editor.toc.unreadable') }}</p>
        <p v-else-if="parsed" class="text-xs text-meta">{{ $t('editor.toc.tracks', { first: parsed.first_track, last: parsed.last_track }) }} · {{ $t('editor.toc.leadout', { offset: parsed.leadout_offset }) }}</p>
      </div>
    </div>
    <template #footer>
      <UiButton size="sm" class="ring-1 ring-inset ring-line shadow-xs active:translate-y-px" @click="open = false">{{ $t('common.close') }}</UiButton>
      <UiButton variant="primary" size="sm" class="shadow-xs active:translate-y-px" :disabled="!parsed" @click="add">{{ $t('editor.toc.add') }}</UiButton>
    </template>
  </EditorModal>
</template>

<script setup lang="ts">
import type { RowId } from '~/types/document'
import { Trash2 } from '@lucide/vue'
import { findDisc, tracksOn } from '~/utils/albumDocument'
import { newKey } from '~/utils/documentKeys'
import { sameId } from '~/utils/documentRows'
import { parseToc } from '~/utils/tocParser'

const PLACEHOLDER = '     Track |   Start  |  Length  | Start sector | End sector\n        1  |  0:00.00 |  5:32.14 |         0    |    24913'

/** The TOCs of one disc, pasted from an EAC or XLD log; the server computes the Disc IDs. */
const props = defineProps<{ discId: RowId | null }>()
const open = defineModel<boolean>({ required: true })
const editor = useAlbumEditor()

const disc = computed(() => findDisc(editor.album.value, props.discId))
const tocs = computed(() => editor.album.value.disc_tocs.filter(toc => sameId(toc.disc_id, props.discId)))
const trackCount = computed(() => props.discId === null ? 0 : tracksOn(editor.album.value, props.discId).length)
const text = ref('')
const parsed = computed(() => text.value.trim() ? parseToc(text.value) : null)

const add = () => {
  if (!parsed.value || props.discId === null) return
  editor.album.value.disc_tocs.push({ id: newKey('toc'), disc_id: props.discId, ...parsed.value })
  text.value = ''
}
const remove = (id: RowId) => {
  editor.album.value.disc_tocs = editor.album.value.disc_tocs.filter(toc => !sameId(toc.id, id))
}
</script>
