<template>
  <div class="space-y-4 text-sm">
    <p v-if="!changes.length" class="py-6 text-center text-gray-400">{{ $t('versions.no_changes') }}</p>

    <table v-if="fieldChanges.length" class="table table-sm">
      <tbody>
        <tr v-for="change in fieldChanges" :key="change.name">
          <th class="w-32 align-top text-xs font-medium text-gray-500">{{ fieldLabel(change.name) }}</th>
          <td class="align-top"><span class="rounded bg-rose-50 px-1 text-rose-700 line-through decoration-rose-300">{{ valueLabel(fields.get(change.name), change.from, references) }}</span></td>
          <td class="w-4 align-top text-gray-300">→</td>
          <td class="align-top"><span class="rounded bg-emerald-50 px-1 text-emerald-700">{{ valueLabel(fields.get(change.name), change.to, references) }}</span></td>
        </tr>
      </tbody>
    </table>

    <div v-for="group in collectionChanges" :key="group.name" class="rounded-lg border border-gray-100">
      <h4 class="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-600">
        {{ collectionLabel(group.name) }}
        <span v-if="group.added" class="text-emerald-600">+{{ group.added }}</span>
        <span v-if="group.removed" class="text-rose-600">−{{ group.removed }}</span>
        <span v-if="group.changed" class="text-amber-600">~{{ group.changed }}</span>
      </h4>
      <ul class="divide-y divide-gray-50">
        <li v-for="row in group.rows" :key="row.id" class="px-3 py-1.5">
          <template v-if="row.op === 'add' || row.op === 'remove'">
            <span class="mr-2 inline-block w-3 font-bold" :class="row.op === 'add' ? 'text-emerald-600' : 'text-rose-600'">{{ row.op === 'add' ? '+' : '−' }}</span>
            <span :class="row.op === 'remove' ? 'text-gray-500 line-through decoration-rose-300' : 'text-gray-800'">{{ rowSummary(group.name, row.value) }}</span>
          </template>
          <template v-else>
            <span class="mr-2 inline-block w-3 font-bold text-amber-600">~</span>
            <span class="text-xs text-gray-400">{{ rowLabel(group.name, row.id) }}</span>
            <span v-for="field in row.fields" :key="field.name" class="ml-3 inline-flex flex-wrap items-baseline gap-1 text-xs">
              <span class="text-gray-500">{{ fieldLabel(field.name) }}:</span>
              <span class="text-rose-700 line-through decoration-rose-300">{{ field.from }}</span>
              <span class="text-gray-300">→</span>
              <span class="text-emerald-700">{{ field.to }}</span>
            </span>
          </template>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CatalogReferences, CatalogType, ChangeOp } from '~/types/catalog'

const props = withDefaults(defineProps<{
  type: CatalogType
  changes: ChangeOp[]
  references?: CatalogReferences
  /** Documents the row ids belong to (current and previous), to describe changed rows. */
  documents?: Array<Record<string, unknown> | null | undefined>
}>(), {
  references: () => ({}),
  documents: () => [],
})

const { fields, collections, fieldLabel, collectionLabel, valueLabel } = useDocumentSchema(() => props.type)

const fieldChanges = computed(() => props.changes
  .filter(change => change.path.length === 1)
  .map(change => ({ name: String(change.path[0]), from: change.from, to: change.to })))

interface RowChange {
  id: string
  op: 'add' | 'remove' | 'set'
  value?: Record<string, unknown>
  fields: Array<{ name: string, from: string, to: string }>
}

const collectionChanges = computed(() => {
  const groups = new Map<string, { name: string, rows: Map<string, RowChange>, added: number, removed: number, changed: number }>()
  for (const change of props.changes.filter(item => item.path.length > 1)) {
    const name = String(change.path[0])
    const id = String(change.path[1])
    const group = groups.get(name) ?? { name, rows: new Map(), added: 0, removed: 0, changed: 0 }
    const collection = collections.value.get(name)
    if (change.path.length === 2 && (change.op === 'add' || change.op === 'remove')) {
      group.rows.set(id, { id, op: change.op, value: change.value as Record<string, unknown>, fields: [] })
      group[change.op === 'add' ? 'added' : 'removed']++
    } else {
      const row = group.rows.get(id) ?? { id, op: 'set', fields: [] }
      if (!group.rows.has(id)) group.changed++
      const fieldName = String(change.path[2])
      const field = collection?.fields.find(item => item.name === fieldName)
      if (change.path.length === 4) {
        // A reference set element, e.g. a disc ticked by an edition.
        const element = valueLabel({ name: fieldName, type: 'sibling' }, change.path[3], props.references)
        row.fields.push({ name: fieldName, from: change.op === 'remove' ? element : '', to: change.op === 'add' ? element : '' })
      } else {
        row.fields.push({ name: fieldName, from: valueLabel(field, change.from, props.references), to: valueLabel(field, change.to, props.references) })
      }
      group.rows.set(id, row)
    }
    groups.set(name, group)
  }
  return [...groups.values()].map(group => ({ ...group, rows: [...group.rows.values()] }))
})

/** A short description of a whole row: its meaningful values, references by name. */
const rowSummary = (collectionName: string, row: Record<string, unknown> | undefined) => {
  if (!row) return ''
  const collection = collections.value.get(collectionName)
  return (collection?.fields ?? [])
    .filter(field => !['sort_order'].includes(field.name) && row[field.name] !== null && row[field.name] !== undefined && row[field.name] !== '' && row[field.name] !== false)
    .map(field => `${fieldLabel(field.name)}: ${valueLabel(field, row[field.name], props.references)}`)
    .join(' · ')
}

/** Describes a changed row from the documents, e.g. a track by its title. */
const rowLabel = (collectionName: string, id: string) => {
  for (const document of props.documents) {
    const rows = document?.[collectionName]
    const row = Array.isArray(rows) ? rows.find((item: Record<string, unknown>) => String(item.id) === id) as Record<string, unknown> | undefined : undefined
    const name = row?.title ?? row?.name ?? row?.url
    if (name) return String(name)
  }
  return `#${id}`
}
</script>
