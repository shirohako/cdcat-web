<template>
  <CatalogSection :title="$t('editor.album.section.credits')" :icon="Users" tone="purple" :description="$t('editor.credits.hint')">
    <div class="space-y-4 p-3 sm:p-5">
      <ul v-if="levelErrors.length" class="space-y-0.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
        <li v-for="error in levelErrors" :key="error.path">{{ error.message }}</li>
      </ul>

      <template v-for="section in sections" :key="section.key">
        <div v-if="section.groups.length">
          <h3 class="mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">{{ section.label }}</h3>
          <ul class="space-y-1.5">
            <template v-for="group in section.groups" :key="group.key">
              <EditorListRow :invalid="groupErrors(group).length > 0" @edit="edit(group)" @remove="removeCreditGroup(album, group)">
                <span class="w-24 shrink-0 truncate text-xs text-purple-700 sm:w-32" :class="{ 'text-rose-600': !roleAllowed(group) }">{{ roleName(group.role) }}<span v-if="!roleAllowed(group)"> ⚠</span></span>
                <span class="min-w-0 flex-1">
                  <span class="flex min-w-0 items-center gap-1.5">
                    <span class="truncate text-sm font-medium text-gray-900">{{ personName(group) }}</span>
                    <span v-if="typeof group.artist_id === 'string'" class="shrink-0 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">{{ $t('editor.new') }}</span>
                    <span v-if="group.artist_id === null" class="shrink-0 rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500" :title="$t('editor.credits.link_artist')">{{ $t('editor.dialog.name_only') }}</span>
                  </span>
                  <span v-if="subline(group)" class="block truncate text-[11px] text-gray-500">{{ subline(group) }}</span>
                </span>
              </EditorListRow>
              <p v-for="error in groupErrors(group)" :key="error.path" class="px-1 text-[11px] text-error">{{ error.message }}</p>
            </template>
          </ul>
        </div>
      </template>
      <p v-if="!album.credits.length" class="text-sm text-gray-400">{{ $t('editor.credits.none') }}</p>

      <EditorAddButton @click="edit(null)">{{ $t('editor.credits.add') }}</EditorAddButton>
    </div>

    <EditorModal v-model="dialog" :title="$t(editing ? 'editor.dialog.credit_edit' : 'editor.credits.add')" :description="$t('editor.credits.hint')" :icon="UserPlus" tone="purple" @submit="save(false)">
      <div class="space-y-4">
        <div class="grid gap-4 sm:grid-cols-2">
          <label class="block">
            <span class="mb-1 block text-sm font-medium text-gray-700">{{ $t('editor.dialog.credit_role') }}</span>
            <EditorRoleSelect v-model="form.role" :level="form.scope === 'album' ? 'album' : 'track'" class="w-full" />
          </label>
          <div>
            <span class="mb-1 block text-sm font-medium text-gray-700">{{ $t('editor.credits.scope') }}</span>
            <div class="grid grid-cols-2 rounded-lg bg-gray-100 p-0.5 text-sm">
              <button type="button" class="rounded-md px-2 py-1" :class="form.scope === 'album' ? 'bg-white font-medium text-gray-900 shadow-sm' : 'text-gray-600'" @click="form.scope = 'album'">{{ $t('editor.credits.whole_album') }}</button>
              <button type="button" class="rounded-md px-2 py-1 disabled:opacity-40" :class="form.scope === 'tracks' ? 'bg-white font-medium text-gray-900 shadow-sm' : 'text-gray-600'" :disabled="!album.tracks.length" @click="form.scope = 'tracks'">{{ $t('editor.credits.on_tracks') }}</button>
            </div>
          </div>
        </div>
        <EditorAlbumTrackChooser v-if="form.scope === 'tracks'" v-model="form.tracks" inline />

        <div ref="person">
          <span class="mb-1 block text-sm font-medium text-gray-700">{{ $t('editor.dialog.credit_artist') }}</span>
          <EditorPickedRef v-if="form.ref !== null" :id="form.ref" type="artist" :references="editor.references" :pending="editor.pending.value" :icon="User" @remove="unlink" />
          <div v-else-if="form.newArtist" class="flex h-[2.125rem] items-center gap-2 rounded-[0.58rem] border border-emerald-200 bg-emerald-50 pl-2.5 pr-1 text-sm text-emerald-950">
            <User :size="14" class="shrink-0 text-emerald-500" />
            <span class="min-w-0 flex-1 truncate font-medium">{{ form.newArtist }}</span>
            <span class="shrink-0 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">{{ $t('editor.new') }}</span>
            <button type="button" class="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-emerald-500 hover:bg-emerald-100" :aria-label="$t('common.delete')" @click="form.newArtist = ''"><X :size="13" /></button>
          </div>
          <EditorEntityPicker v-else kind="artist" allow-create data-autofocus :placeholder="$t('editor.credits.pick_artist')" @select="pick" @create="form.newArtist = $event" />
        </div>
        <EditorArtistTypePicker v-if="form.ref === null && form.newArtist" v-model="form.newType" :invalid="problem === 'type'" />

        <div class="grid gap-4 sm:grid-cols-2">
          <label class="block">
            <span class="mb-1 block text-sm font-medium text-gray-700">{{ $t('editor.dialog.credited_as') }}</span>
            <input v-model="form.creditedAs" class="input input-sm w-full" :class="{ 'input-error': problem === 'person' }" maxlength="200">
            <span class="mt-1 block text-[11px] leading-4 text-gray-400">{{ $t('editor.dialog.credited_as_hint') }}</span>
          </label>
          <label class="block">
            <span class="mb-1 block text-sm font-medium text-gray-700">{{ $t('catalog.field.detail') }}</span>
            <input v-model="form.detail" class="input input-sm w-full" maxlength="100">
          </label>
        </div>
        <p v-if="problem && problem !== 'type'" class="text-xs text-error">{{ $t(problem === 'person' ? 'editor.dialog.credit_person_required' : 'editor.dialog.credit_tracks_required') }}</p>
      </div>
      <template #footer>
        <span v-if="addedCount" class="mr-auto text-xs text-emerald-600">{{ $t('editor.dialog.credit_added', { count: addedCount }) }}</span>
        <button type="button" class="btn btn-ghost btn-sm" @click="dialog = false">{{ $t(addedCount ? 'common.close' : 'common.cancel') }}</button>
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
import { addCredit, creditGroups, orderedTracks, removeCreditGroup, setCreditTracks, trackRanges, updateCreditGroup } from '~/utils/albumDocument'
import { sameId } from '~/utils/documentRows'

const editor = useAlbumEditor()
const { t } = useI18n()
const { schema, roleOrder, roleName } = useCatalogSchema()
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

const artistName = (id: AggregateRef | null) => {
  if (id === null) return ''
  if (typeof id === 'string') return editor.pending.value[id.replace(/^@/, '')] ?? ''
  return String((editor.references.artist?.[String(id)] as { name?: string } | undefined)?.name ?? `#${id}`)
}
const personName = (group: CreditGroup) => group.artist_id === null ? (group.credited_as || '—') : artistName(group.artist_id)
const subline = (group: CreditGroup) => [
  group.artist_id !== null && group.credited_as ? t('editor.dialog.shown_as', { name: group.credited_as }) : null,
  group.detail,
  group.album ? null : `${t('editor.credits.tracks')} ${trackRanges(album.value, group.trackIds)}`,
].filter(Boolean).join(' · ')

/** Whether the role may be used at the group's level (album or track). */
const roleAllowed = (group: CreditGroup) => {
  const role = schema.value?.credit_roles?.find(item => item.key === group.role)
  return !role || (group.album ? role.is_album_role : role.is_track_role)
}

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
