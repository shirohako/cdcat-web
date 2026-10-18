<template>
  <CatalogSection :title="$t('editor.album.section.tracks')" :icon="ListMusic" tone="indigo" :description="$t('editor.album.tracks_hint')">
    <template #actions>
      <button type="button" class="btn btn-xs gap-1" @click="pasteOpen = true"><ClipboardPaste :size="12" />{{ $t('editor.paste.button') }}</button>
      <button type="button" class="btn btn-xs gap-1" :disabled="suggesting || !album.tracks.length" @click="suggest">
        <span v-if="suggesting" class="loading loading-spinner loading-xs" /><Sparkles v-else :size="12" />{{ $t('editor.work.find_same') }}
      </button>
    </template>

    <div class="space-y-4 p-3 sm:p-5">
      <ul v-if="levelErrors.length" class="space-y-0.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
        <li v-for="error in levelErrors" :key="error.path">{{ error.message }}</li>
      </ul>

      <div v-if="!album.tracks.length" class="rounded-xl border-2 border-dashed border-indigo-200 bg-indigo-50/40 px-4 py-6 text-center">
        <p class="text-sm font-medium text-indigo-900">{{ $t('editor.album.empty_tracklist') }}</p>
        <p class="mt-1 text-xs text-indigo-700/80">{{ $t('editor.album.empty_tracklist_hint') }}</p>
        <button type="button" class="btn btn-primary btn-sm mt-3 gap-1" @click="pasteOpen = true"><ClipboardPaste :size="14" />{{ $t('editor.paste.button') }}</button>
      </div>

      <div v-if="suggestionCount" class="flex flex-wrap items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
        <Sparkles :size="13" class="shrink-0" />
        <span>{{ $t('editor.work.found', { count: suggestionCount }) }}</span>
        <button type="button" class="btn btn-xs ml-auto" @click="acceptAll">{{ $t('editor.work.accept_all') }}</button>
      </div>

      <EditorAlbumDiscBlock
        v-for="disc in discs"
        :key="disc.id"
        :disc-id="disc.id"
        :suggestions="suggestions"
        @toc="tocDisc = disc.id"
        @dismiss="dismiss"
      />

      <div class="flex flex-wrap items-center gap-2">
        <EditorAddButton @click="addDisc(album)">{{ $t('editor.album.add_disc') }}</EditorAddButton>
        <span class="ml-auto text-xs text-gray-400">{{ $t('editor.album.totals', { discs: discs.length, tracks: album.tracks.length }) }}</span>
      </div>
    </div>

    <EditorAlbumTracklistPasteDialog v-model="pasteOpen" @applied="applied" />
    <EditorAlbumDiscTocDialog :model-value="tocDisc !== null" :disc-id="tocDisc" @update:model-value="value => { if (!value) tocDisc = null }" />
  </CatalogSection>
</template>

<script setup lang="ts">
import type { RowId } from '~/types/document'
import type { WorkSuggestion } from '~/types/work'
import { ClipboardPaste, ListMusic, Sparkles } from '@lucide/vue'
import { addDisc, findTrack, orderedTracks, sortedDiscs } from '~/utils/albumDocument'
import { sameId } from '~/utils/documentRows'

const editor = useAlbumEditor()
const { t } = useI18n()
const { $api } = useNuxtApp()
const { roleCategory } = useCatalogSchema()
const { localizeError } = useLocalizedApiError()

const album = computed(() => editor.album.value)
const discs = computed(() => sortedDiscs(album.value))
const pasteOpen = ref(false)
const tocDisc = ref<RowId | null>(null)

/** Errors about the tracklist as a whole, e.g. "An album needs at least one track". */
const levelErrors = computed(() => [...editor.errorsIn('discs'), ...editor.errorsIn('tracks')].filter(error => error.path.split('.').length === 3))

const applied = ({ added, updated }: { added: number, updated: number }) => {
  editor.notify(t('editor.paste.applied', { added, updated }))
}

// ---- same-song candidates (POST /works/suggest) ----

const suggestions = ref<Record<string, WorkSuggestion[]>>({})
const suggesting = ref(false)

const candidatesFor = (trackId: string) => {
  const track = findTrack(album.value, trackId)
  return (suggestions.value[trackId] ?? []).filter(candidate => !sameId(candidate.work_id, track?.work_id))
}
const suggestionCount = computed(() => album.value.tracks.filter(track => candidatesFor(String(track.id)).length).length)

/** Composers and lyricists of a track, credited on it or on the whole album, improve the ranking. */
const writers = (trackId: RowId) => [...new Set(album.value.credits
  .filter(credit => (credit.track_id === null || sameId(credit.track_id, trackId)) && typeof credit.artist_id === 'number'
    && ['composition', 'lyrics'].includes(roleCategory(credit.role)))
  .map(credit => credit.artist_id as number))].slice(0, 20)

const suggest = async () => {
  suggesting.value = true
  try {
    const tracks = orderedTracks(album.value).filter(track => track.title.trim())
      .map(track => ({ key: String(track.id), title: track.title.trim(), artist_ids: writers(track.id) }))
    const result = await $api<{ suggestions: Record<string, WorkSuggestion[]> }>('/v1/works/suggest', {
      method: 'POST',
      body: { tracks, album_artist_ids: album.value.artists.map(row => row.artist_id).filter(id => typeof id === 'number') },
    })
    suggestions.value = result.suggestions ?? {}
    for (const candidate of Object.values(suggestions.value).flat()) {
      editor.remember('work', candidate.work_id, { id: candidate.work_id, title: candidate.title, tracks_count: candidate.tracks_count })
    }
    if (!suggestionCount.value) editor.notify(t('editor.work.none_found'), 'info')
  } catch (error) {
    editor.notify(localizeError(error), 'error')
  } finally {
    suggesting.value = false
  }
}

const dismiss = (trackId: RowId, workId: number) => {
  const key = String(trackId)
  suggestions.value = { ...suggestions.value, [key]: (suggestions.value[key] ?? []).filter(candidate => candidate.work_id !== workId) }
}

/** Links every track that has no song of its own yet to its best candidate. */
const acceptAll = () => {
  let linked = 0
  for (const track of album.value.tracks) {
    const best = candidatesFor(String(track.id))[0]
    const own = track.work_id === null
      || (typeof track.work_id === 'number' && Number((editor.references.work?.[String(track.work_id)] as { tracks_count?: number } | undefined)?.tracks_count ?? 1) <= 1)
    if (best && own) {
      track.work_id = best.work_id
      linked++
    }
  }
  editor.notify(t('editor.work.linked', { count: linked }))
}
</script>
