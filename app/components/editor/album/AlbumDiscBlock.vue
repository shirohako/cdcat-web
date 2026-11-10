<template>
  <div v-if="disc" class="overflow-hidden rounded-xl border" :class="[bonus ? 'border-pink-200 dark:border-pink-400/30' : 'border-line', errors.length ? 'ring-2 ring-danger/30' : '']">
    <div :id="`editor-disc-${disc.id}`" class="flex flex-wrap items-center gap-2 border-b border-line bg-sunken px-3 py-2">
      <Disc3 :size="14" class="shrink-0 text-meta" />
      <span class="shrink-0 text-sm font-bold text-body">{{ $t('editor.album.disc_n', { n: disc.position }) }}</span>
      <UiSelect v-model="disc.format" :options="formatOptions" size="sm" class="h-8 w-28 text-xs" :aria-label="$t('catalog.field.format')" />
      <input v-model="disc.title" class="input input-sm h-8 min-w-32 flex-1 text-xs" :placeholder="$t('editor.album.disc_title_placeholder')" maxlength="500">
      <EditorHelp id="disc" />
      <span v-if="bonus" class="shrink-0 rounded-full bg-pink-100 px-2 py-0.5 text-11 font-bold text-pink-600 dark:bg-pink-400/20 dark:text-pink-200" :title="$t('editor.album.bonus_disc_hint')">{{ $t('editor.album.bonus_disc', { name: bonus.name || '…' }) }}</span>
      <span class="ml-auto flex shrink-0 items-center gap-0.5">
        <UiButton v-if="isCd || tocCount" size="xs" class="ring-1 ring-inset shadow-xs active:translate-y-px" :class="tocErrors.length || !isCd ? 'text-danger ring-danger/40' : 'ring-line'" :title="$t('editor.toc.button')" @click="emit('toc')">TOC<span v-if="tocCount" :class="tocErrors.length || !isCd ? 'text-danger' : 'text-primary'">·{{ tocCount }}</span></UiButton>
        <UiButton :icon="ArrowUp" :label="$t('catalog.form.move_up')" icon-class="size-3" size="xs" class="ring-1 ring-inset ring-line shadow-xs active:translate-y-px" :disabled="first" @click="moveDisc(album, disc.id, -1)" />
        <UiButton :icon="ArrowDown" :label="$t('catalog.form.move_down')" icon-class="size-3" size="xs" class="ring-1 ring-inset ring-line shadow-xs active:translate-y-px" :disabled="last" @click="moveDisc(album, disc.id, 1)" />
        <UiButton variant="danger-soft" :icon="Trash2" :label="hasLive ? $t('editor.album.remove_disc_locked') : $t('editor.album.remove_disc')" icon-class="size-3" size="xs" class="ring-1 ring-inset ring-danger/20 shadow-xs active:translate-y-px" :disabled="hasLive" @click="remove" />
      </span>
    </div>
    <p v-for="error in errors" :key="error.path" class="border-b border-danger/25 bg-danger/10 px-3 py-1.5 text-11 text-danger">{{ error.message }}</p>
    <p v-if="tocCount && !isCd" class="border-b border-danger/25 bg-danger/10 px-3 py-1.5 text-11 text-danger">{{ $t('editor.toc.not_cd_disc') }}</p>
    <p v-else-if="tocErrors.length" class="border-b border-danger/25 bg-danger/10 px-3 py-1.5 text-11 text-danger">{{ $t('editor.toc.has_errors') }}</p>

    <!-- The track rows have no labels of their own, so the first disc says what their fields are, once. -->
    <p v-if="first" class="flex flex-wrap items-center gap-x-3.5 gap-y-0.5 border-b border-line px-3 py-1 text-11 text-meta">
      <span>{{ $t('catalog.field.track_number') }}<EditorHelp id="track.number" /></span>
      <span>{{ $t('catalog.field.title') }}<EditorHelp id="track.title" /></span>
      <span>{{ $t('catalog.field.duration') }}<EditorHelp id="track.duration" /></span>
      <span>{{ $t('catalog.field.is_instrumental') }}<EditorHelp id="track.instrumental" /></span>
    </p>

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

    <div class="flex flex-wrap items-center gap-2 border-t border-line px-3 py-1.5">
      <EditorAddButton small @click="add">{{ $t('editor.album.add_track') }}</EditorAddButton>
      <!-- A missing track goes in at its number and the ones after it move down: they keep their ids, unlike renaming them. -->
      <UiPopover v-if="tracks.length" v-model:open="inserting" placement="bottom-start" :label="$t('editor.album.insert_track')" class="w-64">
        <template #trigger="{ toggle, attrs }">
          <UiButton v-bind="attrs" variant="add" size="xs" :icon="ListPlus" icon-class="size-3" class="gap-1" @click="openInsert(toggle)">{{ $t('editor.album.insert_track') }}</UiButton>
        </template>
        <form class="space-y-2" @submit.prevent="insert">
          <i18n-t keypath="editor.album.insert_as" tag="label" class="flex items-center gap-1.5 text-sm text-body" scope="global">
            <template #number>
              <input v-model.number="insertNumber" type="number" min="1" max="999" class="input input-sm w-16 px-1 text-center font-mono" :aria-label="$t('catalog.field.track_number')">
            </template>
          </i18n-t>
          <p class="text-xs leading-5 text-meta">{{ shiftText }}</p>
          <div class="flex justify-end">
            <UiButton type="submit" variant="primary" size="xs" :disabled="!insertValid">{{ $t('editor.album.insert') }}</UiButton>
          </div>
        </form>
      </UiPopover>
      <span v-if="duration" class="ml-auto font-mono text-11 text-meta">{{ formatDuration(duration) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { RowId } from '~/types/document'
import type { UiSelectOption } from '~/components/ui/Select.vue'
import { ArrowDown, ArrowUp, Disc3, ListPlus, Trash2 } from '@lucide/vue'
import { addTrack, findDisc, firstGap, insertShift, insertTrack, moveDisc, removeDisc, sortedDiscs, tracksOn } from '~/utils/albumDocument'
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
const formatOptions = computed<UiSelectOption<string>[]>(() => formats.value.map(value => ({ value, label: enumLabel('disc_format', value) })))
const tracks = computed(() => tracksOn(album.value, props.discId))
const discs = computed(() => sortedDiscs(album.value))
const first = computed(() => sameId(discs.value[0]?.id, props.discId))
const last = computed(() => sameId(discs.value.at(-1)?.id, props.discId))
const bonus = computed(() => album.value.bonuses.find(item => sameId(item.id, disc.value?.bonus_id)) ?? null)
const tocs = computed(() => album.value.disc_tocs.filter(toc => sameId(toc.disc_id, props.discId)))
const tocCount = computed(() => tocs.value.length)
const tocErrors = computed(() => tocs.value.flatMap(toc => editor.errorsIn(`disc_tocs.${toc.id}`)))
// Only CDs have a TOC; another disc still shows the button while it has one, so it can be removed.
const isCd = computed(() => disc.value?.format === 'cd' || disc.value?.format === 'sacd')
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

// ---- inserting a track ----

const inserting = ref(false)
const insertNumber = ref<number | ''>('')
const insertValid = computed(() => Number.isInteger(insertNumber.value) && Number(insertNumber.value) >= 1 && Number(insertNumber.value) <= 999)
const shiftText = computed(() => {
  if (!insertValid.value) return t('editor.album.insert_hint')
  const moved = insertShift(album.value, props.discId, Number(insertNumber.value))
  if (!moved.length) return t('editor.album.insert_no_shift')
  const [from, to] = [moved[0]!, moved.at(-1)!]
  return from === to ? t('editor.album.insert_shift_one', { from, to: from + 1 }) : t('editor.album.insert_shift', { from, to, newFrom: from + 1, newTo: to + 1 })
})

/** Opens the card with the first gap in the numbers filled in, if there is one. */
const openInsert = (toggle: () => void) => {
  if (!inserting.value) insertNumber.value = firstGap(album.value, props.discId) ?? ''
  toggle()
}

const insert = () => {
  if (!insertValid.value) return
  const track = insertTrack(album.value, props.discId, Number(insertNumber.value))
  inserting.value = false
  focusTitle(tracks.value.findIndex(row => sameId(row.id, track.id)))
}

// ---- removing the disc ----

/** A disc with saved tracks of an approved album stays: those tracks can only move to another disc. */
const hasLive = computed(() => tracks.value.some(track => editor.isLiveTrack(track.id)))

const remove = async () => {
  if (hasLive.value) return
  if (tracks.value.length && !await confirm({ title: t('editor.album.remove_disc_confirm', { count: tracks.value.length }) })) return
  removeDisc(album.value, props.discId)
}
</script>
