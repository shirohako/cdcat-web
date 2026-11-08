<template>
  <div class="space-y-2">
    <ul v-if="shown.length" class="space-y-2">
      <li v-for="(row, index) in shown" :key="String(row.id)" class="flex flex-wrap items-center gap-2 rounded-lg px-3 py-2" :class="errorsOf(row.id).length ? 'bg-danger/10 ring-1 ring-inset ring-danger/25' : 'bg-sunken'">
        <div v-if="ordered" class="flex gap-1">
          <UiButton :icon="ChevronUp" :label="$t('catalog.form.move_up')" size="xs" :disabled="index === 0" @click="moveRow(rows, row, -1)" />
          <UiButton :icon="ChevronDown" :label="$t('catalog.form.move_down')" size="xs" :disabled="index === shown.length - 1" @click="moveRow(rows, row, 1)" />
        </div>
        <slot name="relation" :value="get(row, 'relation_type') as string" :set="(value: string) => setRelation(row, value)">
          <UiSelect v-if="relations" :model-value="get(row, 'relation_type') as string" :options="relationOptions" size="sm" class="w-40" @change="value => setRelation(row, value)" />
        </slot>
        <EditorRefLabel :id="refId(row)" :type="kind" :references="references" class="min-w-32 flex-1 text-sm font-medium" />
        <template v-for="extra in extras" :key="extra.name">
          <label v-if="extra.type === 'checkbox'" v-show="applies(row, extra)" class="flex shrink-0 cursor-pointer items-center gap-1.5 text-xs text-body">
            <input type="checkbox" class="checkbox checkbox-xs" :checked="Boolean(get(row, extra.name))" @change="set(row, extra.name, ($event.target as HTMLInputElement).checked)">
            {{ extra.label }}
          </label>
          <EditorDateInput
            v-else-if="extra.type === 'date'"
            :date="dateOf(row, extra.name)"
            :precision="precisionOf(row, extra.precision!)"
            @update:date="set(row, extra.name, $event)"
            @update:precision="set(row, extra.precision!, $event)"
          />
          <input
            v-else
            :value="get(row, extra.name) ?? ''"
            :type="extra.type === 'number' ? 'number' : 'text'"
            class="input input-sm"
            :class="extra.wide ? 'min-w-48 flex-1 basis-full sm:basis-auto' : 'w-32'"
            :placeholder="extra.label"
            :title="extra.label"
            @change="setExtra(row, extra, ($event.target as HTMLInputElement).value)"
          >
        </template>
        <UiButton :icon="Trash2" :label="$t('common.delete')" icon-class="size-3.5" size="sm" @click="remove(row)" />
        <p v-for="error in errorsOf(row.id)" :key="error.path" class="basis-full text-11 text-danger">{{ error.message }}</p>
      </li>
    </ul>
    <div class="flex flex-wrap items-center gap-2">
      <slot name="relation" :value="nextRelation" :set="setNext">
        <UiSelect v-if="relations" v-model="nextRelation" :options="relationOptions" size="sm" class="w-40" :aria-label="$t('catalog.field.relation_type')" />
      </slot>
      <EditorEntityPicker :kind="kind" class="min-w-56 max-w-md flex-1" :placeholder="placeholder" :exclude="[...(exclude ?? []), ...shown.map(row => get(row, field) as number)]" @select="add" />
    </div>
  </div>
</template>

<script setup lang="ts" generic="T extends { id: RowId, sort_order?: number }">
import type { PickedEntity, PickerKind } from './EntityPicker.vue'
import type { FieldError } from '~/composables/useAlbumEditor'
import type { CatalogReferences } from '~/types/catalog'
import type { UiSelectOption } from '~/components/ui/Select.vue'
import type { RowId } from '~/types/document'
import type { DatePrecision } from '~/types/entry'
import { ChevronDown, ChevronUp, Trash2 } from '@lucide/vue'
import { newKey } from '~/utils/documentKeys'
import { byOrder, moveRow, nextOrder } from '~/utils/documentRows'

/** A further field of each row; a checkbox may apply only to some relation types (`onlyFor`), e.g. "ended" for members. */
interface Extra { name: string, label: string, type?: 'text' | 'number' | 'date' | 'checkbox', precision?: string, wide?: boolean, onlyFor?: readonly string[] }

/**
 * Rows that point at other entities: an artist's relations, a series' entries, an entry's albums …
 * `field` holds the other entity's id; `relations` offers relation types; `extras` are more fields. The `relation` slot
 * replaces the relation select, on every row and next to the search.
 */
const props = defineProps<{
  kind: PickerKind
  field: string
  references: CatalogReferences
  relations?: { group: string, values: string[], default?: string }
  extras?: Extra[]
  ordered?: boolean
  exclude?: Array<number | string | null>
  placeholder?: string
  errors?: (id: RowId) => FieldError[]
}>()
const rows = defineModel<T[]>({ required: true })
const emit = defineEmits<{ picked: [PickedEntity] }>()

const { enumLabel } = useCatalogDisplay()
const shown = computed(() => props.ordered ? byOrder(rows.value) : rows.value)
const relationOptions = computed<UiSelectOption<string>[]>(() => props.relations ? props.relations.values.map(value => ({ value, label: enumLabel(props.relations!.group, value) })) : [])
const nextRelation = ref(props.relations?.default ?? props.relations?.values[0] ?? '')
const setNext = (value: string) => { nextRelation.value = value }
watch(() => props.relations?.default, (value) => { if (value) setNext(value) })
const errorsOf = (id: RowId) => props.errors?.(id) ?? []

// Rows of several collections share this list, so their fields are read by name.
const get = (row: T, name: string) => (row as unknown as Record<string, unknown>)[name]
const set = (row: T, name: string, value: unknown) => { (row as unknown as Record<string, unknown>)[name] = value }
const refId = (row: T) => (get(row, props.field) ?? null) as number | string | null
const dateOf = (row: T, name: string) => (get(row, name) ?? null) as string | null
const precisionOf = (row: T, name: string) => (get(row, name) ?? 'day') as DatePrecision

const applies = (row: T, extra: Extra) => !extra.onlyFor || extra.onlyFor.includes(get(row, 'relation_type') as string)

/** A new relation type clears the checkboxes that do not apply to it (an alias cannot have "ended"). */
const setRelation = (row: T, value: string) => {
  set(row, 'relation_type', value)
  for (const extra of props.extras ?? []) {
    if (extra.type === 'checkbox' && !applies(row, extra)) set(row, extra.name, false)
  }
}

const setExtra = (row: T, extra: Extra, value: string) => set(row, extra.name, value === '' ? null : extra.type === 'number' ? Number(value) : value)

const remove = (row: T) => {
  const index = rows.value.indexOf(row)
  if (index >= 0) rows.value.splice(index, 1)
}

const add = (item: PickedEntity) => {
  emit('picked', item)
  const row: Record<string, unknown> = { id: newKey('r'), [props.field]: item.id }
  if (props.relations) row.relation_type = nextRelation.value
  for (const extra of props.extras ?? []) {
    row[extra.name] = extra.type === 'checkbox' ? false : null
    if (extra.precision) row[extra.precision] = 'day'
  }
  if (props.ordered) row.sort_order = nextOrder(rows.value)
  rows.value.push(row as unknown as T)
}
</script>
