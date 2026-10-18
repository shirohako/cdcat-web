import type { SchemaCollection, SchemaField } from '~/composables/useDocumentSchema'

const TEXT_TYPES = new Set(['string', 'text', 'url'])
const isRequiredText = (field: SchemaField) => !!field.required && TEXT_TYPES.has(field.type)

/**
 * The server stores an empty text field as null, so a draft saved before its title, track titles
 * and so on were filled comes back with nulls where the editors bind strings. This puts '' back
 * into every required text field, at the top level and in collection rows. Mutates and returns it.
 */
export const fillRequiredText = (
  document: Record<string, unknown>,
  aggregate: { fields: SchemaField[], collections: SchemaCollection[] },
) => {
  for (const field of aggregate.fields) {
    if (isRequiredText(field) && document[field.name] == null) document[field.name] = ''
  }
  for (const collection of aggregate.collections) {
    const rows = document[collection.name]
    const fields = collection.fields.filter(isRequiredText)
    if (!Array.isArray(rows) || !fields.length) continue
    for (const row of rows as Record<string, unknown>[]) {
      for (const field of fields) {
        if (row[field.name] == null) row[field.name] = ''
      }
    }
  }
  return document
}
