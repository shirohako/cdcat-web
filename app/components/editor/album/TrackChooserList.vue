<template>
  <div>
    <div v-for="disc in discs" :key="disc.id">
      <div class="sticky top-0 flex items-center gap-2 bg-sunken px-3 py-1 text-[11px] font-bold text-meta">
        {{ $t('editor.album.disc_n', { n: disc.position }) }}
        <button type="button" class="btn btn-xs ml-auto font-normal ring-1 ring-inset ring-line shadow-xs transition active:translate-y-px" @click="emit('setDisc', disc.id, true)">{{ $t('common.all') }}</button>
        <button type="button" class="btn btn-xs font-normal ring-1 ring-inset ring-line shadow-xs transition active:translate-y-px" @click="emit('setDisc', disc.id, false)">{{ $t('common.none') }}</button>
      </div>
      <label v-for="track in tracksOn(album, disc.id)" :key="track.id" class="flex cursor-pointer items-center gap-2 px-3 py-1 text-xs transition-colors hover:bg-card-hover active:bg-card-active">
        <input type="checkbox" class="checkbox checkbox-xs" :checked="has(track.id)" :disabled="has(track.id) && modelValue.length === 1" @change="emit('toggle', track.id)">
        <span class="w-6 shrink-0 text-right font-mono text-meta">{{ track.number_label || track.track_number }}</span>
        <span class="truncate text-body">{{ track.title || '—' }}</span>
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { RowId } from '~/types/document'
import { sortedDiscs, tracksOn } from '~/utils/albumDocument'
import { sameId } from '~/utils/documentRows'

/** The album's tracks by disc with a checkbox each, for TrackChooser. */
const props = defineProps<{ modelValue: RowId[] }>()
const emit = defineEmits<{ toggle: [id: RowId], setDisc: [discId: RowId, on: boolean] }>()
const editor = useAlbumEditor()

const album = computed(() => editor.album.value)
const discs = computed(() => sortedDiscs(album.value))
const has = (id: RowId) => props.modelValue.some(item => sameId(item, id))
</script>
