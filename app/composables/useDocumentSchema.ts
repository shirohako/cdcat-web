import type { CatalogReferences, CatalogType } from '~/types/catalog'

/** A field of an aggregate or collection row, as GET /catalog/schema exports it. */
export interface SchemaField {
  name: string
  type: string
  target?: string
  values?: string[]
  /** The enum's key in the schema's `enums`, e.g. disc_format */
  enum?: string
  precision?: string
  required?: boolean
}

export interface SchemaCollection {
  name: string
  kind: string
  fields: SchemaField[]
  refsets?: Record<string, { target: string }>
  other_field?: string
  other_type?: string
}

interface AggregateSchemaExport {
  type: string
  fields: SchemaField[]
  collections: SchemaCollection[]
}

/**
 * Field metadata of one aggregate type plus helpers to show document values: references by name
 * (from a `references` map), dictionary keys by their label, row ids as "#id".
 */
export const useDocumentSchema = (type: MaybeRefOrGetter<CatalogType>) => {
  const { schema, roleName, attributeName } = useCatalogSchema()
  const { enumLabel } = useCatalogDisplay()
  const { t, te } = useI18n()

  const aggregate = computed(() => (schema.value?.aggregates?.[toValue(type)] ?? null) as AggregateSchemaExport | null)
  const fields = computed(() => new Map((aggregate.value?.fields ?? []).map(field => [field.name, field])))
  const collections = computed(() => new Map((aggregate.value?.collections ?? []).map(collection => [collection.name, collection])))

  const fieldLabel = (name: string) => te(`catalog.field.${name}`) ? t(`catalog.field.${name}`) : name.replaceAll('_', ' ')
  const collectionLabel = (name: string) => te(`catalog.collection.${name}`) ? t(`catalog.collection.${name}`) : name.replaceAll('_', ' ')

  /** A readable label for a value of `field`, using the references that came with the document. */
  const valueLabel = (field: SchemaField | undefined, value: unknown, references: CatalogReferences = {}): string => {
    if (value === null || value === undefined || value === '') return '—'
    if (Array.isArray(value)) return value.map(item => valueLabel(field, item, references)).join(', ') || '—'
    if (field?.type === 'aggregate' && field.target) return referenceLabel(field.target, value, references)
    if (field?.type === 'table' && field.target === 'link_providers') {
      return schema.value?.link_providers.find(provider => provider.id === value)?.name ?? `#${value}`
    }
    if (field?.type === 'table' && field.target) return referenceLabel(field.target, value, references)
    if (field?.type === 'dictionary' && field.target === 'credit_roles') return roleName(String(value))
    if (field?.type === 'dictionary' && field.target === 'attribute_definitions') return attributeName(String(value))
    if (field?.type === 'sibling') return typeof value === 'number' ? `#${value}` : String(value)
    if (field?.type === 'boolean') return t(value ? 'catalog.yes' : 'catalog.no')
    if ((field?.type === 'enum' || field?.type === 'enum_list') && field.enum) return enumLabel(field.enum, String(value))
    if (typeof value === 'object') {
      const reference = value as { type?: string, id?: unknown }
      if (reference.type && reference.id !== undefined) return referenceLabel(reference.type, reference.id, references)
      const dated = value as { date?: string }
      if (dated.date) return dated.date
      return JSON.stringify(value)
    }
    return String(value)
  }

  const referenceLabel = (target: string, id: unknown, references: CatalogReferences) => {
    if (typeof id === 'string') return id.startsWith('@') ? t('catalog.new_item', { ref: id.slice(1) }) : id
    const row = references[target]?.[String(id)] as Record<string, unknown> | undefined
    const name = row?.title ?? row?.name
    return name ? String(name) : `#${String(id)}`
  }

  return { aggregate, fields, collections, fieldLabel, collectionLabel, valueLabel }
}
