<template>
  <CatalogSection :title="$t('editor.album.section.tracks')" :icon="ListMusic" :description="$t('editor.album.tracks_hint')">
    <template #actions>
      <button type="button" class="btn btn-xs gap-1 ring-1 ring-inset ring-line shadow-xs transition active:translate-y-px" @click="pasteOpen = true"><ClipboardPaste :size="12" />{{ $t('editor.paste.button') }}</button>
    </template>

    <div class="space-y-4 p-3 sm:p-5">
      <ul v-if="levelErrors.length" class="space-y-0.5 rounded-lg border border-danger/25 bg-danger/10 px-3 py-2 text-xs text-danger">
        <li v-for="error in levelErrors" :key="error.path">{{ error.message }}</li>
      </ul>

      <div v-if="!album.tracks.length" class="rounded-xl border-2 border-dashed border-primary/30 bg-primary/10 px-4 py-6 text-center">
        <p class="text-sm font-medium text-title">{{ $t('editor.album.empty_tracklist') }}</p>
        <p class="mt-1 text-xs text-meta">{{ $t('editor.album.empty_tracklist_hint') }}</p>
        <button type="button" class="btn btn-primary btn-sm mt-3 gap-1 shadow-xs transition active:translate-y-px" @click="pasteOpen = true"><ClipboardPaste :size="14" />{{ $t('editor.paste.button') }}</button>
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
    <EditorAlbumDiscTocDialog :model-value="tocDisc !== null" :disc-id="tocDisc" @update:model-value="value => { if (!value) tocDisc = null }" />
  </CatalogSection>
</template>

<script setup lang="ts">
import type { RowId } from '~/types/document'
import { ClipboardPaste, ListMusic } from '@lucide/vue'
import { addDisc, sortedDiscs } from '~/utils/albumDocument'

const editor = useAlbumEditor()
const { t } = useI18n()

const album = computed(() => editor.album.value)
const discs = computed(() => sortedDiscs(album.value))
const pasteOpen = ref(false)
const tocDisc = ref<RowId | null>(null)

/** Errors about the tracklist as a whole, e.g. "An album needs at least one track". */
const levelErrors = computed(() => [...editor.errorsIn('discs'), ...editor.errorsIn('tracks')].filter(error => error.path.split('.').length === 3))

const applied = ({ added, updated }: { added: number, updated: number }) => {
  editor.notify(t('editor.paste.applied', { added, updated }))
}
</script>
