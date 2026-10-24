<template>
  <div class="space-y-6">
    <CatalogSection :title="$t('editor.entity.section.basic')" :icon="Library">
      <div class="grid gap-4 p-5 sm:grid-cols-2">
        <label class="block sm:col-span-2">
          <span class="mb-1 block text-sm font-medium text-body">{{ $t('catalog.field.name') }} <span class="text-danger">*</span></span>
          <input v-model="doc.name" class="input w-full" :class="{ 'input-error': editor.errorAt('name') }" maxlength="500">
          <span v-if="editor.errorAt('name')" class="mt-1 block text-xs text-danger">{{ editor.errorAt('name') }}</span>
        </label>
        <div class="sm:col-span-2">
          <span class="mb-1 block text-sm font-medium text-body">{{ $t('catalog.form.parent') }}</span>
          <EditorPickedRef v-if="doc.parent_id !== null" :id="doc.parent_id" type="franchise" :references="editor.references" :icon="Library" class="max-w-md" @remove="doc.parent_id = null" />
          <EditorEntityPicker v-else kind="franchise" class="max-w-md" :exclude="[editor.id]" :placeholder="$t('catalog.form.search_series')" @select="pickParent" />
          <p class="mt-1 text-[11px] text-meta">{{ $t('catalog.form.parent_hint') }}</p>
          <p v-if="editor.errorAt('parent_id')" class="mt-1 text-xs text-danger">{{ editor.errorAt('parent_id') }}</p>
        </div>
        <label v-if="doc.parent_id !== null" class="block">
          <span class="mb-1 block text-sm font-medium text-body">{{ $t('catalog.form.sort_order') }}</span>
          <input v-model.number="doc.sort_order" type="number" min="0" class="input input-sm w-32">
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

    <CatalogSection :title="$t('catalog.form.tab_entries')" :icon="Clapperboard">
      <div class="space-y-3 p-5">
        <p class="text-xs text-meta">{{ $t('catalog.form.series_entries_hint') }}</p>
        <EditorRelationRows
          v-model="doc.entries"
          kind="entry"
          field="entry_id"
          ordered
          :references="editor.references"
          :placeholder="$t('catalog.form.search_entry')"
          :errors="id => editor.errorsIn(`entries.${id}`)"
          @picked="editor.remember('entry', $event.id, { id: $event.id, name: $event.label, image_url: $event.image_url })"
        />
      </div>
    </CatalogSection>

    <CatalogSection :title="$t('catalog.form.tab_albums')" :icon="Disc3">
      <div class="space-y-3 p-5">
        <p class="text-xs text-meta">{{ $t('catalog.form.series_albums_hint') }}</p>
        <EditorRelationRows
          v-model="doc.albums"
          kind="album"
          field="album_id"
          ordered
          :references="editor.references"
          :placeholder="$t('catalog.form.search_album')"
          :errors="id => editor.errorsIn(`albums.${id}`)"
          @picked="editor.remember('album', $event.id, { id: $event.id, title: $event.label, image_url: $event.image_url })"
        />
      </div>
    </CatalogSection>

    <EditorEntityLinksAndDetails />
  </div>
</template>

<script setup lang="ts">
import type { PickedEntity } from '~/components/editor/EntityPicker.vue'
import type { FranchiseDocument } from '~/types/document'
import { Clapperboard, Disc3, Languages, Library } from '@lucide/vue'

const editor = useEntityEditor()
const doc = computed(() => editor.doc.value as unknown as FranchiseDocument)

const pickParent = (item: PickedEntity) => {
  editor.remember('franchise', item.id, { id: item.id, name: item.label, image_url: item.image_url })
  doc.value.parent_id = item.id
}
</script>
