<template>
  <li class="grid gap-2 rounded-lg border border-gray-100 px-3 py-2.5 sm:grid-cols-[10rem_minmax(0,1fr)_9rem_7rem_11rem_auto] sm:items-center" :class="{ 'border-rose-200 bg-rose-50/40': errors.length }">
    <EditorRoleSelect :model-value="group.role" :level="group.album ? 'album' : 'track'" class="w-full" @update:model-value="update({ role: $event })" />
    <div class="min-w-0">
      <div v-if="group.artist_id !== null" class="flex min-w-0 items-center gap-1.5 text-sm">
        <EditorRefLabel :id="group.artist_id" type="artist" :references="editor.references" :pending="editor.pending.value" class="min-w-0" />
        <button type="button" class="btn btn-ghost btn-xs shrink-0 px-1" :title="$t('editor.credits.unlink_artist')" @click="unlink"><X :size="12" /></button>
      </div>
      <EditorEntityPicker v-else kind="artist" allow-create :placeholder="$t('editor.credits.link_artist')" @select="link" @create="create" />
    </div>
    <input :value="group.credited_as ?? ''" class="input input-sm w-full" :placeholder="$t('editor.album.credited_as_placeholder')" @change="update({ credited_as: ($event.target as HTMLInputElement).value || null })">
    <input :value="group.detail ?? ''" class="input input-sm w-full" :placeholder="$t('catalog.field.detail')" maxlength="100" @change="update({ detail: ($event.target as HTMLInputElement).value || null })">
    <div class="flex items-center gap-1">
      <select :value="group.album ? 'album' : 'tracks'" class="select select-sm w-full" :aria-label="$t('editor.credits.scope')" @change="setCreditScope(album, group, ($event.target as HTMLSelectElement).value === 'album')">
        <option value="album">{{ $t('editor.credits.whole_album') }}</option>
        <option value="tracks" :disabled="!album.tracks.length">{{ $t('editor.credits.on_tracks') }}</option>
      </select>
    </div>
    <button type="button" class="btn btn-ghost btn-sm justify-self-end px-2" :aria-label="$t('common.delete')" @click="removeCreditGroup(album, group)"><Trash2 :size="14" /></button>
    <div v-if="!group.album" class="sm:col-span-6">
      <EditorAlbumTrackChooser :model-value="group.trackIds" @update:model-value="setCreditTracks(album, group, $event)" />
    </div>
    <p v-for="error in errors" :key="error.path" class="text-[11px] text-error sm:col-span-6">{{ error.message }}</p>
  </li>
</template>

<script setup lang="ts">
import type { PickedEntity } from '~/components/editor/EntityPicker.vue'
import type { CreditGroup } from '~/utils/albumDocument'
import { Trash2, X } from '@lucide/vue'
import { removeCreditGroup, setCreditScope, setCreditTracks, updateCreditGroup } from '~/utils/albumDocument'

/** One person in one role (and detail), on the whole album or on a set of tracks. */
const props = defineProps<{ group: CreditGroup }>()
const editor = useAlbumEditor()
const album = computed(() => editor.album.value)
const errors = computed(() => props.group.rows.flatMap(row => editor.errorsIn(`credits.${row.id}`)))

const update = (patch: Parameters<typeof updateCreditGroup>[2]) => updateCreditGroup(album.value, props.group, patch)

const link = (item: PickedEntity) => {
  editor.remember('artist', item.id, { id: item.id, name: item.label, image_url: item.image_url })
  update({ artist_id: item.id })
}
const create = (name: string) => update({ artist_id: editor.createItem('artist', { name, type: 'person' }) })

/** Keeps the name as printed when the artist link is removed. */
const unlink = () => {
  const name = props.group.credited_as || (typeof props.group.artist_id === 'number'
    ? String((editor.references.artist?.[String(props.group.artist_id)] as { name?: string } | undefined)?.name ?? '')
    : editor.pending.value[String(props.group.artist_id).replace(/^@/, '')] ?? '')
  update({ artist_id: null, credited_as: name || null })
}
</script>
