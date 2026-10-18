<template>
  <div class="space-y-6">
    <CatalogSection :title="$t('editor.entity.section.basic')" :icon="Building2" tone="amber">
      <div class="grid gap-4 p-5 sm:grid-cols-2">
        <label class="block sm:col-span-2">
          <span class="mb-1 block text-sm font-medium text-gray-700">{{ $t('catalog.field.name') }} <span class="text-error">*</span></span>
          <input v-model="doc.name" class="input w-full" :class="{ 'input-error': editor.errorAt('name') }" maxlength="500">
          <span v-if="editor.errorAt('name')" class="mt-1 block text-xs text-error">{{ editor.errorAt('name') }}</span>
        </label>
        <div class="sm:col-span-2">
          <span class="mb-1 block text-sm font-medium text-gray-700">{{ $t('editor.entity.parent_label') }}</span>
          <EditorPickedRef v-if="doc.parent_id !== null" :id="doc.parent_id" type="label" :references="editor.references" :icon="Building2" class="max-w-md" @remove="doc.parent_id = null" />
          <EditorEntityPicker v-else kind="label" class="max-w-md" :exclude="[editor.id]" @select="pickParent" />
          <p class="mt-1 text-[11px] text-gray-400">{{ $t('editor.entity.parent_label_hint') }}</p>
          <p v-if="editor.errorAt('parent_id')" class="mt-1 text-xs text-error">{{ editor.errorAt('parent_id') }}</p>
        </div>
        <label class="block">
          <span class="mb-1 block text-sm font-medium text-gray-700">{{ $t('catalog.field.country') }}</span>
          <CommonRegionSelect :model-value="doc.country ?? ''" class="select-sm" @update:model-value="doc.country = $event || null" />
        </label>
        <label class="block">
          <span class="mb-1 block text-sm font-medium text-gray-700">{{ $t('catalog.field.catalog_prefixes') }}</span>
          <input :value="doc.catalog_prefixes.join(', ')" class="input input-sm w-full font-mono" placeholder="KICA, KICS" @change="setPrefixes(($event.target as HTMLInputElement).value)">
          <span class="mt-1 block text-[11px] text-gray-400">{{ $t('editor.entity.prefixes_hint') }}</span>
        </label>
        <div>
          <span class="mb-1 block text-sm font-medium text-gray-700">{{ $t('editor.entity.founded') }}</span>
          <EditorDateInput v-model:date="doc.begin_date" v-model:precision="doc.begin_date_precision" />
        </div>
        <div>
          <span class="mb-1 block text-sm font-medium text-gray-700">{{ $t('editor.entity.dissolved') }}</span>
          <EditorDateInput v-model:date="doc.end_date" v-model:precision="doc.end_date_precision" />
        </div>
        <div class="sm:col-span-2">
          <span class="mb-1 block text-sm font-medium text-gray-700">{{ $t('catalog.field.image_url') }}</span>
          <EditorImageUrlInput v-model="doc.image_url" />
        </div>
        <label class="block sm:col-span-2">
          <span class="mb-1 block text-sm font-medium text-gray-700">{{ $t('catalog.field.description') }}</span>
          <textarea v-model="doc.description" rows="4" class="textarea w-full text-sm" />
        </label>
        <EditorEntitySlugField v-model="doc.slug" class="sm:col-span-2" />
      </div>
    </CatalogSection>

    <CatalogSection :title="$t('editor.album.other_names')" :icon="Languages" tone="emerald">
      <div class="p-5"><EditorTitleRows v-model="doc.titles" /></div>
    </CatalogSection>

    <EditorEntityLinksAndDetails subject="label" />
  </div>
</template>

<script setup lang="ts">
import type { PickedEntity } from '~/components/editor/EntityPicker.vue'
import type { LabelDocument } from '~/types/document'
import { Building2, Languages } from '@lucide/vue'

const editor = useEntityEditor()
const doc = computed(() => editor.doc.value as unknown as LabelDocument)

const pickParent = (item: PickedEntity) => {
  editor.remember('label', item.id, { id: item.id, name: item.label, image_url: item.image_url })
  doc.value.parent_id = item.id
}

const setPrefixes = (text: string) => {
  doc.value.catalog_prefixes = [...new Set(text.split(/[,，\s]+/).map(prefix => prefix.trim().toUpperCase()).filter(Boolean))]
}
</script>
