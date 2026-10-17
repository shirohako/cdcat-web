<template>
  <div class="relative">
    <button type="button" class="select select-sm flex w-full items-center text-left" :aria-expanded="open" @click="open = !open">
      <span class="truncate">{{ summary }}</span>
    </button>
    <template v-if="open">
      <div class="fixed inset-0 z-30" @click="open = false" />
      <div class="absolute right-0 z-40 mt-1 max-h-80 w-72 overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
        <div v-for="disc in discs" :key="disc.id">
          <div class="sticky top-0 flex items-center gap-2 bg-gray-50 px-3 py-1 text-[11px] font-bold text-gray-500">
            {{ $t('editor.album.disc_n', { n: disc.position }) }}
            <button type="button" class="ml-auto font-normal text-primary hover:underline" @click="setDisc(disc.id, true)">{{ $t('common.all') }}</button>
            <button type="button" class="font-normal text-gray-500 hover:underline" @click="setDisc(disc.id, false)">{{ $t('common.none') }}</button>
          </div>
          <label v-for="track in tracksOn(album, disc.id)" :key="track.id" class="flex cursor-pointer items-center gap-2 px-3 py-1 text-xs hover:bg-gray-50">
            <input type="checkbox" class="checkbox checkbox-xs" :checked="has(track.id)" :disabled="has(track.id) && model.length === 1" @change="toggle(track.id)">
            <span class="w-6 shrink-0 text-right font-mono text-gray-400">{{ track.number_label || track.track_number }}</span>
            <span class="truncate text-gray-700">{{ track.title || '—' }}</span>
          </label>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { RowId } from '~/types/document'
import { orderedTracks, sortedDiscs, tracksOn } from '~/utils/albumDocument'
import { sameId } from '~/utils/documentRows'

/** Picks tracks of the album for a credit; at least one stays ticked. */
const model = defineModel<RowId[]>({ required: true })
const editor = useAlbumEditor()
const { t } = useI18n()

const album = computed(() => editor.album.value)
const discs = computed(() => sortedDiscs(album.value))
const open = ref(false)

const has = (id: RowId) => model.value.some(item => sameId(item, id))
const toggle = (id: RowId) => { model.value = has(id) ? model.value.filter(item => !sameId(item, id)) : [...model.value, id] }
const setDisc = (discId: RowId, on: boolean) => {
  const ids = tracksOn(album.value, discId).map(track => track.id)
  const rest = model.value.filter(item => !ids.some(id => sameId(id, item)))
  const next = on ? [...rest, ...ids] : rest
  if (next.length) model.value = next
}

/** "1–3, 5", or "1: 1–3 · 2: 4" on albums with several discs. */
const summary = computed(() => {
  const all = orderedTracks(album.value)
  if (!model.value.length) return t('editor.credits.no_tracks')
  if (all.length > 1 && all.every(track => has(track.id))) return t('editor.credits.all_tracks')
  const parts = discs.value.map((disc) => {
    const tracks = tracksOn(album.value, disc.id)
    const ranges: string[] = []
    let start = -1
    tracks.forEach((track, index) => {
      const on = has(track.id)
      if (on && start < 0) start = index
      const endsHere = on && (index === tracks.length - 1 || !has(tracks[index + 1]!.id))
      if (endsHere) {
        const label = (position: number) => tracks[position]!.number_label || String(tracks[position]!.track_number)
        ranges.push(start === index ? label(index) : `${label(start)}–${label(index)}`)
        start = -1
      }
    })
    return ranges.length ? (discs.value.length > 1 ? `${disc.position}: ${ranges.join(', ')}` : ranges.join(', ')) : ''
  }).filter(Boolean)
  return `${t('editor.credits.tracks')} ${parts.join(' · ')}`
})
</script>
