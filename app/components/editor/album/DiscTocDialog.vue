<template>
  <EditorModal v-model="open" :title="$t('editor.toc.title', { n: disc?.position ?? '' })" wide as="div">
    <div class="space-y-4">
      <p class="text-sm text-body">{{ $t('editor.toc.hint') }}</p>

      <div v-if="tocs.length" class="space-y-2">
        <EditorAlbumDiscTocCard
          v-for="(toc, index) in tocs"
          :key="toc.id"
          :toc="toc"
          :label="$t('editor.toc.toc_n', { n: index + 1 })"
          :track-count="tracks.length"
          :errors="editor.errorsIn(`disc_tocs.${toc.id}`)"
        >
          <template #actions>
            <UiButton :icon="Timer" icon-class="size-3" size="xs" class="ring-1 ring-inset ring-line shadow-xs active:translate-y-px" :disabled="fillProblem(toc) !== null" :tooltip="fillProblem(toc) ?? $t('editor.toc.fill_hint')" @click="fill(toc)">
              {{ $t('editor.toc.fill_durations') }}
            </UiButton>
            <UiButton :icon="Trash2" :label="$t('common.delete')" icon-class="size-3" size="xs" class="ring-1 ring-inset ring-line shadow-xs active:translate-y-px" @click="remove(toc.id)" />
          </template>
        </EditorAlbumDiscTocCard>
      </div>
      <p v-else class="text-xs text-meta">{{ $t('editor.toc.none') }}</p>

      <div class="space-y-2">
        <textarea v-model="text" rows="6" class="textarea w-full font-mono text-[11px]" :placeholder="PLACEHOLDER" :aria-label="$t('editor.toc.paste_label')" />
        <p v-if="problem" class="text-xs text-danger">{{ $t(`editor.toc.unreadable.${problem}`) }}</p>
        <EditorAlbumDiscTocCard v-else-if="pending" :toc="pending" :label="$t('editor.toc.pasted')" :track-count="tracks.length">
          <div v-if="pending.offsets.length > 1" class="flex flex-wrap items-center gap-2">
            <span class="text-meta">{{ $t('editor.toc.data_track') }}</span>
            <UiSelect v-model="dataChoice" :options="dataOptions" size="sm" class="h-8 w-56 text-xs" :aria-label="$t('editor.toc.data_track')" />
            <span v-if="detected" class="text-meta">{{ $t('editor.toc.data_detected') }}</span>
          </div>
          <p v-if="duplicate" class="text-warning">{{ $t('editor.toc.duplicate') }}</p>
          <p v-if="!isCd" class="text-warning">{{ $t('editor.toc.not_cd') }}</p>
        </EditorAlbumDiscTocCard>
      </div>

      <p class="text-xs text-meta">{{ $t('editor.toc.ids_hint') }}</p>
    </div>
    <template #footer>
      <UiButton size="sm" class="ring-1 ring-inset ring-line shadow-xs active:translate-y-px" @click="open = false">{{ $t('common.close') }}</UiButton>
      <UiButton variant="primary" size="sm" class="shadow-xs active:translate-y-px" :disabled="!pending || duplicate" @click="add">{{ $t('editor.toc.add') }}</UiButton>
    </template>
  </EditorModal>
</template>

<script setup lang="ts">
import type { UiSelectOption } from '~/components/ui/Select.vue'
import type { AlbumDocument, RowId } from '~/types/document'
import { Timer, Trash2 } from '@lucide/vue'
import { findDisc, tracksOn } from '~/utils/albumDocument'
import { audioRows, sameToc, toSeconds } from '~/utils/discToc'
import { newKey } from '~/utils/documentKeys'
import { sameId } from '~/utils/documentRows'
import { parseToc } from '~/utils/tocParser'

type TocRow = AlbumDocument['disc_tocs'][number]
type DataChoice = 'none' | 'last' | 'first'

const PLACEHOLDER = '     Track |   Start  |  Length  | Start sector | End sector\n        1  |  0:00.00 |  5:32.14 |         0    |    24913'

/**
 * The TOCs of one disc, pasted from an EAC, XLD or CUERipper log; only the numbers are kept. The server computes the
 * disc ids, which the album page shows. A TOC whose audio tracks match the disc can fill in the missing durations.
 */
const props = defineProps<{ discId: RowId | null }>()
const open = defineModel<boolean>({ required: true })
const editor = useAlbumEditor()
const { t } = useI18n()

const disc = computed(() => findDisc(editor.album.value, props.discId))
const tocs = computed(() => editor.album.value.disc_tocs.filter(toc => sameId(toc.disc_id, props.discId)))
const tracks = computed(() => props.discId === null ? [] : tracksOn(editor.album.value, props.discId))
const isCd = computed(() => disc.value?.format === 'cd' || disc.value?.format === 'sacd')

const text = ref('')
const result = computed(() => text.value.trim() ? parseToc(text.value) : null)
const parsed = computed(() => result.value && typeof result.value === 'object' ? result.value : null)
const problem = computed(() => typeof result.value === 'string' ? result.value : null)

// The log's gap before a data track picks "last track"; the contributor can change it.
const dataChoice = ref<DataChoice>('none')
watch(parsed, (toc) => { dataChoice.value = toc?.data_track ? 'last' : 'none' })
const detected = computed(() => !!parsed.value?.data_track && dataChoice.value === 'last')
const dataOptions = computed<UiSelectOption<DataChoice>[]>(() => [
  { value: 'none', label: t('editor.toc.data_none') },
  { value: 'last', label: t('editor.toc.data_last') },
  { value: 'first', label: t('editor.toc.data_first') },
])
const pending = computed(() => {
  if (!parsed.value) return null
  const dataTrack = { none: null, last: parsed.value.last_track, first: parsed.value.first_track }[dataChoice.value]
  return { ...parsed.value, data_track: parsed.value.offsets.length > 1 ? dataTrack : null }
})
const duplicate = computed(() => !!pending.value && tocs.value.some(toc => sameToc(toc, pending.value!)))

const add = () => {
  if (!pending.value || duplicate.value || props.discId === null) return
  editor.album.value.disc_tocs.push({ id: newKey('toc'), disc_id: props.discId, ...pending.value })
  text.value = ''
}
const remove = (id: RowId) => {
  editor.album.value.disc_tocs = editor.album.value.disc_tocs.filter(toc => !sameId(toc.id, id))
}

/** Why a TOC can't fill durations: its audio tracks don't match the disc, or every track has one. */
const fillProblem = (toc: TocRow) => {
  if (audioRows(toc).length !== tracks.value.length) return t('editor.toc.fill_mismatch')
  return tracks.value.some(track => track.duration === null) ? null : t('editor.toc.nothing_to_fill')
}
const fill = (toc: TocRow) => {
  const rows = audioRows(toc)
  if (rows.length !== tracks.value.length) return
  let filled = 0
  tracks.value.forEach((track, index) => {
    if (track.duration !== null) return
    track.duration = toSeconds(rows[index]!.length)
    filled++
  })
  editor.notify(t('editor.toc.filled', { n: filled }))
}
</script>
