<template>
  <EditorListRow :invalid="invalid" @edit="emit('edit')" @remove="emit('remove')">
    <span v-if="!hideRole" class="flex w-24 shrink-0 flex-col text-xs sm:w-32" :class="allowed ? 'text-primary' : 'text-danger'">
      <span class="truncate">{{ roleName(group.role) }}<span v-if="!allowed"> ⚠</span></span>
      <span v-if="roleNameEn(group.role)" class="truncate text-[10px] opacity-60">{{ roleNameEn(group.role) }}</span>
    </span>
    <!-- In a column of its own so the names line up. -->
    <span v-if="!hidePerson" class="flex w-24 shrink-0"><EditorAlbumCreditWho :artist-id="group.artist_id" /></span>
    <span v-if="hidePerson" class="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
      <EditorAlbumTrackRanges v-if="trackIds?.length" :track-ids="trackIds" />
      <span v-if="subline" class="truncate text-xs text-body">{{ subline }}</span>
      <span v-if="!trackIds?.length && !subline" class="text-sm text-meta">—</span>
    </span>
    <span v-else class="min-w-0 flex-1">
      <span class="flex min-w-0 items-center gap-1.5">
        <span class="truncate text-sm font-medium text-title">{{ person }}</span>
        <span v-if="group.artist_id === null && group.credited_as && editor.nameNotes.value[group.credited_as]" class="shrink-0 rounded-md bg-warning/15 px-1.5 py-0.5 text-[10px] font-bold text-warning" :title="editor.nameNotes.value[group.credited_as]">⚠ {{ editor.nameNotes.value[group.credited_as] }}</span>
      </span>
      <span v-if="trackIds?.length || subline" class="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
        <EditorAlbumTrackRanges v-if="trackIds?.length" :track-ids="trackIds" />
        <span v-if="subline" class="truncate text-[11px] text-meta">{{ subline }}</span>
      </span>
    </span>
    <template v-if="!hidePerson" #actions><EditorViewLink :id="group.artist_id" type="artist" /></template>
  </EditorListRow>
</template>

<script setup lang="ts">
import type { RowId } from '~/types/document'
import type { CreditGroup } from '~/utils/albumDocument'

/** One credit group in the credits section: its role (with the English name), who it points at, the person and a line under it. */
const props = defineProps<{
  group: CreditGroup
  /** The person's name as the section shows it (the artist, or the printed name). */
  person: string
  subline?: string
  /** The group's tracks, shown as Disc / Track pills; left out for whole-album credits and under a track heading. */
  trackIds?: RowId[]
  /** Under a role heading the role column would repeat it. */
  hideRole?: boolean
  /** Under a person heading: the role and the subline only. */
  hidePerson?: boolean
  invalid?: boolean
}>()
const emit = defineEmits<{ edit: [], remove: [] }>()

const editor = useAlbumEditor()
const { schema, roleName, roleNameEn } = useCatalogSchema()

/** Whether the role may be used at the group's level (album or track). */
const allowed = computed(() => {
  const role = schema.value?.credit_roles?.find(item => item.key === props.group.role)
  return !role || (props.group.album ? role.is_album_role : role.is_track_role)
})
</script>
