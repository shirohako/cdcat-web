<template>
  <CatalogSection :title="$t('editor.album.section.credits')" :icon="Users" tone="purple">
    <div class="space-y-4 p-3 sm:p-5">
      <p class="text-xs text-gray-500">{{ $t('editor.credits.hint') }}</p>
      <ul v-if="levelErrors.length" class="space-y-0.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
        <li v-for="error in levelErrors" :key="error.path">{{ error.message }}</li>
      </ul>

      <template v-for="section in sections" :key="section.key">
        <div v-if="section.groups.length">
          <h3 class="mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">{{ section.label }}</h3>
          <ul class="space-y-2">
            <EditorAlbumCreditGroupRow v-for="group in section.groups" :key="group.key" :group="group" />
          </ul>
        </div>
      </template>
      <p v-if="!album.credits.length" class="text-sm text-gray-400">{{ $t('editor.credits.none') }}</p>

      <div class="rounded-xl border border-dashed border-gray-300 bg-gray-50/60 p-3">
        <p class="mb-2 text-xs font-semibold text-gray-600">{{ $t('editor.credits.add') }}</p>
        <div class="grid gap-2 sm:grid-cols-[10rem_11rem_minmax(0,1fr)] sm:items-start">
          <EditorRoleSelect v-model="draft.role" :level="draft.scope === 'album' ? 'album' : 'track'" class="w-full" />
          <select v-model="draft.scope" class="select select-sm w-full">
            <option value="album">{{ $t('editor.credits.whole_album') }}</option>
            <option value="tracks" :disabled="!album.tracks.length">{{ $t('editor.credits.on_tracks') }}</option>
          </select>
          <div class="space-y-2">
            <EditorAlbumTrackChooser v-if="draft.scope === 'tracks'" v-model="draft.tracks" />
            <EditorEntityPicker kind="artist" allow-create :placeholder="$t('editor.credits.pick_artist')" @select="addPicked" @create="addCreated" />
            <div class="flex gap-2">
              <input v-model="draft.name" class="input input-sm min-w-0 flex-1" :placeholder="$t('editor.credits.name_only')" @keydown.enter.prevent="addName">
              <button type="button" class="btn btn-sm" :disabled="!draft.name.trim()" @click="addName">{{ $t('common.add') }}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </CatalogSection>
</template>

<script setup lang="ts">
import type { PickedEntity } from '~/components/editor/EntityPicker.vue'
import type { AggregateRef, RowId } from '~/types/document'
import { Users } from '@lucide/vue'
import { addCredit, creditGroups, orderedTracks } from '~/utils/albumDocument'
import { sameId } from '~/utils/documentRows'

const editor = useAlbumEditor()
const { t } = useI18n()
const { roleOrder } = useCatalogSchema()
const album = computed(() => editor.album.value)

const levelErrors = computed(() => editor.errorsIn('credits').filter(error => error.path.split('.').length === 3))

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

const draft = reactive({ role: 'composer', scope: 'album' as 'album' | 'tracks', tracks: [] as RowId[], name: '' })
watch(() => draft.scope, (scope) => {
  if (scope === 'tracks' && !draft.tracks.length) draft.tracks = orderedTracks(album.value).map(track => track.id)
})
// Tracks removed meanwhile drop out of the selection.
watch(() => album.value.tracks.length, () => {
  draft.tracks = draft.tracks.filter(id => album.value.tracks.some(track => sameId(track.id, id)))
})

const add = (artistId: AggregateRef | null, creditedAs: string | null) => {
  const tracks = draft.scope === 'tracks' ? draft.tracks : null
  if (tracks && !tracks.length) return
  addCredit(album.value, { artist_id: artistId, credited_as: creditedAs, role: draft.role, detail: null }, tracks)
}
const addPicked = (item: PickedEntity) => {
  editor.remember('artist', item.id, { id: item.id, name: item.label, image_url: item.image_url })
  add(item.id, null)
}
const addCreated = (name: string) => add(editor.createItem('artist', { name, type: 'person' }), null)
const addName = () => {
  if (!draft.name.trim()) return
  add(null, draft.name.trim())
  draft.name = ''
}
</script>
