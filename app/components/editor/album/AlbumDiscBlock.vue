<template>
  <div v-if="disc" class="overflow-hidden rounded-xl border" :class="[bonus ? 'border-pink-200 dark:border-pink-400/30' : 'border-line', errors.length ? 'ring-2 ring-danger/30' : '']">
    <div :id="`editor-disc-${disc.id}`" class="flex flex-wrap items-center gap-2 border-b border-line bg-sunken px-3 py-2">
      <Disc3 :size="14" class="shrink-0 text-meta" />
      <span class="shrink-0 text-sm font-bold text-body">{{ $t('editor.album.disc_n', { n: disc.position }) }}</span>
      <select v-model="disc.format" class="select select-sm h-8 w-28 text-xs" :aria-label="$t('catalog.field.format')">
        <option v-for="value in formats" :key="value" :value="value">{{ enumLabel('disc_format', value) }}</option>
      </select>
      <input v-model="disc.title" class="input input-sm h-8 min-w-32 flex-1 text-xs" :placeholder="$t('editor.album.disc_title_placeholder')" maxlength="500">
      <span v-if="bonus" class="shrink-0 rounded-full bg-pink-100 px-2 py-0.5 text-[10px] font-bold text-pink-600 dark:bg-pink-400/20 dark:text-pink-200" :title="$t('editor.album.bonus_disc_hint')">{{ $t('editor.album.bonus_disc', { name: bonus.name || '…' }) }}</span>
      <span class="ml-auto flex shrink-0 items-center gap-0.5">
        <button type="button" class="btn btn-ghost btn-xs px-1.5 text-[11px]" :title="$t('editor.toc.button')" @click="emit('toc')">TOC<span v-if="tocCount" class="text-primary">·{{ tocCount }}</span></button>
        <button type="button" class="btn btn-ghost btn-xs px-1.5" :disabled="first" :title="$t('catalog.form.move_up')" @click="moveDisc(album, disc.id, -1)"><ArrowUp :size="12" /></button>
        <button type="button" class="btn btn-ghost btn-xs px-1.5" :disabled="last" :title="$t('catalog.form.move_down')" @click="moveDisc(album, disc.id, 1)"><ArrowDown :size="12" /></button>
        <button type="button" class="btn btn-ghost btn-xs px-1.5 text-meta hover:text-danger" :title="$t('editor.album.remove_disc')" @click="remove"><Trash2 :size="12" /></button>
      </span>
    </div>
    <p v-for="error in errors" :key="error.path" class="border-b border-danger/25 bg-danger/10 px-3 py-1.5 text-[11px] text-danger">{{ error.message }}</p>

    <div ref="list">
      <EditorAlbumTrackRow
        v-for="track in tracks"
        :key="track.id"
        :track-id="track.id"
        :duplicate-number="duplicates.has(track.track_number)"
        @next="next(track.id)"
      />
      <p v-if="!tracks.length" class="px-4 py-3 text-xs text-meta">{{ $t('editor.album.no_tracks') }}</p>
    </div>

    <div class="flex items-center gap-2 border-t border-line px-3 py-1.5">
      <EditorAddButton small @click="add">{{ $t('editor.album.add_track') }}</EditorAddButton>
      <span v-if="duration" class="ml-auto font-mono text-[11px] text-meta">{{ formatDuration(duration) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { RowId } from '~/types/document'
import { ArrowDown, ArrowUp, Disc3, Trash2 } from '@lucide/vue'
import { addTrack, findDisc, moveDisc, removeDisc, sortedDiscs, tracksOn } from '~/utils/albumDocument'
import { sameId } from '~/utils/documentRows'

const props = defineProps<{ discId: RowId }>()
const emit = defineEmits<{ toc: [] }>()

const editor = useAlbumEditor()
const { t } = useI18n()
const { confirm } = useConfirm()
const { schema } = useCatalogSchema()
const { enumLabel, formatDuration } = useCatalogDisplay()

const album = computed(() => editor.album.value)
const disc = computed(() => findDisc(album.value, props.discId))
const formats = computed(() => schema.value?.enums?.disc_format ?? [])
const tracks = computed(() => tracksOn(album.value, props.discId))
const discs = computed(() => sortedDiscs(album.value))
const first = computed(() => sameId(discs.value[0]?.id, props.discId))
const last = computed(() => sameId(discs.value.at(-1)?.id, props.discId))
const bonus = computed(() => album.value.bonuses.find(item => sameId(item.id, disc.value?.bonus_id)) ?? null)
const tocCount = computed(() => album.value.disc_tocs.filter(toc => sameId(toc.disc_id, props.discId)).length)
const duration = computed(() => tracks.value.reduce((sum, track) => sum + (track.duration ?? 0), 0))
const errors = computed(() => editor.errorsIn(`discs.${props.discId}`))

/** Track numbers used twice on this disc. */
const duplicates = computed(() => {
  const seen = new Set<number>()
  const twice = new Set<number>()
  for (const track of tracks.value) {
    if (seen.has(track.track_number)) twice.add(track.track_number)
    seen.add(track.track_number)
  }
  return twice
})

const list = ref<HTMLElement | null>(null)
const focusTitle = (index: number) => nextTick(() => {
  list.value?.querySelectorAll<HTMLInputElement>('[data-track-title]')[index]?.focus()
})

const add = () => {
  addTrack(album.value, props.discId)
  focusTitle(tracks.value.length - 1)
}

/** Enter in a title moves to the next track, adding one after the last. */
const next = (trackId: RowId) => {
  const index = tracks.value.findIndex(track => sameId(track.id, trackId))
  if (index === tracks.value.length - 1) add()
  else focusTitle(index + 1)
}

const remove = async () => {
  if (tracks.value.length && !await confirm({ title: t('editor.album.remove_disc_confirm', { count: tracks.value.length }) })) return
  removeDisc(album.value, props.discId)
}
</script>
