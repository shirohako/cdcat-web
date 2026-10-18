<template>
  <div>
    <div v-for="disc in discs" :key="disc.id">
      <div class="sticky top-0 flex items-center gap-2 bg-gray-50 px-3 py-1 text-[11px] font-bold text-gray-500">
        {{ $t('editor.album.disc_n', { n: disc.position }) }}
        <button type="button" class="ml-auto font-normal text-primary hover:underline" @click="emit('setDisc', disc.id, true)">{{ $t('common.all') }}</button>
        <button type="button" class="font-normal text-gray-500 hover:underline" @click="emit('setDisc', disc.id, false)">{{ $t('common.none') }}</button>
      </div>
      <label v-for="track in tracksOn(album, disc.id)" :key="track.id" class="flex cursor-pointer items-center gap-2 px-3 py-1 text-xs hover:bg-gray-50">
        <input type="checkbox" class="checkbox checkbox-xs" :checked="has(track.id)" :disabled="has(track.id) && modelValue.length === 1" @change="emit('toggle', track.id)">
        <span class="w-6 shrink-0 text-right font-mono text-gray-400">{{ track.number_label || track.track_number }}</span>
        <span class="truncate text-gray-700">{{ track.title || '—' }}</span>
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
