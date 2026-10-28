<template>
  <div class="space-y-2">
    <ul v-if="shown.length" class="space-y-1.5">
      <EditorListRow v-for="row in shown" :key="row.id" :invalid="empty(row.value)" @edit="edit(row)" @remove="remove(row)">
        <span class="shrink-0 text-xs text-meta">{{ attributeName(row.key) }}<span v-if="attributeNameEn(row.key)" class="ml-1 opacity-60">{{ attributeNameEn(row.key) }}</span></span>
        <span class="min-w-0 truncate text-sm font-medium text-title">{{ valueText(row) || '—' }}</span>
      </EditorListRow>
    </ul>
    <EditorAddButton v-if="definitions.length" :small="compact" :disabled="!available.length" @click="edit(null)">{{ $t('editor.add_attribute') }}</EditorAddButton>

    <EditorModal v-model="dialog" :title="$t(editing ? 'editor.dialog.attribute_edit' : 'editor.add_attribute')" :icon="ListChecks" @submit="save">
      <div class="space-y-4">
        <label class="block">
          <span class="mb-1 block text-sm font-medium text-body">{{ $t('editor.dialog.attribute_key') }}</span>
          <UiSelect v-model="form.key" :options="keyOptions" data-autofocus size="sm" class="w-full" @change="form.value = null" />
          <span v-if="hint(form.key)" class="mt-1 block text-[11px] leading-4 text-meta">{{ hint(form.key) }}</span>
        </label>
        <div>
          <span class="mb-1 block text-sm font-medium text-body">{{ $t('editor.dialog.attribute_value') }}</span>
          <EditorAttributeValueInput :key="form.key" v-model="form.value" :definition="attributeDefinition(form.key)" :references="known" @picked="remember" />
          <span v-if="tried && empty(form.value)" class="mt-1 block text-xs text-danger">{{ $t('editor.dialog.attribute_required') }}</span>
        </div>
      </div>
      <template #footer>
        <UiButton size="sm" class="ring-1 ring-inset ring-line shadow-xs active:translate-y-px" @click="dialog = false">{{ $t('common.cancel') }}</UiButton>
        <UiButton type="submit" variant="primary" size="sm" class="shadow-xs active:translate-y-px" :disabled="!form.key">{{ $t(editing ? 'common.save' : 'common.add') }}</UiButton>
      </template>
    </EditorModal>
  </div>
</template>

<script setup lang="ts">
import type { CatalogReferences } from '~/types/catalog'
import type { AttributeRow, RowId } from '~/types/document'
import type { UiSelectOption } from '~/components/ui/Select.vue'
import { ListChecks } from '@lucide/vue'
import { newKey } from '~/utils/documentKeys'
import { byOrder, nextOrder, sameId } from '~/utils/documentRows'

/**
 * Attribute rows of one subject type (album, track, album_image, artist, label), added and
 * edited in a dialog. With `owner` the model is a whole collection such as track_attributes and
 * only that track's rows are shown. `compact` when nested in a row, e.g. a track's details.
 */
const props = defineProps<{ subject: string, references: CatalogReferences, owner?: { field: string, id: RowId }, compact?: boolean }>()
const rows = defineModel<AttributeRow[]>({ required: true })

const { schema, attributeName, attributeNameEn, attributeDefinition } = useCatalogSchema()
const { attributeText } = useCatalogDisplay()
const { localizedContent } = useLocaleFormatting()

const definitions = computed(() => (schema.value?.attribute_definitions ?? []).filter(definition => definition.applies_to.includes(props.subject)))
const mine = (row: AttributeRow) => !props.owner || sameId((row as unknown as Record<string, RowId>)[props.owner.field], props.owner.id)
const shown = computed(() => byOrder(rows.value.filter(mine)))
const taken = (key: string, except: AttributeRow | null) => shown.value.some(row => row !== except && row.key === key)
const available = computed(() => definitions.value.filter(definition => definition.is_multiple || !taken(definition.key, null)))
const hint = (key: string) => localizedContent(attributeDefinition(key)?.description ?? null, '')
/** An option can only hold text, so the English name follows after a dot. */
const fieldLabel = (key: string) => [attributeName(key), attributeNameEn(key)].filter(Boolean).join(' · ')

/** Entities picked as values here, so their names show before the draft is saved and reloaded. */
const picked = ref<CatalogReferences>({})
const known = computed<CatalogReferences>(() => {
  const merged: CatalogReferences = { ...props.references }
  for (const [type, entries] of Object.entries(picked.value)) merged[type] = { ...(props.references[type] ?? {}), ...entries }
  return merged
})
const remember = (type: string, id: number, row: Record<string, unknown>) => {
  picked.value = { ...picked.value, [type]: { ...(picked.value[type] ?? {}), [String(id)]: row } }
}

const empty = (value: unknown) => value === null || value === undefined || value === ''
  || (typeof value === 'object' && 'date' in (value as object) && !(value as { date: string }).date)

const valueText = (row: AttributeRow) => {
  const value = row.value as { type?: string, id?: number } | null
  if (value && typeof value === 'object' && value.type && value.id) {
    const entity = known.value[value.type]?.[String(value.id)] as { name?: string, title?: string } | undefined
    return entity?.name ?? entity?.title ?? `#${value.id}`
  }
  return empty(row.value) ? '' : attributeText({ id: 0, key: row.key, value: row.value, label: null, sort_order: 0 })
}

const remove = (row: AttributeRow) => {
  const index = rows.value.indexOf(row)
  if (index >= 0) rows.value.splice(index, 1)
}

// ---- the dialog ----

const dialog = ref(false)
const editing = ref<AttributeRow | null>(null)
const keyOptions = computed<UiSelectOption<string>[]>(() => definitions.value.map(definition => ({
  value: definition.key,
  label: fieldLabel(definition.key),
  disabled: !definition.is_multiple && taken(definition.key, editing.value),
})))
const form = reactive({ key: '', value: null as unknown })
const tried = ref(false)

const edit = (row: AttributeRow | null) => {
  editing.value = row
  form.key = row?.key ?? available.value[0]?.key ?? ''
  form.value = row ? JSON.parse(JSON.stringify(row.value ?? null)) : null
  tried.value = false
  dialog.value = true
}

const save = () => {
  // An unticked yes/no attribute means no.
  if (attributeDefinition(form.key)?.value_type === 'boolean') form.value = !!form.value
  tried.value = true
  if (!form.key || empty(form.value)) return
  const value = form.value
  if (editing.value) {
    editing.value.key = form.key
    editing.value.value = value
  } else {
    rows.value.push({
      id: newKey('a'), key: form.key, value, sort_order: nextOrder(shown.value),
      ...(props.owner ? { [props.owner.field]: props.owner.id } : {}),
    } as AttributeRow)
  }
  dialog.value = false
}
</script>
