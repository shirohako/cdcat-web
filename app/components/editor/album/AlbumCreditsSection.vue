<template>
  <CatalogSection :title="$t('editor.album.section.credits')" :icon="Users" :description="$t('editor.credits.hint')">
    <div class="space-y-4 p-3 sm:p-5">
      <ul v-if="levelErrors.length" class="space-y-0.5 rounded-lg border border-danger/25 bg-danger/10 px-3 py-2 text-xs text-danger">
        <li v-for="error in levelErrors" :key="error.path">{{ error.message }}</li>
      </ul>

      <template v-for="section in sections" :key="section.key">
        <div v-if="section.groups.length">
          <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h3 class="text-xs font-bold uppercase tracking-wider text-meta">{{ section.label }}</h3>
            <UiTabs
              v-if="section.key === 'tracks'"
              v-model="trackView"
              variant="segmented"
              size="sm"
              :label="$t('editor.credits.on_tracks')"
              :items="[
                { value: 'track', label: $t('editor.credits.by_track') },
                { value: 'person', label: $t('editor.credits.by_person') },
                { value: 'role', label: $t('editor.credits.by_role') },
              ]"
            />
          </div>

          <div v-if="section.key === 'tracks' && trackView === 'track'" class="space-y-3">
            <div v-for="item in byTrack" :key="String(item.track.id)">
              <p class="mb-1 flex min-w-0 items-center gap-2 px-1 text-xs">
                <EditorAlbumTrackRanges :track-ids="[item.track.id]" class="shrink-0" />
                <span class="truncate font-medium text-title">{{ item.track.title || '—' }}</span>
              </p>
              <ul class="space-y-1.5">
                <EditorAlbumCreditRow
                  v-for="credit in item.credits"
                  :key="String(credit.row.id)"
                  :group="credit.group"
                  :person="personName(credit.group)"
                  :subline="subline(credit.group)"
                  :invalid="editor.errorsIn(`credits.${credit.row.id}`).length > 0"
                  @edit="edit(credit.group)"
                  @remove="removeFromTrack(credit.group, item.track.id)"
                />
              </ul>
            </div>
          </div>

          <div v-else-if="section.key === 'tracks' && trackView === 'role'" class="space-y-3">
            <div v-for="item in byRole(section.groups)" :key="item.role">
              <p class="mb-1 flex min-w-0 items-baseline gap-1.5 px-1 text-xs">
                <span class="font-medium text-primary">{{ roleName(item.role) }}</span>
                <span v-if="roleNameEn(item.role)" class="text-[11px] text-meta">{{ roleNameEn(item.role) }}</span>
              </p>
              <ul class="space-y-1.5">
                <template v-for="group in item.groups" :key="group.key">
                  <EditorAlbumCreditRow :group="group" :person="personName(group)" :subline="subline(group)" :track-ids="group.album ? undefined : group.trackIds" hide-role :invalid="groupErrors(group).length > 0" @edit="edit(group)" @remove="removeCreditGroup(album, group)" />
                  <p v-for="error in groupErrors(group)" :key="error.path" class="px-1 text-[11px] text-danger">{{ error.message }}</p>
                </template>
              </ul>
            </div>
          </div>

          <div v-else-if="section.key === 'tracks' && trackView === 'person'" class="space-y-3">
            <div v-for="item in byPerson(section.groups)" :key="item.key">
              <p class="mb-1 flex min-w-0 items-center gap-2 px-1 text-xs">
                <span class="truncate font-medium text-title">{{ personName(item.groups[0]!) }}</span>
                <EditorAlbumCreditWho :artist-id="item.groups[0]!.artist_id" />
                <EditorViewLink :id="item.groups[0]!.artist_id" type="artist" class="ml-auto" />
              </p>
              <ul class="space-y-1.5">
                <template v-for="group in item.groups" :key="group.key">
                  <EditorAlbumCreditRow :group="group" :person="personName(group)" :subline="subline(group)" :track-ids="group.album ? undefined : group.trackIds" hide-person :invalid="groupErrors(group).length > 0" @edit="edit(group)" @remove="removeCreditGroup(album, group)" />
                  <p v-for="error in groupErrors(group)" :key="error.path" class="px-1 text-[11px] text-danger">{{ error.message }}</p>
                </template>
              </ul>
            </div>
          </div>

          <ul v-else class="space-y-1.5">
            <template v-for="group in section.groups" :key="group.key">
              <EditorAlbumCreditRow :group="group" :person="personName(group)" :subline="subline(group)" :track-ids="group.album ? undefined : group.trackIds" :invalid="groupErrors(group).length > 0" @edit="edit(group)" @remove="removeCreditGroup(album, group)" />
              <p v-for="error in groupErrors(group)" :key="error.path" class="px-1 text-[11px] text-danger">{{ error.message }}</p>
            </template>
          </ul>
        </div>
      </template>
      <p v-if="!album.credits.length" class="text-sm text-meta">{{ $t('editor.credits.none') }}</p>

      <EditorAddButton @click="edit(null)">{{ $t('editor.credits.add') }}</EditorAddButton>
    </div>

    <EditorModal v-model="dialog" :title="$t(editing ? 'editor.dialog.credit_edit' : 'editor.credits.add')" :description="$t('editor.credits.hint')" :icon="UserPlus" @submit="save(false)">
      <div class="space-y-4">
        <div class="grid gap-4 sm:grid-cols-2">
          <label class="block">
            <span class="mb-1 block text-sm font-medium text-body">{{ $t('editor.dialog.credit_role') }}</span>
            <EditorRoleSelect v-model="form.role" :level="form.scope === 'album' ? 'album' : 'track'" class="w-full" />
          </label>
          <div>
            <span class="mb-1 block text-sm font-medium text-body">{{ $t('editor.credits.scope') }}</span>
            <UiTabs
              v-model="form.scope"
              variant="segmented"
              :label="$t('editor.credits.scope')"
              :items="[
                { value: 'album', label: $t('editor.credits.whole_album') },
                { value: 'tracks', label: $t('editor.credits.on_tracks'), disabled: !album.tracks.length },
              ]"
            />
          </div>
        </div>
        <EditorAlbumTrackChooser v-if="form.scope === 'tracks'" v-model="form.tracks" inline />

        <div ref="person">
          <span class="mb-1 block text-sm font-medium text-body">{{ $t('editor.dialog.credit_artist') }}</span>
          <EditorPickedRef v-if="form.ref !== null" :id="form.ref" type="artist" :references="editor.references" :pending="editor.pending.value" :icon="User" @remove="unlink" />
          <div v-else-if="form.newArtist" class="flex h-8 items-center gap-2 rounded-lg border border-success/25 bg-success/10 pl-2.5 pr-1 text-sm text-title">
            <User :size="14" class="shrink-0 text-success" />
            <span class="min-w-0 flex-1 truncate font-medium">{{ form.newArtist }}</span>
            <span class="shrink-0 rounded-full bg-success/15 px-1.5 py-0.5 text-[10px] font-bold text-success">{{ $t('editor.new') }}</span>
            <button type="button" class="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-success/70 transition-colors hover:bg-success/15 hover:text-success" :aria-label="$t('common.delete')" @click="form.newArtist = ''"><X :size="13" /></button>
          </div>
          <EditorEntityPicker v-else kind="artist" allow-create data-autofocus :placeholder="$t('editor.credits.pick_artist')" @select="pick" @create="form.newArtist = $event" />
        </div>
        <EditorArtistTypePicker v-if="form.ref === null && form.newArtist" v-model="form.newType" :invalid="problem === 'type'" />

        <div class="grid gap-4 sm:grid-cols-2">
          <label class="block">
            <span class="mb-1 block text-sm font-medium text-body">{{ $t('editor.dialog.credited_as') }}</span>
            <input v-model="form.creditedAs" class="input input-sm w-full" :class="{ 'input-error': problem === 'person' }" maxlength="200">
            <span class="mt-1 block text-[11px] leading-4 text-meta">{{ $t('editor.dialog.credited_as_hint') }}</span>
          </label>
          <label class="block">
            <span class="mb-1 block text-sm font-medium text-body">{{ $t('catalog.field.detail') }}</span>
            <input v-model="form.detail" class="input input-sm w-full" maxlength="100">
          </label>
        </div>
        <p v-if="problem && problem !== 'type'" class="text-xs text-danger">{{ $t(problem === 'person' ? 'editor.dialog.credit_person_required' : 'editor.dialog.credit_tracks_required') }}</p>
      </div>
      <template #footer>
        <span v-if="addedCount" class="mr-auto text-xs text-success">{{ $t('editor.dialog.credit_added', { count: addedCount }) }}</span>
        <button type="button" class="btn btn-sm" @click="dialog = false">{{ $t(addedCount ? 'common.close' : 'common.cancel') }}</button>
        <button v-if="!editing" type="button" class="btn btn-sm" @click="save(true)">{{ $t('editor.dialog.add_another') }}</button>
        <button type="submit" class="btn btn-primary btn-sm">{{ $t(editing ? 'common.save' : 'common.add') }}</button>
      </template>
    </EditorModal>
  </CatalogSection>
</template>

<script setup lang="ts">
import type { PickedEntity } from '~/components/editor/EntityPicker.vue'
import type { CreditGroup } from '~/utils/albumDocument'
import type { AggregateRef, RowId } from '~/types/document'
import { User, UserPlus, Users, X } from '@lucide/vue'
import { addCredit, creditGroups, orderedTracks, removeCreditGroup, setCreditTracks, updateCreditGroup } from '~/utils/albumDocument'
import { sameId } from '~/utils/documentRows'

const editor = useAlbumEditor()
const { t } = useI18n()
const { roleOrder, roleName, roleNameEn } = useCatalogSchema()
const album = computed(() => editor.album.value)

const levelErrors = computed(() => editor.errorsIn('credits').filter(error => error.path.split('.').length === 3))
const groupErrors = (group: CreditGroup) => group.rows.flatMap(row => editor.errorsIn(`credits.${row.id}`))

/** Whole-album credits first, then track credits; each by the dictionary's role order, then by first track. */
const sections = computed(() => {
  const order = new Map(orderedTracks(album.value).map((track, index) => [String(track.id), index]))
  const firstTrack = (ids: RowId[]) => Math.min(...ids.map(id => order.get(String(id)) ?? Number.MAX_SAFE_INTEGER))
  const groups = creditGroups(album.value).sort((a, b) => roleOrder(a.role) - roleOrder(b.role) || firstTrack(a.trackIds) - firstTrack(b.trackIds))
  return [
    { key: 'album', label: t('editor.credits.whole_album'), groups: groups.filter(group => group.album) },
    { key: 'tracks', label: t('editor.credits.on_tracks'), groups: groups.filter(group => !group.album) },
  ]
})

/** Track credits under each track (the default), under each person, or under each role; each row is a person's role on some tracks. */
const trackView = ref<'track' | 'person' | 'role'>('track')

/** Every track with credits of its own, in tracklist order: each credit with the group it belongs to. */
const byTrack = computed(() => {
  const groups = creditGroups(album.value).filter(group => !group.album)
  return orderedTracks(album.value).map((track) => {
    const credits = groups.flatMap(group => group.rows.filter(row => sameId(row.track_id!, track.id)).map(row => ({ row, group })))
      .sort((a, b) => roleOrder(a.group.role) - roleOrder(b.group.role))
    return { track, credits }
  }).filter(item => item.credits.length)
})

/**
 * The groups under each person: the same artist, or for printed names the same name. People come
 * in the order of their first group (role, then first track); under one, the groups keep that order.
 */
const byPerson = (groups: CreditGroup[]) => {
  const people = new Map<string, CreditGroup[]>()
  for (const group of groups) {
    const key = group.artist_id !== null ? `a:${group.artist_id}` : `n:${(group.credited_as ?? '').trim().toLowerCase()}`
    people.set(key, [...(people.get(key) ?? []), group])
  }
  return [...people].map(([key, list]) => ({ key, groups: list }))
}

/** The groups (already in role, then first-track order) under each of their roles. */
const byRole = (groups: CreditGroup[]) => {
  const roles = new Map<string, CreditGroup[]>()
  for (const group of groups) roles.set(group.role, [...(roles.get(group.role) ?? []), group])
  return [...roles].map(([role, list]) => ({ role, groups: list }))
}

/** Takes one track out of a group; the group goes when it has no track left. */
const removeFromTrack = (group: CreditGroup, trackId: RowId) => {
  const rest = group.trackIds.filter(id => !sameId(id, trackId))
  if (rest.length) setCreditTracks(album.value, group, rest)
  else removeCreditGroup(album.value, group)
}

const artistName = (id: AggregateRef | null) => {
  if (id === null) return ''
  if (typeof id === 'string') return editor.pending.value[id.replace(/^@/, '')] ?? ''
  return String((editor.references.artist?.[String(id)] as { name?: string } | undefined)?.name ?? `#${id}`)
}
const personName = (group: CreditGroup) => group.artist_id === null ? (group.credited_as || '—') : artistName(group.artist_id)
const subline = (group: CreditGroup) => [
  group.artist_id !== null && group.credited_as ? t('editor.dialog.shown_as', { name: group.credited_as }) : null,
  group.detail,
].filter(Boolean).join(' · ')

// ---- the dialog: adds credits, or edits one group ----

const dialog = ref(false)
const editing = ref<CreditGroup | null>(null)
const form = reactive({
  role: 'composer',
  scope: 'album' as 'album' | 'tracks',
  tracks: [] as RowId[],
  /** The credited artist: an id, or "@ref" of an artist new in this revision. */
  ref: null as AggregateRef | null,
  /** A new artist's name; the artist is created only when the credit is saved. */
  newArtist: '',
  /** The type of the new artist, chosen in the dialog. */
  newType: null as string | null,
  creditedAs: '',
  detail: '',
})
const tried = ref(false)
const addedCount = ref(0)
const person = ref<HTMLElement | null>(null)

const problem = computed(() => {
  if (!tried.value) return null
  if (form.ref === null && !form.newArtist && !form.creditedAs.trim()) return 'person'
  if (form.ref === null && form.newArtist && !form.newType) return 'type'
  if (form.scope === 'tracks' && !form.tracks.length) return 'tracks'
  return null
})

const clearPerson = () => {
  form.ref = null
  form.newArtist = ''
  form.newType = null
  form.creditedAs = ''
  form.detail = ''
  tried.value = false
}

/** A new credit keeps the role and scope of the last one added, so a run of credits goes quickly. */
const edit = (group: CreditGroup | null) => {
  editing.value = group
  clearPerson()
  addedCount.value = 0
  if (group) {
    form.role = group.role
    form.scope = group.album ? 'album' : 'tracks'
    form.tracks = [...group.trackIds]
    form.ref = group.artist_id
    form.creditedAs = group.credited_as ?? ''
    form.detail = group.detail ?? ''
  } else if (!album.value.tracks.length) {
    form.scope = 'album'
  }
  dialog.value = true
}

watch(() => form.scope, (scope) => {
  if (scope === 'tracks' && !form.tracks.length) form.tracks = orderedTracks(album.value).map(track => track.id)
})
// Tracks removed meanwhile drop out of the selection.
watch(() => album.value.tracks.length, () => {
  form.tracks = form.tracks.filter(id => album.value.tracks.some(track => sameId(track.id, id)))
})

const pick = (item: PickedEntity) => {
  editor.remember('artist', item.id, { id: item.id, name: item.label, image_url: item.image_url })
  form.ref = item.id
}

/** Keeps the name as printed when the artist link is removed. */
const unlink = () => {
  if (!form.creditedAs.trim()) form.creditedAs = artistName(form.ref)
  form.ref = null
}

const saveGroup = (group: CreditGroup, fields: Parameters<typeof addCredit>[1]) => {
  const tracks = form.scope === 'tracks' ? form.tracks : null
  if (group.album !== (tracks === null)) {
    removeCreditGroup(album.value, group)
    addCredit(album.value, fields, tracks)
    return
  }
  // Rows keep their ids, so the change preview shows edits rather than removals and additions.
  const ids = new Set(group.rows.map(row => String(row.id)))
  updateCreditGroup(album.value, group, fields)
  if (!tracks) return
  const current = creditGroups(album.value).find(item => item.rows.some(row => ids.has(String(row.id))))
  if (current) setCreditTracks(album.value, current, tracks)
}

const save = async (another: boolean) => {
  tried.value = true
  if (problem.value) return
  const fields = {
    artist_id: form.ref ?? (form.newArtist ? editor.createItem('artist', { name: form.newArtist, type: form.newType }) : null),
    credited_as: form.creditedAs.trim() || null,
    role: form.role,
    detail: form.detail.trim() || null,
  }
  if (editing.value) saveGroup(editing.value, fields)
  else addCredit(album.value, fields, form.scope === 'tracks' ? form.tracks : null)
  if (!another) {
    dialog.value = false
    return
  }
  addedCount.value++
  clearPerson()
  await nextTick()
  person.value?.querySelector('input')?.focus()
}
</script>
