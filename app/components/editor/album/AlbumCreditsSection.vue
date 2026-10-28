<template>
  <CatalogSection :title="$t('editor.album.section.credits')" :icon="Users" :description="$t('editor.credits.hint')">
    <template #actions>
      <UiButton :icon="ClipboardPaste" icon-class="size-3" size="xs" class="gap-1 ring-1 ring-inset ring-line shadow-xs active:translate-y-px" @click="pasteOpen = true">{{ $t('editor.paste_credits.button') }}</UiButton>
    </template>
    <div class="space-y-5 p-3 sm:p-5">
      <ul v-if="levelErrors.length" class="space-y-0.5 rounded-lg border border-danger/25 bg-danger/10 px-3 py-2 text-xs text-danger">
        <li v-for="error in levelErrors" :key="error.path">{{ error.message }}</li>
      </ul>

      <EditorAlbumCreditsByline />

      <div>
        <div class="mb-2.5 flex flex-wrap items-center justify-between gap-2">
          <h3 class="text-xs font-bold uppercase tracking-wider text-meta">{{ $t('editor.credits.contributors') }}</h3>
          <UiSegmented v-model="view" :items="views" :label="$t('editor.credits.view_label')" size="sm" />
        </div>
        <EditorAlbumCreditsByRole v-if="view === 'role'" />
        <EditorAlbumCreditsByTrack v-else />
      </div>
    </div>
    <EditorAlbumCreditsPasteDialog v-model="pasteOpen" />
  </CatalogSection>
</template>

<script setup lang="ts">
import { ClipboardPaste, Users } from '@lucide/vue'

/**
 * 参与创作的人 (docs/catalog/README.md#制作人员): the byline block (署名与发行) on top, then everyone else either by
 * role, a line per booklet line, or by track, a card per track; the choice is kept in this browser. 粘贴人员表 reads a
 * whole credit list at once.
 */
const editor = useAlbumEditor()
const { t } = useI18n()

const levelErrors = computed(() => editor.errorsIn('credits').filter(error => error.path.split('.').length === 3))

const VIEW_KEY = 'cdcat:album-editor:credits-view'
const readView = () => {
  try {
    return localStorage.getItem(VIEW_KEY) === 'track' ? 'track' : 'role'
  }
  catch {
    return 'role'
  }
}
// The editor is drawn in the browser only, so the stored choice is there from the start.
const view = ref<'role' | 'track'>(import.meta.client ? readView() : 'role')
watch(view, (value) => {
  try {
    localStorage.setItem(VIEW_KEY, value)
  }
  catch { /* the choice is a convenience */ }
})
const views = computed(() => [
  { value: 'role' as const, label: t('editor.credits.view_by_role'), icon: 'lucide:rows-3' },
  { value: 'track' as const, label: t('editor.credits.view_by_track'), icon: 'lucide:list-music' },
])

const pasteOpen = ref(false)
</script>
