<template>
  <div class="space-y-2">
    <div v-for="row in shown" :key="row.id" class="flex flex-wrap items-start gap-2">
      <select v-model="row.key" class="select select-sm w-44" @change="row.value = null">
        <option v-for="definition in definitions" :key="definition.key" :value="definition.key" :disabled="!definition.is_multiple && taken(definition.key, row)">
          {{ attributeName(definition.key) }}
        </option>
      </select>
      <EditorAttributeValueInput v-model="row.value" :definition="attributeDefinition(row.key)" :references="references" class="min-w-48 flex-1" />
      <button type="button" class="btn btn-ghost btn-sm px-2" :aria-label="$t('common.delete')" @click="remove(row)"><Trash2 :size="14" /></button>
      <p v-if="hint(row.key)" class="basis-full pl-1 text-[11px] text-gray-400">{{ hint(row.key) }}</p>
    </div>
    <button v-if="definitions.length" type="button" class="btn btn-ghost btn-xs gap-1" @click="add"><Plus :size="12" />{{ $t('editor.add_attribute') }}</button>
  </div>
</template>

<script setup lang="ts">
import type { CatalogReferences } from '~/types/catalog'
import type { AttributeRow, RowId } from '~/types/document'
import { Plus, Trash2 } from '@lucide/vue'
import { newKey } from '~/utils/documentKeys'
import { byOrder, nextOrder, sameId } from '~/utils/documentRows'

/**
 * Attribute rows of one subject type (album, track, album_image, work, artist, label). With `owner`
 * the model is a whole collection such as track_attributes and only that track's rows are shown.
 */
const props = defineProps<{ subject: string, references: CatalogReferences, owner?: { field: string, id: RowId } }>()
const rows = defineModel<AttributeRow[]>({ required: true })

const { schema, attributeName, attributeDefinition } = useCatalogSchema()
const { localizedContent } = useLocaleFormatting()

const definitions = computed(() => (schema.value?.attribute_definitions ?? []).filter(definition => definition.applies_to.includes(props.subject)))
const mine = (row: AttributeRow) => !props.owner || sameId((row as unknown as Record<string, RowId>)[props.owner.field], props.owner.id)
const shown = computed(() => byOrder(rows.value.filter(mine)))
const taken = (key: string, except: AttributeRow | null) => shown.value.some(row => row !== except && row.key === key)
const hint = (key: string) => localizedContent(attributeDefinition(key)?.description ?? null, '')

const remove = (row: AttributeRow) => {
  const index = rows.value.indexOf(row)
  if (index >= 0) rows.value.splice(index, 1)
}

const add = () => {
  const first = definitions.value.find(definition => definition.is_multiple || !taken(definition.key, null))
  if (!first) return
  rows.value.push({
    id: newKey('a'), key: first.key, value: null, sort_order: nextOrder(shown.value),
    ...(props.owner ? { [props.owner.field]: props.owner.id } : {}),
  } as AttributeRow)
}
</script>
