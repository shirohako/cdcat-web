<script setup lang="ts">
import type { RowId } from '~/types/document'
import type { AlbumCreditRow } from '~/utils/albumDocument'
import type { CreditPerson } from '~/utils/creditLines'
import { addCredit, orderedTracks, patchCredits, removeCredits } from '~/utils/albumDocument'
import { copyTrackCredits, creditsOn, sameTrackCredits } from '~/utils/creditLines'

/**
 * 按曲目: the whole album's credits (outside the byline block) first, then a card per track with its credits by
 * role, the way a booklet that lists each track's staff reads. A track can take over the one before's credits in a
 * click. Rows being started (the role picked first) are kept here, per track, until their first person.
 */
const { t } = useI18n()
const editor = useAlbumEditor()
const { confirm } = useConfirm()
const { roleOrder } = useCatalogSchema()
const album = computed(() => editor.album.value)

const tracks = computed(() => orderedTracks(album.value))
const albumCredits = computed(() => creditsOn(album.value, null, roleOrder))
const trackCredits = (id: RowId) => creditsOn(album.value, id, roleOrder)

/** Rows being started, by track ('album' for the whole album). */
const started = reactive<Record<string, string[] | undefined>>({})
const keyOf = (trackId: RowId | null) => trackId === null ? 'album' : String(trackId)
const firstPerson = (trackId: RowId | null, person: CreditPerson) => {
  for (const role of started[keyOf(trackId)] ?? []) addCredit(album.value, { ...person, role }, trackId === null ? null : [trackId])
  started[keyOf(trackId)] = undefined
}

const add = (trackId: RowId | null, role: string, person: CreditPerson) => addCredit(album.value, { ...person, role }, trackId === null ? null : [trackId])
const update = (row: AlbumCreditRow, patch: Partial<CreditPerson>) => patchCredits(album.value, [row], patch)
const remove = (row: AlbumCreditRow) => removeCredits(album.value, [row])

const canCopy = (index: number) => {
  const previous = tracks.value[index - 1]
  return !!previous && trackCredits(previous.id).length > 0 && !sameTrackCredits(album.value, previous.id, tracks.value[index]!.id)
}
/** The same people in the same roles as the track before; credits of its own that the other lacks go, after a question. */
const copyPrevious = async (index: number) => {
  const track = tracks.value[index]!
  const own = trackCredits(track.id).reduce((count, item) => count + item.rows.length, 0)
  if (own && !await confirm({
    title: t('editor.credits.same_confirm_title'),
    description: t('editor.credits.same_confirm_desc', { count: own }),
    confirmText: t('editor.credits.same_as_previous'),
  })) return
  copyTrackCredits(album.value, tracks.value[index - 1]!.id, track.id)
}
</script>

<template>
  <div class="space-y-3">
    <section class="rounded-lg border border-line">
      <p class="flex items-center gap-2 border-b border-line bg-sunken px-3 py-1.5 text-xs font-semibold text-title">
        <Icon name="lucide:disc-3" class="size-3.5 text-meta" />{{ t('editor.credits.whole_album') }}
      </p>
      <div class="space-y-2 px-3 py-2">
        <EditorAlbumCreditsRoleRow
          v-for="item in albumCredits"
          :key="item.role"
          :role="item.role"
          :rows="item.rows"
          @add="add(null, item.role, $event)"
          @update="update"
          @remove="remove"
        />
        <EditorAlbumCreditsRoleRow v-if="started.album" v-model:roles="started.album" @add="firstPerson(null, $event)" />
        <EditorAlbumCreditsStartRow v-else @start="started.album = []" />
      </div>
    </section>

    <p v-if="!tracks.length" class="rounded-lg border border-dashed border-line px-4 py-4 text-center text-xs text-meta">{{ t('editor.credits.no_tracks_hint') }}</p>
    <section v-for="(track, index) in tracks" :key="String(track.id)" class="rounded-lg border border-line">
      <p class="flex items-center gap-2 border-b border-line bg-sunken px-3 py-1.5 text-xs">
        <span class="w-8 shrink-0 font-mono text-faint">{{ track.number_label || String(track.track_number).padStart(2, '0') }}</span>
        <span class="min-w-0 flex-1 truncate font-semibold text-title">{{ track.title || '—' }}</span>
        <button
          v-if="canCopy(index)"
          type="button"
          class="inline-flex h-6 shrink-0 items-center gap-1 rounded-md bg-btn px-2 text-[11px] font-semibold text-btn-content ring-1 ring-inset ring-line transition-colors hover:bg-btn-hover"
          @click="copyPrevious(index)"
        >
          <Icon name="lucide:copy" class="size-3" />{{ t('editor.credits.same_as_previous') }}
        </button>
      </p>
      <div class="space-y-2 px-3 py-2">
        <EditorAlbumCreditsRoleRow
          v-for="item in trackCredits(track.id)"
          :key="item.role"
          :role="item.role"
          :rows="item.rows"
          @add="add(track.id, item.role, $event)"
          @update="update"
          @remove="remove"
        />
        <EditorAlbumCreditsRoleRow
          v-if="started[keyOf(track.id)]"
          :roles="started[keyOf(track.id)]"
          @update:roles="started[keyOf(track.id)] = $event"
          @add="firstPerson(track.id, $event)"
        />
        <EditorAlbumCreditsStartRow v-else @start="started[keyOf(track.id)] = []" />
      </div>
    </section>
  </div>
</template>
