<script setup lang="ts">
import type { RowId } from '~/types/document'
import type { AlbumCreditRow } from '~/utils/albumDocument'
import type { CreditPerson } from '~/utils/creditLines'
import { addCredit, changeCreditRole, moveTrackArtist, orderedTracks, patchCredits, removeCredits, setCreditParent } from '~/utils/albumDocument'
import { copyTrackCredits, creditsOn, sameTrackCredits } from '~/utils/creditLines'

/**
 * 按曲目: a card per track with its credits by role, the way a booklet that lists each track's staff reads. A track
 * can take over the one before's credits in a click. A role's name changes the role of the whole row. Rows being
 * started (the role picked first) are kept here, per track, until their first person. Each person also picks the
 * credit it belongs to (a 客串's 艺术家, utils/artistLine).
 */
const { t } = useI18n()
const editor = useAlbumEditor()
const { confirm } = useConfirm()
const { roleOrder } = useCatalogSchema()
const album = computed(() => editor.album.value)

const tracks = computed(() => orderedTracks(album.value))
const trackCredits = (id: RowId) => creditsOn(album.value, id, roleOrder)
const trackRows = (id: RowId) => album.value.credits.filter(row => String(row.track_id) === String(id))
const setParent = (row: AlbumCreditRow, parent: AlbumCreditRow | null) => setCreditParent(album.value, row, parent)

/** Rows being started, by track. */
const started = reactive<Record<string, string[] | undefined>>({})
const keyOf = (trackId: RowId) => String(trackId)
const firstPerson = (trackId: RowId, person: CreditPerson) => {
  for (const role of started[keyOf(trackId)] ?? []) addCredit(album.value, { ...person, role }, [trackId])
  started[keyOf(trackId)] = undefined
}

const add = (trackId: RowId, role: string, person: CreditPerson) => addCredit(album.value, { ...person, role }, [trackId])
const update = (row: AlbumCreditRow, patch: Partial<CreditPerson>) => patchCredits(album.value, [row], patch)
const remove = (row: AlbumCreditRow) => removeCredits(album.value, [row])
const changeRole = (rows: AlbumCreditRow[], role: string) => changeCreditRole(album.value, rows, role)
const move = (row: AlbumCreditRow, delta: number) => moveTrackArtist(album.value, row, delta)

const canCopy = (index: number) => {
  const previous = tracks.value[index - 1]
  return !!previous && trackCredits(previous.id).length > 0 && !sameTrackCredits(album.value, previous.id, tracks.value[index]!.id)
}
/** The same people in the same roles as the track before; credits of its own that the other lacks go, after a question. */
const copyPrevious = async (index: number) => {
  const track = tracks.value[index]!
  const own = trackCredits(track.id).reduce((count, item) => count + item.rows.length, 0)
  if (own && !await confirm({
    variant: 'confirm',
    title: t('editor.credits.same_confirm_title'),
    description: t('editor.credits.same_confirm_desc', { count: own }),
    confirmText: t('editor.credits.same_as_previous'),
  })) return
  copyTrackCredits(album.value, tracks.value[index - 1]!.id, track.id)
}
</script>

<template>
  <div class="space-y-3">
    <p v-if="!tracks.length" class="rounded-lg border border-dashed border-line px-4 py-4 text-center text-xs text-meta">{{ t('editor.credits.no_tracks_hint') }}</p>
    <section v-for="(track, index) in tracks" :key="String(track.id)" class="rounded-lg border border-line">
      <!-- As tall with 和上一首相同 as without it. -->
      <p class="flex min-h-[2.5625rem] items-center gap-2 rounded-t-[7px] border-b border-line bg-sunken px-3 py-1.5 text-xs">
        <span class="min-w-5 shrink-0 font-mono text-faint">{{ track.number_label || String(track.track_number).padStart(2, '0') }}</span>
        <span class="min-w-0 flex-1 truncate font-semibold text-title">{{ track.title || '—' }}</span>
        <UiButton v-if="canCopy(index)" size="xs" icon="lucide:copy" icon-class="size-3" class="shrink-0 gap-1 ring-1 ring-inset ring-line" @click="copyPrevious(index)">{{ t('editor.credits.same_as_previous') }}</UiButton>
      </p>
      <div class="space-y-2 px-3 py-2">
        <EditorAlbumCreditsRoleRow
          v-for="item in trackCredits(track.id)"
          :key="item.role"
          :role="item.role"
          :rows="item.rows"
          :track-rows="trackRows(track.id)"
          changeable
          @add="add(track.id, item.role, $event)"
          @role="changeRole(item.rows, $event)"
          @update="update"
          @remove="remove"
          @parent="setParent"
          @move="move"
        />
        <EditorAlbumCreditsRoleRow
          v-if="started[keyOf(track.id)]"
          :roles="started[keyOf(track.id)]"
          @update:roles="started[keyOf(track.id)] = $event"
          @add="firstPerson(track.id, $event)"
          @cancel="started[keyOf(track.id)] = undefined"
        />
        <EditorAlbumCreditsStartRow v-else @start="started[keyOf(track.id)] = []" />
      </div>
    </section>
  </div>
</template>
