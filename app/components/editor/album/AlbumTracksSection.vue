<template>
  <CatalogSection :title="$t('editor.album.section.tracks')" :icon="ListMusic" :description="$t('editor.album.tracks_hint')">
    <div class="space-y-4 p-3 pt-1 sm:p-5 sm:pt-1">
      <!-- The ways to bring in a whole tracklist at once, right under the title. -->
      <div class="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-md border border-primary/10 bg-primary/5 px-2.5 py-1.5">
        <span class="flex items-center gap-1.5 text-13 font-semibold text-title">
          <Zap :size="14" class="shrink-0 text-primary" />{{ $t('editor.album.quick_import') }}
        </span>
        <span class="flex flex-wrap gap-1.5">
          <UiButton :icon="ClipboardPaste" icon-class="size-3" size="xs" class="gap-1 shadow-xs active:translate-y-px [--ui-btn-bg:var(--card)] [--ui-btn-border:color-mix(in_oklab,var(--primary)_18%,transparent)] [--ui-btn-hover:var(--card-hover)]" @click="pasteOpen = true">{{ $t('editor.paste.button') }}</UiButton>
          <UiButton :icon="FileMusic" icon-class="size-3" size="xs" class="gap-1 shadow-xs active:translate-y-px [--ui-btn-bg:var(--card)] [--ui-btn-border:color-mix(in_oklab,var(--primary)_18%,transparent)] [--ui-btn-hover:var(--card-hover)]" @click="cueOpen = true">{{ $t('editor.cue.button') }}</UiButton>
        </span>
      </div>
      <p class="flex items-start gap-1.5 rounded-md border border-info/15 bg-info/10 px-2.5 py-1 text-xs leading-5 text-body">
        <Lightbulb :size="13" class="mt-1 shrink-0 text-info" />{{ $t('editor.album.duration_tip') }}
      </p>
      <!-- Once the album is approved its tracks can't be removed in the editor, and a missing one is inserted rather than made by
           renaming the ones after it (docs/catalog/editing.md#删除曲目): said up front, new albums too. -->
      <div class="flex items-start gap-1.5 rounded-md border border-info/25 bg-info/10 px-2.5 py-1 text-xs leading-5 text-body">
        <Lock :size="13" class="mt-1 shrink-0 text-info" />
        <div>
          <p class="font-semibold text-title">{{ $t('editor.album.remove_tip_lead') }}</p>
          <p>{{ $t('editor.album.remove_tip') }}</p>
          <p>{{ $t('editor.album.remove_tip_insert') }}</p>
        </div>
      </div>
      <div v-if="moved.length" class="flex items-start gap-1.5 rounded-md border border-warning/30 bg-warning/10 px-2.5 py-1.5 text-xs leading-5 text-body">
        <TriangleAlert :size="13" class="mt-1 shrink-0 text-warning" />
        <div class="min-w-0 flex-1">
          <p>
            <span class="font-semibold text-title">{{ $t('editor.album.moved_lead') }}</span>{{ $t('editor.album.moved_text', { number: movedLabel(moved[0]!, false), from: movedLabel(moved[0]!, true), count: moved.length }) }}
          </p>
          <UiButton :icon="Undo2" icon-class="size-3" size="xs" class="mt-1 gap-1 ring-1 ring-inset ring-line shadow-xs active:translate-y-px" @click="restoreMoved">{{ $t('editor.album.moved_restore') }}</UiButton>
        </div>
      </div>

      <ul v-if="levelErrors.length" class="space-y-0.5 rounded-lg border border-danger/25 bg-danger/10 px-3 py-2 text-xs text-danger">
        <li v-for="error in levelErrors" :key="error.path">{{ error.message }}</li>
      </ul>

      <div v-if="!album.tracks.length" class="rounded-xl border-2 border-dashed border-primary/30 bg-primary/10 px-4 py-6 text-center">
        <p class="text-sm font-medium text-title">{{ $t('editor.album.empty_tracklist') }}</p>
        <p class="mt-1 text-xs text-meta">{{ $t('editor.album.empty_tracklist_hint') }}</p>
        <UiButton variant="primary" :icon="ClipboardPaste" icon-class="size-3.5" size="sm" class="mt-3 gap-1 shadow-xs active:translate-y-px" @click="pasteOpen = true">{{ $t('editor.paste.button') }}</UiButton>
      </div>

      <EditorAlbumDiscBlock
        v-for="disc in discs"
        :key="disc.id"
        :disc-id="disc.id"
        @toc="tocDisc = disc.id"
      />

      <div class="flex flex-wrap items-center gap-2">
        <EditorAddButton @click="addDisc(album)">{{ $t('editor.album.add_disc') }}</EditorAddButton>
        <span class="ml-auto text-xs text-meta">{{ $t('editor.album.totals', { discs: discs.length, tracks: album.tracks.length }) }}</span>
      </div>
    </div>

    <EditorAlbumTracklistPasteDialog v-model="pasteOpen" @applied="applied" />
    <EditorAlbumCueImportDialog v-model="cueOpen" @applied="applied" />
    <EditorAlbumDiscTocDialog :model-value="tocDisc !== null" :disc-id="tocDisc" @update:model-value="value => { if (!value) tocDisc = null }" />
  </CatalogSection>
</template>

<script setup lang="ts">
import type { RowId } from '~/types/document'
import type { MovedTitle } from '~/utils/albumDocument'
import { ClipboardPaste, FileMusic, Lightbulb, ListMusic, Lock, TriangleAlert, Undo2, Zap } from '@lucide/vue'
import { addDisc, findTrack, movedTitles, restoreTitles, sortedDiscs } from '~/utils/albumDocument'

const editor = useAlbumEditor()
const { t } = useI18n()

const album = computed(() => editor.album.value)
const discs = computed(() => sortedDiscs(album.value))
const pasteOpen = ref(false)
const cueOpen = ref(false)
const tocDisc = ref<RowId | null>(null)

/** Errors about the tracklist as a whole, e.g. "An album needs at least one track", or about all TOCs. */
const levelErrors = computed(() => [...editor.errorsIn('discs'), ...editor.errorsIn('tracks'), ...editor.errorsIn('disc_tocs')].filter(error => error.path.split('.').length === 3))

/** Saved tracks renamed to the title another one had before this edit. */
const moved = computed(() => movedTitles(album.value, editor.originalAlbum.value))
/** "Disc 2 · 6" with several discs, else "6": where a moved title is now, or where it came from. */
const movedLabel = (row: MovedTitle, from: boolean) => {
  const [disc, number] = from ? [row.fromDisc, row.fromNumber] : [row.disc, row.number]
  return discs.value.length > 1 ? t('editor.album.disc_track', { disc, number }) : String(number)
}
/**
 * Puts back the original titles of the saved tracks on the discs where titles moved, the first renamed one included
 * (it got the missing track's title, which no other track had): then the missing track can be inserted.
 */
const restoreMoved = () => {
  const original = editor.originalAlbum.value
  if (!original) return
  const discIds = new Set(moved.value.map(row => String(findTrack(album.value, row.trackId)?.disc_id)))
  restoreTitles(album.value, original, album.value.tracks.filter(track => typeof track.id === 'number' && discIds.has(String(track.disc_id))).map(track => track.id))
}

const applied = ({ added, updated }: { added: number, updated: number }) => {
  editor.notify(t('editor.paste.applied', { added, updated }))
}
</script>
