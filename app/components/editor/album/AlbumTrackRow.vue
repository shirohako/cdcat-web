<template>
  <div v-if="track" class="border-b border-line last:border-b-0" :class="{ 'bg-danger/10': errors.length }">
    <div class="flex items-center gap-1.5 px-2 py-1.5 sm:gap-2 sm:px-3">
      <input
        v-model.number="track.track_number"
        type="number"
        min="1"
        max="999"
        class="input input-sm w-14 shrink-0 px-1 text-center font-mono"
        :class="{ 'input-error': duplicateNumber || errorAt('track_number') }"
        :title="duplicateNumber ? $t('editor.album.duplicate_number') : $t('catalog.field.track_number')"
        :aria-label="$t('catalog.field.track_number')"
      >
      <input
        v-model="track.title"
        data-track-title
        class="input input-sm min-w-0 flex-1"
        :class="{ 'input-error': errorAt('title') }"
        :placeholder="$t('editor.album.track_title')"
        maxlength="500"
        @keydown.enter.prevent="emit('next')"
      >
      <EditorDurationInput v-model="track.duration" class="hidden shrink-0 sm:block" />
      <label class="flex shrink-0 cursor-pointer items-center gap-1 px-1 text-xs" :class="track.is_instrumental ? 'text-primary' : 'text-meta'" :title="$t('catalog.field.is_instrumental')">
        <input v-model="track.is_instrumental" type="checkbox" class="checkbox checkbox-xs">
        <Music2 :size="13" aria-hidden="true" />
        <span class="hidden md:inline">{{ $t('catalog.field.is_instrumental') }}</span>
      </label>
      <button v-if="badge" type="button" class="hidden shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium sm:inline" :class="badge.tone" :title="badge.title" @click="open = true">{{ badge.text }}</button>
      <button type="button" class="btn btn-sm shrink-0 px-1.5" :aria-expanded="open" :title="$t('editor.album.track_details')" @click="open = !open">
        <ChevronDown :size="14" class="transition-transform" :class="{ 'rotate-180': open }" />
      </button>
      <button type="button" class="btn btn-sm shrink-0 px-1.5 bg-danger/10 text-danger hover:bg-danger/20" :aria-label="$t('common.delete')" @click="remove"><X :size="14" /></button>
    </div>
    <p v-for="error in errors" :key="error.path" class="px-4 pb-1.5 text-[11px] text-danger">{{ error.message }}</p>

    <div v-if="open" class="space-y-4 border-t border-dashed border-line bg-sunken px-4 py-3">
      <div class="flex flex-wrap items-end gap-3">
        <label class="block sm:hidden">
          <span class="mb-1 block text-[11px] text-meta">{{ $t('catalog.field.duration') }}</span>
          <EditorDurationInput v-model="track.duration" />
        </label>
        <label class="block">
          <span class="mb-1 block text-[11px] text-meta">{{ $t('catalog.field.number_label') }}</span>
          <input v-model="track.number_label" class="input input-sm w-20 font-mono" placeholder="A1" maxlength="10">
        </label>
        <label class="block">
          <span class="mb-1 block text-[11px] text-meta">ISRC</span>
          <input v-model="track.isrc" class="input input-sm w-36 font-mono uppercase" placeholder="JPXX01234567" maxlength="12">
        </label>
        <label v-if="discs.length > 1" class="block">
          <span class="mb-1 block text-[11px] text-meta">{{ $t('editor.album.move_to_disc') }}</span>
          <UiSelect :model-value="String(track.disc_id)" :options="discOptions" size="sm" class="w-32" @change="moveTo" />
        </label>
        <div class="flex gap-1">
          <button type="button" class="btn btn-sm px-2" :title="$t('catalog.form.move_up')" @click="moveTrack(album, track.id, -1)"><ArrowUp :size="14" /></button>
          <button type="button" class="btn btn-sm px-2" :title="$t('catalog.form.move_down')" @click="moveTrack(album, track.id, 1)"><ArrowDown :size="14" /></button>
        </div>
      </div>

      <EditorAlbumTrackOriginals :track-id="track.id" />

      <div>
        <p class="mb-1 text-xs font-semibold text-body">{{ $t('catalog.collection.track_attributes') }}</p>
        <EditorAttributeRows v-model="album.track_attributes" compact subject="track" :owner="{ field: 'track_id', id: track.id }" :references="editor.references" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { RowId } from '~/types/document'
import type { UiSelectOption } from '~/components/ui/Select.vue'
import { ArrowDown, ArrowUp, ChevronDown, Music2, X } from '@lucide/vue'
import { findTrack, moveTrack, moveTrackToDisc, removeTrack, sortedDiscs } from '~/utils/albumDocument'
import { sameId } from '~/utils/documentRows'

const props = defineProps<{ trackId: RowId, duplicateNumber?: boolean }>()
const emit = defineEmits<{ next: [] }>()

const editor = useAlbumEditor()
const { t } = useI18n()
const { confirm } = useConfirm()
const album = computed(() => editor.album.value)
const track = computed(() => findTrack(album.value, props.trackId))
const discs = computed(() => sortedDiscs(album.value))
const discOptions = computed<UiSelectOption<string>[]>(() => discs.value.map(disc => ({ value: String(disc.id), label: t('editor.album.disc_n', { n: disc.position }) })))
const open = ref(false)

const errorAt = (field: string) => editor.errorAt('tracks', props.trackId, field)
const errors = computed(() => editor.errorsIn(`tracks.${props.trackId}`))
const originals = computed(() => album.value.track_originals.filter(row => sameId(row.track_id, props.trackId)))

/** A hint next to the title: how many 原曲 the track has, or that one of them needs fixing. */
const badge = computed(() => {
  if (!originals.value.length) return null
  const broken = originals.value.some(row => editor.errorsIn(`track_originals.${row.id}`).length)
  return {
    text: t('editor.originals.badge', { count: originals.value.length }),
    title: originals.value.map(row => row.original_title ?? String((editor.references.track?.[String(row.original_track_id)] as { title?: string } | undefined)?.title ?? `#${row.original_track_id}`)).join('\n'),
    tone: broken ? 'bg-danger/15 text-danger' : 'bg-primary/10 text-primary',
  }
})

const moveTo = (discId: string) => {
  const disc = discs.value.find(item => String(item.id) === discId)
  if (disc) moveTrackToDisc(album.value, props.trackId, disc.id)
}

const remove = async () => {
  if (typeof props.trackId === 'number' && !await confirm({ title: t('editor.album.remove_track_confirm', { title: track.value?.title ?? '' }) })) return
  removeTrack(album.value, props.trackId)
}
</script>
