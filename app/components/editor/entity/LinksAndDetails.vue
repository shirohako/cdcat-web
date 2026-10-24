<template>
  <CatalogSection :title="$t('catalog.collection.links')" :icon="Link2">
    <div class="space-y-3 p-5">
      <p class="text-xs text-meta">{{ $t('editor.relations.links_hint') }}</p>
      <ul v-if="linkErrors.length" class="space-y-0.5 text-xs text-danger">
        <li v-for="error in linkErrors" :key="error.path">{{ error.message }}</li>
      </ul>
      <EditorLinkRows v-model="links" />
    </div>
  </CatalogSection>
  <CatalogSection v-if="subject" :title="$t('catalog.collection.attributes')" :icon="ListChecks">
    <div class="space-y-3 p-5">
      <p class="text-xs text-meta">{{ $t('editor.relations.attributes_hint') }}</p>
      <EditorAttributeRows v-model="attributes" :subject="subject" :references="editor.references" />
    </div>
  </CatalogSection>
</template>

<script setup lang="ts">
import type { AttributeRow, LinkRow } from '~/types/document'
import { Link2, ListChecks } from '@lucide/vue'

/** Links of the entity being edited and, for types with attribute definitions, its details. */
defineProps<{ subject?: string }>()
const editor = useEntityEditor()

const links = computed({
  get: () => (editor.doc.value.links ?? []) as LinkRow[],
  set: (value: LinkRow[]) => { editor.doc.value.links = value },
})
const attributes = computed({
  get: () => (editor.doc.value.attributes ?? []) as AttributeRow[],
  set: (value: AttributeRow[]) => { editor.doc.value.attributes = value },
})
const linkErrors = computed(() => editor.errorsIn('links'))
</script>
