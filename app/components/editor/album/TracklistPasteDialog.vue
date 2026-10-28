<template>
  <EditorModal v-model="open" :title="$t('editor.paste.title')" wide>
    <div class="space-y-3">
      <p class="text-sm text-body">{{ $t('editor.paste.hint') }}</p>
      <textarea v-model="text" rows="10" class="textarea w-full font-mono text-xs" :placeholder="PLACEHOLDER" />
      <div class="flex flex-wrap gap-4 text-sm">
        <label class="flex items-center gap-2"><input v-model="mode" type="radio" value="update" class="radio radio-sm">{{ $t('editor.paste.mode_update') }}</label>
        <label class="flex items-center gap-2"><input v-model="mode" type="radio" value="append" class="radio radio-sm">{{ $t('editor.paste.mode_append') }}</label>
      </div>
      <div v-if="parsed.length" class="max-h-64 overflow-y-auto rounded-lg border border-line">
        <template v-for="disc in parsed" :key="disc.position">
          <p class="sticky top-0 bg-sunken px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-meta">
            {{ $t('editor.album.disc_n', { n: disc.position }) }}<span v-if="disc.title" class="normal-case"> · {{ disc.title }}</span>
          </p>
          <p v-for="track in disc.tracks" :key="track.track_number" class="flex gap-3 border-t border-line px-3 py-1 text-xs">
            <span class="w-8 shrink-0 text-right font-mono text-meta">{{ track.number_label ?? track.track_number }}</span>
            <span class="min-w-0 flex-1 truncate text-title">{{ track.title }}</span>
            <span class="shrink-0 font-mono text-meta">{{ formatDurationInput(track.duration) }}</span>
          </p>
        </template>
      </div>
    </div>
    <template #footer>
      <span class="mr-auto text-xs text-meta">{{ $t('editor.paste.count', { count: total }) }}</span>
      <button type="button" class="btn btn-sm ring-1 ring-inset ring-line shadow-xs transition active:translate-y-px" @click="open = false">{{ $t('common.cancel') }}</button>
      <button type="button" class="btn btn-primary btn-sm shadow-xs transition active:translate-y-px" :disabled="!total" @click="apply">{{ $t('editor.paste.apply') }}</button>
    </template>
  </EditorModal>
</template>

<script setup lang="ts">
import { importTracklist } from '~/utils/albumDocument'
import { formatDurationInput, parseTracklist } from '~/utils/tracklistParser'

const PLACEHOLDER = '01. Opening 3:45\n02. Main Theme 4:12\n\nDisc 2\n01. Bonus Track'

const open = defineModel<boolean>({ required: true })
const emit = defineEmits<{ applied: [{ added: number, updated: number }] }>()
const editor = useAlbumEditor()

const text = ref('')
const mode = ref<'update' | 'append'>(editor.album.value.tracks.length ? 'append' : 'update')
const parsed = computed(() => parseTracklist(text.value))
const total = computed(() => parsed.value.reduce((sum, disc) => sum + disc.tracks.length, 0))

const apply = () => {
  emit('applied', importTracklist(editor.album.value, parsed.value, mode.value))
  text.value = ''
  open.value = false
}
</script>
