<script setup lang="ts">
import type { RowId } from '~/types/document'
import { orderedTracks, sortedDiscs, tracksOn } from '~/utils/albumDocument'
import { sameId } from '~/utils/documentRows'

/**
 * Which tracks a credit line is on: a number for each track, by disc, to click on and off, and a button to take
 * them all, or none when they all are, after a question. None on means the whole album.
 */
const model = defineModel<RowId[]>({ required: true })

const { t } = useI18n()
const { confirm } = useConfirm()
const editor = useAlbumEditor()
const album = computed(() => editor.album.value)
const discs = computed(() => sortedDiscs(album.value).map(disc => ({ disc, tracks: tracksOn(album.value, disc.id) })).filter(item => item.tracks.length))
const all = computed(() => orderedTracks(album.value).map(track => track.id))

const on = (id: RowId) => model.value.some(item => sameId(item, id))
const allOn = computed(() => all.value.length > 0 && all.value.every(on))
const toggle = (id: RowId) => {
  model.value = all.value.filter(track => sameId(track, id) ? !on(track) : on(track))
}
/** Takes them all, or none when they all are; a choice already made goes only after a question. */
const setAll = async () => {
  const clearing = allOn.value
  if (model.value.length && !await confirm({
    variant: 'confirm',
    title: t(clearing ? 'editor.credits.clear_tracks_confirm_title' : 'editor.credits.all_tracks_confirm_title'),
    description: t(clearing ? 'editor.credits.clear_tracks_confirm_desc' : 'editor.credits.all_tracks_confirm_desc', { count: all.value.length }),
    confirmText: t(clearing ? 'editor.credits.no_tracks_on' : 'common.all'),
  })) return
  model.value = clearing ? [] : [...all.value]
}
</script>

<template>
  <span class="inline-flex min-w-0 flex-wrap items-center gap-1">
    <template v-for="{ disc, tracks } in discs" :key="disc.id">
      <span v-if="discs.length > 1" class="ml-1 text-10 font-semibold uppercase tracking-wide text-meta first:ml-0">Disc {{ disc.position }}</span>
      <button
        v-for="track in tracks"
        :key="track.id"
        type="button"
        class="grid h-6 min-w-6 place-items-center rounded-[0.3125rem] border px-1 font-mono text-11 transition-colors"
        :class="on(track.id) ? 'border-primary bg-primary text-on-primary' : 'border-line bg-card text-meta hover:border-faint hover:text-title'"
        :aria-pressed="on(track.id)"
        :title="track.title"
        @click="toggle(track.id)"
      >{{ track.number_label || track.track_number }}</button>
    </template>
    <UiButton v-if="all.length" size="xs" class="ring-1 ring-inset ring-line" @click="setAll">{{ allOn ? t('editor.credits.no_tracks_on') : t('common.all') }}</UiButton>
    <span v-if="!model.length" class="text-11 text-meta">{{ t('editor.credits.whole_album') }}</span>
  </span>
</template>
