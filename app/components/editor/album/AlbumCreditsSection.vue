<template>
  <CatalogSection :title="$t('editor.album.section.credits')" :icon="Users" :description="$t('editor.credits.hint')">
    <div class="space-y-4 p-3 pt-1 sm:p-5 sm:pt-1">
      <!-- A bar like the tracks section's. -->
      <div class="flex flex-wrap gap-1.5 rounded-md border border-primary/10 bg-primary/5 px-2.5 py-1.5">
        <UiButton :icon="CircleHelp" icon-class="size-3" size="xs" class="gap-1 shadow-xs active:translate-y-px [--ui-btn-bg:var(--card)] [--ui-btn-border:color-mix(in_oklab,var(--primary)_18%,transparent)] [--ui-btn-hover:var(--card-hover)]" @click="guideOpen = true">{{ $t('editor.credits.show_hint') }}</UiButton>
        <UiButton :icon="ClipboardPaste" icon-class="size-3" size="xs" class="gap-1 shadow-xs active:translate-y-px [--ui-btn-bg:var(--card)] [--ui-btn-border:color-mix(in_oklab,var(--primary)_18%,transparent)] [--ui-btn-hover:var(--card-hover)]" @click="pasteOpen = true">{{ $t('editor.paste_credits.button') }}</UiButton>
      </div>

      <ul v-if="levelErrors.length" class="space-y-0.5 rounded-lg border border-danger/25 bg-danger/10 px-3 py-2 text-xs text-danger">
        <li v-for="error in levelErrors" :key="error.path">{{ error.message }}</li>
      </ul>

      <EditorAlbumCreditsByline />

      <EditorAlbumCreditsWholeAlbum />

      <EditorAlbumCreditsBlock kind="tracks" :title="$t('editor.credits.contributors_tracks')" :description="$t('editor.credits.contributors_tracks_description')">
        <template #actions>
          <UiSegmented v-model="view" :items="views" :label="$t('editor.credits.view_label')" size="sm" />
        </template>
        <EditorAlbumCreditsByRole v-if="view === 'role'" />
        <EditorAlbumCreditsByTrack v-else />
      </EditorAlbumCreditsBlock>
    </div>
    <EditorAlbumCreditsPasteDialog v-model="pasteOpen" />
    <EditorAlbumCreditsGuideDialog v-model="guideOpen" />
  </CatalogSection>
</template>

<script setup lang="ts">
import { CircleHelp, ClipboardPaste, Users } from '@lucide/vue'

/**
 * 参与创作的人 (docs/catalog/README.md#制作人员), in three blocks: the byline, the whole album's other credits, and the
 * tracks' credits, either by role, a line per booklet line, or by track, a card per track; that choice is kept in this
 * browser. 粘贴人员表 reads a whole credit list at once. How to fill it all in is a dialog that opens by itself the first
 * time this section is shown in this browser, and from its 说明 button after that.
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

const GUIDE_KEY = 'cdcat:album-editor:credits-guide-seen'
const guideOpen = ref(false)
onMounted(() => {
  try {
    guideOpen.value = localStorage.getItem(GUIDE_KEY) !== '1'
  }
  catch {
    guideOpen.value = true
  }
})
// Seen once it has been closed, so a reload with it still open shows it again.
watch(guideOpen, (open) => {
  if (open) return
  try {
    localStorage.setItem(GUIDE_KEY, '1')
  }
  catch { /* the choice is a convenience */ }
})
</script>
