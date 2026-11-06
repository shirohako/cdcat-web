<template>
  <CatalogSection :title="$t('editor.album.section.credits')" :icon="Users" :description="$t('editor.credits.hint')">
    <template #actions>
      <UiButton :icon="ClipboardPaste" icon-class="size-3" size="xs" class="gap-1 ring-1 ring-inset ring-line shadow-xs active:translate-y-px" @click="pasteOpen = true">{{ $t('editor.paste_credits.button') }}</UiButton>
    </template>
    <div class="space-y-4 p-3 sm:p-5">
      <ul v-if="levelErrors.length" class="space-y-0.5 rounded-lg border border-danger/25 bg-danger/10 px-3 py-2 text-xs text-danger">
        <li v-for="error in levelErrors" :key="error.path">{{ error.message }}</li>
      </ul>

      <EditorAlbumCreditsByline />

      <!-- What goes in the two blocks below it, with examples for both. -->
      <div v-if="hintClosed" class="flex justify-end">
        <UiButton :icon="CircleHelp" icon-class="size-3" size="xs" class="gap-1 ring-1 ring-inset ring-line" @click="setHintClosed(false)">{{ $t('editor.credits.show_hint') }}</UiButton>
      </div>
      <UiCollapse :open="!hintClosed">
        <EditorAlbumCreditsHint @close="setHintClosed(true)">
          <EditorAlbumCreditsExamples />
        </EditorAlbumCreditsHint>
      </UiCollapse>

      <EditorAlbumCreditsWholeAlbum />

      <EditorAlbumCreditsBlock name="tracks" :title="$t('editor.credits.contributors')" scope="tracks">
        <template #actions>
          <UiSegmented v-model="view" :items="views" :label="$t('editor.credits.view_label')" size="sm" />
        </template>
        <EditorAlbumCreditsByRole v-if="view === 'role'" />
        <EditorAlbumCreditsByTrack v-else />
      </EditorAlbumCreditsBlock>
    </div>
    <EditorAlbumCreditsPasteDialog v-model="pasteOpen" />
  </CatalogSection>
</template>

<script setup lang="ts">
import { CircleHelp, ClipboardPaste, Users } from '@lucide/vue'

/**
 * 参与创作的人 (docs/catalog/README.md#制作人员), in three blocks: the byline, the whole album's other credits, and the
 * tracks' credits, either by role, a line per booklet line, or by track, a card per track; that choice is kept in this
 * browser. 粘贴人员表 reads a whole credit list at once.
 */
const editor = useAlbumEditor()
const { t } = useI18n()

const levelErrors = computed(() => editor.errorsIn('credits').filter(error => error.path.split('.').length === 3))

const VIEW_KEY = 'cdcat:album-editor:credits-view'
const readView = () => {
  try {
    return localStorage.getItem(VIEW_KEY) === 'role' ? 'role' : 'track'
  }
  catch {
    return 'track'
  }
}
// The editor is drawn in the browser only, so the stored choice is there from the start.
const view = ref<'role' | 'track'>(import.meta.client ? readView() : 'track')
watch(view, (value) => {
  try {
    localStorage.setItem(VIEW_KEY, value)
  }
  catch { /* the choice is a convenience */ }
})
const views = computed(() => [
  { value: 'track' as const, label: t('editor.credits.view_by_track'), icon: 'lucide:list-music' },
  { value: 'role' as const, label: t('editor.credits.view_by_role'), icon: 'lucide:rows-3' },
])

const pasteOpen = ref(false)
const { closed: hintClosed, setClosed: setHintClosed } = useCreditHint('contributors')
</script>
