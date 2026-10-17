<template>
  <div class="space-y-6">
    <CatalogSection :title="$t('editor.entity.section.basic')" :icon="Music" tone="indigo">
      <div class="space-y-4 p-5">
        <p class="text-xs text-gray-500">{{ $t('editor.entity.work_hint') }}</p>
        <label class="block">
          <span class="mb-1 block text-sm font-medium text-gray-700">{{ $t('catalog.field.title') }} <span class="text-error">*</span></span>
          <input v-model="doc.title" class="input w-full" :class="{ 'input-error': editor.errorAt('title') }" maxlength="500">
          <span v-if="editor.errorAt('title')" class="mt-1 block text-xs text-error">{{ editor.errorAt('title') }}</span>
        </label>
        <label class="block">
          <span class="mb-1 block text-sm font-medium text-gray-700">{{ $t('catalog.field.description') }}</span>
          <textarea v-model="doc.description" rows="4" class="textarea w-full text-sm" />
        </label>
      </div>
    </CatalogSection>

    <CatalogSection :title="$t('editor.album.other_names')" :icon="Languages" tone="emerald">
      <div class="p-5"><EditorTitleRows v-model="doc.titles" /></div>
    </CatalogSection>

    <CatalogSection :title="$t('catalog.collection.credits')" :icon="Contact" tone="purple">
      <div class="space-y-3 p-5">
        <p class="text-xs text-gray-500">{{ $t('editor.entity.work_credits_hint') }}</p>
        <ul class="space-y-2">
          <li v-for="credit in credits" :key="credit.id" class="flex flex-wrap items-center gap-2 rounded-lg border border-gray-100 px-3 py-2" :class="{ 'border-rose-200 bg-rose-50/40': editor.errorsIn(`credits.${credit.id}`).length }">
            <EditorRoleSelect v-model="credit.role" level="work" class="w-40" />
            <template v-if="credit.artist_id !== null">
              <EditorRefLabel :id="credit.artist_id" type="artist" :references="editor.references" class="min-w-32 flex-1 text-sm" />
              <input v-model="credit.credited_as" class="input input-sm w-36" :placeholder="$t('editor.album.credited_as_placeholder')">
            </template>
            <input v-else v-model="credit.credited_as" class="input input-sm min-w-40 flex-1" :placeholder="$t('editor.credits.name_only')">
            <input v-model="credit.detail" class="input input-sm w-28" maxlength="100" :placeholder="$t('catalog.field.detail')">
            <button type="button" class="btn btn-ghost btn-sm px-2" :aria-label="$t('common.delete')" @click="removeCredit(credit.id)"><Trash2 :size="14" /></button>
            <p v-for="error in editor.errorsIn(`credits.${credit.id}`)" :key="error.path" class="basis-full text-[11px] text-error">{{ error.message }}</p>
          </li>
        </ul>
        <div class="flex flex-wrap items-center gap-2">
          <EditorRoleSelect v-model="nextRole" level="work" class="w-40" />
          <EditorEntityPicker kind="artist" class="min-w-56 max-w-md flex-1" :placeholder="$t('editor.credits.pick_artist')" @select="addCredit" />
          <button type="button" class="btn btn-ghost btn-sm" @click="addNameCredit">{{ $t('editor.entity.name_only_credit') }}</button>
        </div>
      </div>
    </CatalogSection>

    <CatalogSection :title="$t('editor.entity.work_relations')" :icon="Network" tone="rose">
      <div class="space-y-3 p-5">
        <p class="text-xs text-gray-500">{{ $t('editor.entity.work_relations_hint') }}</p>
        <EditorRelationRows
          v-model="doc.relations"
          kind="work"
          field="related_work_id"
          :references="editor.references"
          :relations="{ group: 'work_relation', values: enums.work_relation ?? [], default: 'arranged_from' }"
          :extras="[{ name: 'note', label: $t('catalog.field.note'), wide: true }]"
          :exclude="[editor.id]"
          :errors="id => editor.errorsIn(`relations.${id}`)"
          @picked="editor.remember('work', $event.id, { id: $event.id, title: $event.label })"
        />
      </div>
    </CatalogSection>

    <CatalogSection :title="$t('editor.entity.work_entries')" :icon="Clapperboard" tone="sky">
      <div class="space-y-3 p-5">
        <p class="text-xs text-gray-500">{{ $t('editor.entity.work_entries_hint') }}</p>
        <EditorRelationRows
          v-model="doc.entries"
          kind="entry"
          field="entry_id"
          ordered
          :references="editor.references"
          :relations="{ group: 'entry_work_relation', values: enums.entry_work_relation ?? [], default: 'bgm' }"
          :extras="[{ name: 'episode', type: 'number', label: $t('catalog.form.episode') }, { name: 'note', label: $t('catalog.field.note'), wide: true }]"
          :errors="id => editor.errorsIn(`entries.${id}`)"
          @picked="editor.remember('entry', $event.id, { id: $event.id, name: $event.label, image_url: $event.image_url })"
        />
      </div>
    </CatalogSection>

    <EditorEntityLinksAndDetails subject="work" />
  </div>
</template>

<script setup lang="ts">
import type { PickedEntity } from '~/components/editor/EntityPicker.vue'
import type { RowId, WorkDocument } from '~/types/document'
import { Clapperboard, Contact, Languages, Music, Network, Trash2 } from '@lucide/vue'
import { newKey } from '~/utils/documentKeys'
import { byOrder, nextOrder, sameId } from '~/utils/documentRows'

const editor = useEntityEditor()
const { schema } = useCatalogSchema()
const doc = computed(() => editor.doc.value as unknown as WorkDocument)
const enums = computed(() => schema.value?.enums ?? {})
const credits = computed(() => byOrder(doc.value.credits))
const nextRole = ref('composer')

const pushCredit = (artistId: number | null, creditedAs: string | null) => {
  doc.value.credits.push({ id: newKey('wc'), artist_id: artistId, credited_as: creditedAs, role: nextRole.value, detail: null, sort_order: nextOrder(doc.value.credits) })
}
const addCredit = (item: PickedEntity) => {
  editor.remember('artist', item.id, { id: item.id, name: item.label, image_url: item.image_url })
  pushCredit(item.id, null)
}
const addNameCredit = () => pushCredit(null, '')
const removeCredit = (id: RowId) => { doc.value.credits = doc.value.credits.filter(credit => !sameId(credit.id, id)) }
</script>
