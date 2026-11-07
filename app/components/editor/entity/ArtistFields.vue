<template>
  <div class="space-y-6">
    <CatalogSection :title="$t('editor.entity.section.basic')" :icon="UserRound">
      <div class="grid gap-4 p-5 sm:grid-cols-2">
        <label class="block sm:col-span-2">
          <span class="mb-1 block text-sm font-medium text-body">{{ $t('catalog.field.name') }}<EditorRequiredTag /></span>
          <input v-model="doc.name" class="input w-full" :class="{ 'input-error': editor.errorAt('name') }" maxlength="500" :placeholder="$t('editor.entity.artist_name_placeholder')">
          <span v-if="editor.errorAt('name')" class="mt-1 block text-xs text-danger">{{ editor.errorAt('name') }}</span>
        </label>
        <label class="block">
          <span class="mb-1 block text-sm font-medium text-body">{{ $t('catalog.field.type') }}<EditorRequiredTag /></span>
          <UiSelect v-model="doc.type" :options="typeOptions" :placeholder="$t('editor.entity.artist_type_placeholder')" size="sm" class="w-full" :invalid="!!editor.errorAt('type')" />
          <span v-if="editor.errorAt('type')" class="mt-1 block text-xs text-danger">{{ editor.errorAt('type') }}</span>
        </label>
        <label class="flex items-center gap-2 self-end pb-2 text-sm text-body">
          <input v-model="doc.is_active" type="checkbox" class="checkbox checkbox-sm">{{ $t('catalog.field.is_active') }}
        </label>
        <!-- Companies and circles act as labels; their prefixes help tell whose a catalog number is. -->
        <label v-if="doc.type === 'company' || doc.type === 'circle' || doc.catalog_prefixes.length" class="block sm:col-span-2">
          <span class="mb-1 block text-sm font-medium text-body">{{ $t('catalog.field.catalog_prefixes') }}</span>
          <input :value="doc.catalog_prefixes.join(', ')" class="input input-sm w-full font-mono" placeholder="KICA, KICS" @change="setPrefixes(($event.target as HTMLInputElement).value)">
          <span class="mt-1 block text-[11px] text-meta">{{ $t('editor.entity.prefixes_hint') }}</span>
        </label>
        <label class="block sm:col-span-2">
          <span class="mb-1 block text-sm font-medium text-body">{{ $t('catalog.field.bio') }}</span>
          <textarea v-model="doc.bio" rows="5" class="textarea w-full text-sm" />
        </label>
        <EditorEntitySlugField v-model="doc.slug" class="sm:col-span-2" />
      </div>
    </CatalogSection>

    <EditorEntityArtistImages />

    <CatalogSection :title="$t('editor.album.other_names')" :icon="Languages">
      <div class="p-5"><EditorTitleRows v-model="doc.titles" /></div>
    </CatalogSection>

    <CatalogSection :title="$t('catalog.collection.relations')" :icon="Network">
      <div class="space-y-3 p-5">
        <p class="text-xs text-meta">{{ $t('editor.entity.artist_relations_hint') }}</p>
        <EditorRelationRows
          v-model="doc.relations"
          kind="artist"
          field="related_artist_id"
          :references="editor.references"
          :relations="{ group: 'artist_relation', values: enums.artist_relation ?? [], default: relationsFor(doc.type)[0] }"
          :extras="[
            { name: 'ended', label: $t('catalog.field.ended'), type: 'checkbox', onlyFor: ENDING_RELATIONS },
            { name: 'note', label: $t('catalog.field.note'), wide: true },
          ]"
          :exclude="[editor.id]"
          :errors="id => editor.errorsIn(`relations.${id}`)"
          @picked="editor.remember('artist', $event.id, { id: $event.id, name: $event.label, image_url: $event.image_url })"
        >
          <template #relation="{ value, set }">
            <EditorEntityArtistRelationSelect :model-value="value" :type="doc.type" :name="doc.name" class="w-40" :aria-label="$t('catalog.field.relation_type')" @update:model-value="set" />
          </template>
        </EditorRelationRows>
      </div>
    </CatalogSection>

    <EditorEntityLinksAndDetails subject="artist" />
  </div>
</template>

<script setup lang="ts">
import type { ArtistDocument } from '~/types/document'
import type { UiSelectOption } from '~/components/ui/Select.vue'
import { Languages, Network, UserRound } from '@lucide/vue'
import { ENDING_RELATIONS, relationsFor } from '~/types/artist'

const editor = useEntityEditor()
const { schema } = useCatalogSchema()
const { enumLabel } = useCatalogDisplay()
const doc = computed(() => editor.doc.value as unknown as ArtistDocument)
const enums = computed(() => schema.value?.enums ?? {})
const typeOptions = computed<UiSelectOption<string | null>[]>(() => (enums.value.artist_type ?? []).map(value => ({ value, label: enumLabel('artist_type', value) })))

const setPrefixes = (text: string) => {
  doc.value.catalog_prefixes = [...new Set(text.split(/[,，\s]+/).map(prefix => prefix.trim().toUpperCase()).filter(Boolean))]
}
</script>
