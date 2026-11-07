<template>
  <EditorModal v-model="open" :title="t('editor.paste.title')" wide>
    <div class="space-y-3">
      <p class="whitespace-pre-line text-sm text-body">{{ t('editor.paste.hint') }}</p>
      <EditorPasteExamples :formats="TRACKLIST_FORMATS" scope="editor.paste" />
      <textarea v-model="text" rows="10" class="textarea w-full font-mono text-xs" :placeholder="t('editor.paste.placeholder')" :aria-label="t('editor.paste.title')" />
      <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
        <UiButton variant="primary" size="sm" icon="lucide:scan-text" class="shadow-xs active:translate-y-px" :disabled="!text.trim()" @click="recognize">{{ t('editor.paste.recognize') }}</UiButton>
        <label class="flex items-center gap-2 text-sm"><input v-model="mode" type="radio" value="update" class="radio radio-sm">{{ t('editor.paste.mode_update') }}</label>
        <label class="flex items-center gap-2 text-sm"><input v-model="mode" type="radio" value="append" class="radio radio-sm">{{ t('editor.paste.mode_append') }}</label>
      </div>

      <template v-if="result">
        <p v-if="stale" class="rounded-lg bg-warning/10 px-3 py-2 text-xs text-warning">{{ t('editor.paste.stale') }}</p>
        <div v-if="result.artists" class="flex flex-wrap items-center gap-2 text-xs">
          <span class="text-meta">{{ t('editor.paste.artist_side') }}</span>
          <UiSegmented v-model="side" :items="sides" :label="t('editor.paste.artist_side')" size="sm" />
          <span v-if="!result.artists.sure && result.artists.side === result.artists.guess" class="text-warning">{{ t('editor.paste.side_unsure') }}</span>
        </div>
        <div v-if="total" class="max-h-72 overflow-y-auto rounded-lg border border-line" :class="stale && 'opacity-60'">
          <template v-for="disc in result.discs" :key="disc.position">
            <p class="sticky top-0 bg-sunken px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-meta">
              {{ t('editor.album.disc_n', { n: disc.position }) }}<span v-if="disc.title" class="normal-case"> · {{ disc.title }}</span>
            </p>
            <p v-for="track in disc.tracks" :key="track.track_number" class="flex items-baseline gap-3 border-t border-line px-3 py-1 text-xs">
              <span class="w-8 shrink-0 text-right font-mono text-meta">{{ track.number_label ?? track.track_number }}</span>
              <span class="min-w-0 flex-1 truncate">
                <span class="text-title">{{ track.title }}</span>
                <span v-if="track.artist" class="ml-2 text-faint line-through" :title="t('editor.paste.artist_dropped')">{{ track.artist }}</span>
              </span>
              <span class="shrink-0 font-mono text-meta">{{ formatDurationInput(track.duration) }}</span>
            </p>
          </template>
        </div>
        <p v-else class="rounded-lg bg-sunken px-3 py-2 text-xs text-meta">{{ t('editor.paste.nothing') }}</p>
      </template>
    </div>
    <template #footer>
      <span class="mr-auto text-xs text-meta">{{ result ? t('editor.paste.count', { count: total }) : '' }}</span>
      <UiButton size="sm" class="ring-1 ring-inset ring-line shadow-xs active:translate-y-px" @click="open = false">{{ t('common.cancel') }}</UiButton>
      <UiButton variant="primary" size="sm" class="shadow-xs active:translate-y-px" :disabled="!total || stale" @click="apply">{{ t('editor.paste.apply') }}</UiButton>
    </template>
  </EditorModal>
</template>

<script setup lang="ts">
import type { UiSegmentedItem } from '~/components/ui/Segmented.vue'
import type { ArtistSide } from '~/utils/tracklistParser'
import { importTracklist } from '~/utils/albumDocument'
import { formatDurationInput, readTracklist, TRACKLIST_FORMATS } from '~/utils/tracklistParser'

/**
 * 粘贴曲目表: a tracklist pasted from a booklet, a shop page or a music database (examples of each on hover), read by
 * utils/tracklistParser when 识别 is pressed, not as it is typed; after an edit the preview waits for the next 识别.
 * Only discs, numbers, titles and durations are taken. When the lines read "A - B", the side guessed to be the artist
 * is cut off and shown struck through; the switch above the preview picks the other side or keeps lines whole.
 */
const open = defineModel<boolean>({ required: true })
const emit = defineEmits<{ applied: [{ added: number, updated: number }] }>()
const { t } = useI18n()
const editor = useAlbumEditor()

const text = ref('')
const mode = ref<'update' | 'append'>(editor.album.value.tracks.length ? 'append' : 'update')
/** The text as of the last 识别, null before it */
const read = ref<string | null>(null)
/** The side picked on the switch; undefined takes the guess */
const picked = ref<ArtistSide>()

const result = computed(() => read.value === null ? null : readTracklist(read.value, { artistSide: picked.value }))
const stale = computed(() => read.value !== null && text.value !== read.value)
const total = computed(() => result.value?.discs.reduce((sum, disc) => sum + disc.tracks.length, 0) ?? 0)

const side = computed<ArtistSide>({
  get: () => result.value?.artists?.side ?? 'none',
  set: (value) => { picked.value = value },
})
const sides = computed<UiSegmentedItem<ArtistSide>[]>(() => [
  { value: 'right', label: t('editor.paste.side_right') },
  { value: 'left', label: t('editor.paste.side_left') },
  { value: 'none', label: t('editor.paste.side_none') },
])

const recognize = () => {
  read.value = text.value
  picked.value = undefined
}

watch(open, (value) => {
  if (!value) return
  text.value = ''
  read.value = null
  picked.value = undefined
  mode.value = editor.album.value.tracks.length ? 'append' : 'update'
})

const apply = () => {
  if (!result.value) return
  emit('applied', importTracklist(editor.album.value, result.value.discs, mode.value))
  open.value = false
}
</script>
