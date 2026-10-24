<template>
  <div class="space-y-2">
    <ul v-if="shown.length" class="space-y-2">
      <li v-for="(row, index) in shown" :key="String(row.id)" class="flex flex-wrap items-center gap-2 rounded-lg px-3 py-2" :class="errorsOf(row.id).length ? 'bg-danger/10 ring-1 ring-inset ring-danger/25' : 'bg-sunken'">
        <div v-if="ordered" class="flex flex-col">
          <button type="button" class="text-faint transition-colors hover:text-primary disabled:opacity-30" :disabled="index === 0" :aria-label="$t('catalog.form.move_up')" @click="moveRow(rows, row, -1)"><ChevronUp :size="14" /></button>
          <button type="button" class="text-faint transition-colors hover:text-primary disabled:opacity-30" :disabled="index === shown.length - 1" :aria-label="$t('catalog.form.move_down')" @click="moveRow(rows, row, 1)"><ChevronDown :size="14" /></button>
        </div>
        <select v-if="relations" :value="get(row, 'relation_type')" class="select select-sm w-40" @change="set(row, 'relation_type', ($event.target as HTMLSelectElement).value)">
          <option v-for="value in relations.values" :key="value" :value="value">{{ enumLabel(relations.group, value) }}</option>
        </select>
        <EditorRefLabel :id="refId(row)" :type="kind" :references="references" class="min-w-32 flex-1 text-sm font-medium" />
        <template v-for="extra in extras" :key="extra.name">
          <EditorDateInput
            v-if="extra.type === 'date'"
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
        <button type="button" class="btn btn-ghost btn-sm px-2" :aria-label="$t('common.delete')" @click="remove(row)"><Trash2 :size="14" /></button>
        <p v-for="error in errorsOf(row.id)" :key="error.path" class="basis-full text-[11px] text-danger">{{ error.message }}</p>
      </li>
    </ul>
    <div class="flex flex-wrap items-center gap-2">
      <select v-if="relations" v-model="nextRelation" class="select select-sm w-40" :aria-label="$t('catalog.field.relation_type')">
        <option v-for="value in relations.values" :key="value" :value="value">{{ enumLabel(relations.group, value) }}</option>
      </select>
      <EditorEntityPicker :kind="kind" class="min-w-56 max-w-md flex-1" :placeholder="placeholder" :exclude="[...(exclude ?? []), ...shown.map(row => get(row, field) as number)]" @select="add" />
    </div>
  </div>
</template>

<script setup lang="ts" generic="T extends { id: RowId, sort_order?: number }">
import type { PickedEntity, PickerKind } from './EntityPicker.vue'
import type { FieldError } from '~/composables/useAlbumEditor'
import type { CatalogReferences } from '~/types/catalog'
import type { RowId } from '~/types/document'
import type { DatePrecision } from '~/types/entry'
import { ChevronDown, ChevronUp, Trash2 } from '@lucide/vue'
import { newKey } from '~/utils/documentKeys'
import { byOrder, moveRow, nextOrder } from '~/utils/documentRows'

interface Extra { name: string, label: string, type?: 'text' | 'number' | 'date', precision?: string, wide?: boolean }

/**
 * Rows that point at other entities: an artist's relations, a series' entries, an entry's albums …
 * `field` holds the other entity's id; `relations` offers relation types; `extras` are more fields.
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
const nextRelation = ref(props.relations?.default ?? props.relations?.values[0] ?? '')
const errorsOf = (id: RowId) => props.errors?.(id) ?? []

// Rows of several collections share this list, so their fields are read by name.
const get = (row: T, name: string) => (row as unknown as Record<string, unknown>)[name]
const set = (row: T, name: string, value: unknown) => { (row as unknown as Record<string, unknown>)[name] = value }
const refId = (row: T) => (get(row, props.field) ?? null) as number | string | null
const dateOf = (row: T, name: string) => (get(row, name) ?? null) as string | null
const precisionOf = (row: T, name: string) => (get(row, name) ?? 'day') as DatePrecision

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
    row[extra.name] = null
    if (extra.precision) row[extra.precision] = 'day'
  }
  if (props.ordered) row.sort_order = nextOrder(rows.value)
  rows.value.push(row as unknown as T)
}
</script>
