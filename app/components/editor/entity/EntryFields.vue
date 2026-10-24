<template>
  <div class="space-y-6">
    <CatalogSection :title="$t('editor.entity.section.basic')" :icon="Clapperboard">
      <div class="grid gap-4 p-5 sm:grid-cols-2">
        <label class="block sm:col-span-2">
          <span class="mb-1 block text-sm font-medium text-body">{{ $t('catalog.field.name') }} <span class="text-danger">*</span></span>
          <input v-model="doc.name" class="input w-full" :class="{ 'input-error': editor.errorAt('name') }" maxlength="500" :placeholder="$t('editor.entity.entry_name_placeholder')">
          <span v-if="editor.errorAt('name')" class="mt-1 block text-xs text-danger">{{ editor.errorAt('name') }}</span>
        </label>
        <label class="block">
          <span class="mb-1 block text-sm font-medium text-body">{{ $t('catalog.field.type') }}</span>
          <UiSelect v-model="doc.type" :options="typeOptions" size="sm" class="w-full" />
        </label>
        <label v-if="formats.length" class="block">
          <span class="mb-1 block text-sm font-medium text-body">{{ $t('catalog.field.format') }}</span>
          <UiSelect v-model="doc.format" :options="formatOptions" size="sm" class="w-full" />
        </label>
        <div>
          <span class="mb-1 block text-sm font-medium text-body">{{ $t('catalog.field.release_date') }}</span>
          <EditorDateInput v-model:date="doc.release_date" v-model:precision="doc.release_date_precision" />
        </div>
        <label v-if="doc.type === 'game'" class="block sm:col-span-2">
          <span class="mb-1 block text-sm font-medium text-body">{{ $t('catalog.field.platforms') }}</span>
          <input :value="doc.platforms.join(', ')" class="input input-sm w-full" :placeholder="$t('catalog.form.platforms_hint')" @change="doc.platforms = splitList(($event.target as HTMLInputElement).value)">
        </label>
        <div class="sm:col-span-2">
          <span class="mb-1 block text-sm font-medium text-body">{{ $t('catalog.field.image_url') }}</span>
          <EditorImageUrlInput v-model="doc.image_url" />
        </div>
        <div class="sm:col-span-2">
          <span class="mb-1 block text-sm font-medium text-body">{{ $t('catalog.field.banner_url') }}</span>
          <EditorImageUrlInput v-model="doc.banner_url" wide />
        </div>
        <label class="block sm:col-span-2">
          <span class="mb-1 block text-sm font-medium text-body">{{ $t('catalog.field.description') }}</span>
          <textarea v-model="doc.description" rows="5" class="textarea w-full text-sm" />
        </label>
        <EditorEntitySlugField v-model="doc.slug" class="sm:col-span-2" />
      </div>
    </CatalogSection>

    <CatalogSection :title="$t('editor.album.other_names')" :icon="Languages">
      <div class="p-5"><EditorTitleRows v-model="doc.titles" /></div>
    </CatalogSection>

    <CatalogSection :title="$t('catalog.form.related_albums')" :icon="Disc3">
      <div class="space-y-3 p-5">
        <p class="text-xs text-meta">{{ $t('catalog.form.related_albums_hint') }}</p>
        <EditorRelationRows
          v-model="doc.albums"
          kind="album"
          field="album_id"
          :references="editor.references"
          :relations="{ group: 'entry_album_relation', values: enums.entry_album_relation ?? [], default: 'ost' }"
          :extras="[
            { name: 'note', label: $t('catalog.field.note'), wide: true },
          ]"
          :placeholder="$t('catalog.form.search_album')"
          :errors="id => editor.errorsIn(`albums.${id}`)"
          @picked="editor.remember('album', $event.id, { id: $event.id, title: $event.label, image_url: $event.image_url })"
        />
      </div>
    </CatalogSection>

    <CatalogSection :title="$t('catalog.form.related_entries')" :icon="Network">
      <div class="space-y-3 p-5">
        <p class="text-xs text-meta">{{ $t('catalog.form.related_entries_hint') }}</p>
        <EditorRelationRows
          v-model="doc.relations"
          kind="entry"
          field="related_entry_id"
          :references="editor.references"
          :relations="{ group: 'entry_relation', values: enums.entry_relation ?? [], default: 'sequel' }"
          :extras="[{ name: 'note', label: $t('catalog.field.note'), wide: true }]"
          :exclude="[editor.id]"
          :placeholder="$t('catalog.form.search_entry')"
          :errors="id => editor.errorsIn(`relations.${id}`)"
          @picked="editor.remember('entry', $event.id, { id: $event.id, name: $event.label, image_url: $event.image_url })"
        />
      </div>
    </CatalogSection>

    <EditorEntityLinksAndDetails />
  </div>
</template>

<script setup lang="ts">
import type { EntryDocument } from '~/types/document'
import type { UiSelectOption } from '~/components/ui/Select.vue'
import { Clapperboard, Disc3, Languages, Network } from '@lucide/vue'
import { ENTRY_FORMATS, ENTRY_TYPES } from '~/types/entry'

const editor = useEntityEditor()
const { schema } = useCatalogSchema()
const { enumLabel } = useCatalogDisplay()
const { t } = useI18n()
const doc = computed(() => editor.doc.value as unknown as EntryDocument)
const enums = computed(() => schema.value?.enums ?? {})
const formats = computed(() => ENTRY_FORMATS[doc.value.type as keyof typeof ENTRY_FORMATS] ?? [])
const typeOptions = computed<UiSelectOption<string>[]>(() => ENTRY_TYPES.map(value => ({ value, label: enumLabel('entry_type', value) })))
const formatOptions = computed<UiSelectOption<string | null>[]>(() => [
  { value: null, label: t('catalog.form.format_none') },
  ...formats.value.map(value => ({ value, label: enumLabel('format', value) })),
])

// A format of another type does not apply after the type changes.
watch(() => doc.value.type, () => {
  if (doc.value.format && !formats.value.includes(doc.value.format)) doc.value.format = null
})

const splitList = (text: string) => [...new Set(text.split(/[,，、]/).map(item => item.trim()).filter(Boolean))]
</script>
