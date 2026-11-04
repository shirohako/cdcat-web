<template>
  <EditorModal v-model="open" :title="$t('editor.cue.title')" wide as="div">
    <div class="space-y-3">
      <p class="text-sm text-body">{{ $t('editor.cue.hint') }}</p>
      <div class="flex flex-wrap items-center gap-2">
        <input ref="picker" type="file" accept=".cue,text/plain" class="hidden" @change="pick">
        <UiButton :icon="FileUp" icon-class="size-3.5" size="sm" class="gap-1 ring-1 ring-inset ring-line shadow-xs active:translate-y-px" @click="picker?.click()">{{ $t('editor.cue.choose') }}</UiButton>
        <span v-if="fileName" class="min-w-0 truncate text-xs text-meta">{{ fileName }}</span>
        <!-- Old rippers don't write UTF-8; when the guess is wrong the titles come out garbled and this reads the file again. -->
        <UiSelect v-if="bytes" v-model="encoding" :options="CUE_ENCODINGS" size="sm" class="ml-auto w-32" :aria-label="$t('editor.cue.encoding')" />
      </div>
      <textarea v-model="text" rows="6" class="textarea w-full font-mono text-xs" :placeholder="PLACEHOLDER" :aria-label="$t('editor.cue.paste_label')" />
      <p v-if="problem" class="text-xs text-danger">{{ $t(`editor.cue.${problem}`) }}</p>

      <template v-if="tracks.length">
        <div class="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <label class="flex items-center gap-2">
            <span class="text-meta">{{ $t('editor.cue.target') }}</span>
            <UiSelect v-model="target" :options="targetOptions" size="sm" class="w-44" />
          </label>
          <label class="flex items-center gap-2"><input v-model="mode" type="radio" value="update" class="radio radio-sm">{{ $t('editor.paste.mode_update') }}</label>
          <label class="flex items-center gap-2"><input v-model="mode" type="radio" value="append" class="radio radio-sm">{{ $t('editor.paste.mode_append') }}</label>
        </div>
        <div class="max-h-64 overflow-y-auto rounded-lg border border-line">
          <p v-for="track in tracks" :key="track.track_number" class="flex gap-3 border-t border-line px-3 py-1 text-xs first:border-t-0">
            <span class="w-8 shrink-0 text-right font-mono text-meta">{{ track.track_number }}</span>
            <span class="min-w-0 flex-1 truncate text-title">{{ track.title || '—' }}</span>
            <span v-if="track.performer" class="hidden max-w-48 shrink-0 truncate text-meta sm:block">{{ track.performer }}</span>
            <span class="w-10 shrink-0 text-right font-mono text-meta">{{ formatDurationInput(track.duration) || '—' }}</span>
          </p>
        </div>
        <ul class="space-y-0.5 text-xs text-meta">
          <li v-if="unknown === 1 && tracks.at(-1)?.duration === null">{{ $t('editor.cue.last_track') }}</li>
          <li v-else-if="unknown > 1">{{ $t('editor.cue.no_durations') }}</li>
          <li v-if="tracks.some(track => track.performer)">{{ $t('editor.cue.performers') }}</li>
        </ul>
      </template>
    </div>
    <template #footer>
      <span class="mr-auto text-xs text-meta">{{ $t('editor.paste.count', { count: tracks.length }) }}</span>
      <UiButton size="sm" class="ring-1 ring-inset ring-line shadow-xs active:translate-y-px" @click="open = false">{{ $t('common.cancel') }}</UiButton>
      <UiButton variant="primary" size="sm" class="shadow-xs active:translate-y-px" :disabled="!tracks.length" @click="apply">{{ $t('editor.paste.apply') }}</UiButton>
    </template>
  </EditorModal>
</template>

<script setup lang="ts">
import { FileUp } from '@lucide/vue'
import { importTracklist, sortedDiscs, tracksOn } from '~/utils/albumDocument'
import { CUE_ENCODINGS, decodeCue, detectCueEncoding, parseCue } from '~/utils/cueParser'
import { formatDurationInput } from '~/utils/tracklistParser'

/** A real sheet is a few kilobytes; this stops an audio file picked by mistake from being read into memory. */
const MAX_BYTES = 1024 * 1024
const PLACEHOLDER = 'FILE "album.flac" WAVE\n  TRACK 01 AUDIO\n    TITLE "Opening"\n    INDEX 01 00:00:00'

const open = defineModel<boolean>({ required: true })
const emit = defineEmits<{ applied: [{ added: number, updated: number }] }>()
const editor = useAlbumEditor()
const { t } = useI18n()

const picker = ref<HTMLInputElement | null>(null)
const fileName = ref('')
const bytes = shallowRef<Uint8Array | null>(null)
const encoding = ref('utf-8')
const text = ref('')
const tooBig = ref(false)
const target = ref(1)
const mode = ref<'update' | 'append'>('update')

const cue = computed(() => parseCue(text.value))
const tracks = computed(() => cue.value.tracks)
const unknown = computed(() => tracks.value.filter(track => track.duration === null).length)
const problem = computed(() => {
  if (tooBig.value) return 'too_big'
  return text.value.trim() && !tracks.value.length ? 'unreadable' : null
})

const discs = computed(() => sortedDiscs(editor.album.value))
const nextPosition = computed(() => (discs.value.at(-1)?.position ?? 0) + 1)
const targetOptions = computed(() => [
  ...discs.value.map(disc => ({ value: disc.position, label: t('editor.album.disc_n', { n: disc.position }) })),
  { value: nextPosition.value, label: t('editor.cue.new_disc', { n: nextPosition.value }) },
])

// The disc the sheet names when there is one to go to, else the first still empty, else a new one.
watch(() => [tracks.value.length, cue.value.disc_number], () => {
  const number = cue.value.disc_number
  target.value = number && number <= nextPosition.value
    ? number
    : discs.value.find(disc => !tracksOn(editor.album.value, disc.id).length)?.position ?? nextPosition.value
})

const read = () => {
  if (bytes.value) text.value = decodeCue(bytes.value, encoding.value)
}
watch(encoding, read)

const pick = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  tooBig.value = file.size > MAX_BYTES
  fileName.value = file.name
  bytes.value = null
  text.value = ''
  if (tooBig.value) return
  bytes.value = new Uint8Array(await file.arrayBuffer())
  encoding.value = detectCueEncoding(bytes.value)
  read()
}

const apply = () => {
  emit('applied', importTracklist(editor.album.value, [{
    position: target.value,
    title: null,
    tracks: tracks.value.map(track => ({ track_number: track.track_number, number_label: null, title: track.title, duration: track.duration, isrc: track.isrc })),
  }], mode.value))
  text.value = ''
  fileName.value = ''
  bytes.value = null
  open.value = false
}
</script>
