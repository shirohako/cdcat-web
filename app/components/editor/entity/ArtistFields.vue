<template>
  <div class="space-y-6">
    <CatalogSection :title="$t('editor.entity.section.basic')" :icon="UserRound" tone="indigo">
      <div class="grid gap-4 p-5 sm:grid-cols-2">
        <label class="block sm:col-span-2">
          <span class="mb-1 block text-sm font-medium text-gray-700">{{ $t('catalog.field.name') }} <span class="text-error">*</span></span>
          <input v-model="doc.name" class="input w-full" :class="{ 'input-error': editor.errorAt('name') }" maxlength="500" :placeholder="$t('editor.entity.artist_name_placeholder')">
          <span v-if="editor.errorAt('name')" class="mt-1 block text-xs text-error">{{ editor.errorAt('name') }}</span>
        </label>
        <label class="block">
          <span class="mb-1 block text-sm font-medium text-gray-700">{{ $t('catalog.field.type') }}</span>
          <select v-model="doc.type" class="select select-sm w-full">
            <option v-for="value in enums.artist_type ?? []" :key="value" :value="value">{{ enumLabel('artist_type', value) }}</option>
          </select>
        </label>
        <label class="block">
          <span class="mb-1 block text-sm font-medium text-gray-700">{{ $t('catalog.field.region') }}</span>
          <CommonRegionSelect :model-value="doc.region ?? ''" class="select-sm" @update:model-value="doc.region = $event || null" />
        </label>
        <div>
          <span class="mb-1 block text-sm font-medium text-gray-700">{{ $t(isPerson ? 'editor.entity.born' : 'editor.entity.active_from') }}</span>
          <EditorDateInput v-model:date="doc.begin_date" v-model:precision="doc.begin_date_precision" />
        </div>
        <div>
          <span class="mb-1 block text-sm font-medium text-gray-700">{{ $t(isPerson ? 'editor.entity.died' : 'editor.entity.active_until') }}</span>
          <EditorDateInput v-model:date="doc.end_date" v-model:precision="doc.end_date_precision" />
        </div>
        <div class="sm:col-span-2">
          <span class="mb-1 block text-sm font-medium text-gray-700">{{ $t('catalog.field.image_url') }}</span>
          <EditorImageUrlInput v-model="doc.image_url" />
        </div>
        <label class="block sm:col-span-2">
          <span class="mb-1 block text-sm font-medium text-gray-700">{{ $t('catalog.field.bio') }}</span>
          <textarea v-model="doc.bio" rows="5" class="textarea w-full text-sm" />
        </label>
        <EditorEntitySlugField v-model="doc.slug" class="sm:col-span-2" />
      </div>
    </CatalogSection>

    <CatalogSection :title="$t('editor.album.other_names')" :icon="Languages" tone="emerald">
      <div class="p-5"><EditorTitleRows v-model="doc.titles" /></div>
    </CatalogSection>

    <CatalogSection :title="$t('catalog.collection.relations')" :icon="Network" tone="purple">
      <div class="space-y-3 p-5">
        <p class="text-xs text-gray-500">{{ $t('editor.entity.artist_relations_hint') }}</p>
        <EditorRelationRows
          v-model="doc.relations"
          kind="artist"
          field="related_artist_id"
          :references="editor.references"
          :relations="{ group: 'artist_relation', values: enums.artist_relation ?? [], default: 'member_of' }"
          :extras="[
            { name: 'begin_date', type: 'date', precision: 'begin_date_precision', label: $t('catalog.field.begin_date') },
            { name: 'end_date', type: 'date', precision: 'end_date_precision', label: $t('catalog.field.end_date') },
            { name: 'note', label: $t('catalog.field.note'), wide: true },
          ]"
          :exclude="[editor.id]"
          :errors="id => editor.errorsIn(`relations.${id}`)"
          @picked="editor.remember('artist', $event.id, { id: $event.id, name: $event.label, image_url: $event.image_url })"
        />
      </div>
    </CatalogSection>

    <EditorEntityLinksAndDetails subject="artist" />
  </div>
</template>

<script setup lang="ts">
import type { ArtistDocument } from '~/types/document'
import { Languages, Network, UserRound } from '@lucide/vue'

const editor = useEntityEditor()
const { schema } = useCatalogSchema()
const { enumLabel } = useCatalogDisplay()
const doc = computed(() => editor.doc.value as unknown as ArtistDocument)
const enums = computed(() => schema.value?.enums ?? {})
const isPerson = computed(() => ['person', 'character'].includes(doc.value.type))
</script>
