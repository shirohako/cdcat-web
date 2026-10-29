import type { ApiDocsStructure, EndpointSpec, FieldSpec, ItemSpec, ParamSpec } from './types'

/**
 * Ids and text keys derived from the structure, shared by the page, the loader's dev checks and the tests: anchors
 * other sites may link to come from here, and so does the list of words every language has to supply.
 */

/** `#get-albums-id`: an endpoint's anchor, from its method and path. */
export const endpointId = (endpoint: Pick<EndpointSpec, 'method' | 'path'>) =>
  `${endpoint.method}${endpoint.path}`.toLowerCase().replace(/[{}]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

/** `#object-album-simple` for the model AlbumSimple. */
export const modelId = (name: string) => `object-${name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()}`

/** `#enum-album-type` for the enum album_type. */
export const enumId = (name: string) => `enum-${name.replace(/_/g, '-')}`

/** The anchor of an item that has one; prose belongs to its section. */
export function itemId(item: ItemSpec): string | null {
  if (item.kind === 'endpoint') return endpointId(item)
  if (item.kind === 'model') return modelId(item.name)
  if (item.kind === 'enum') return enumId(item.name)
  return null
}

/** Where a status's words live: by error name when it has one, else by number. */
export const statusKey = (status: { status: number, name?: string }) => status.name ?? String(status.status)

/** The page's interface words; every language has all of them. */
export const LABEL_KEYS = [
  'tag', 'beta', 'beta_note', 'base_url', 'copy', 'copied', 'copy_url', 'copy_json', 'copy_failed', 'in_section', 'path_params',
  'query_params', 'response', 'response_model', 'extends', 'statuses', 'example', 'default', 'required', 'optional',
  'see', 'more_items', 'more_model', 'model', 'enum', 'feedback_title', 'feedback_text', 'feedback_issue',
  'feedback_email',
] as const

/** The text key of each field, by dotted path; shared fields point at `common.fields`. */
function fieldKeys(fields: FieldSpec[], base: string, prefix: string, keys: Set<string>) {
  for (const field of fields) {
    const path = prefix ? `${prefix}.${field.name}` : field.name
    keys.add(field.shared ? `common.fields.${field.shared}` : `${base}.${path}`)
    if (field.fields) fieldKeys(field.fields, base, path, keys)
  }
}

function paramKeys(params: ParamSpec[] | undefined, base: string, keys: Set<string>) {
  for (const param of params ?? []) keys.add(param.shared ? `common.params.${param.shared}` : `${base}.${param.name}`)
}

/**
 * Every text key the structure needs (`required`), and the keys a language may add (`optional`); dotted paths into
 * ApiDocsTexts.
 */
export function textKeys(structure: ApiDocsStructure): { required: Set<string>, optional: Set<string> } {
  const required = new Set<string>(['title', 'intro', ...LABEL_KEYS.map(key => `labels.${key}`)])
  const optional = new Set<string>()
  for (const change of structure.changes) required.add(`changes.${change.id}`)
  for (const section of structure.sections) {
    required.add(`sections.${section.id}.title`)
    required.add(`sections.${section.id}.lead`)
    optional.add(`sections.${section.id}.short`)
    for (const item of section.items) {
      if (item.kind === 'prose') required.add(`prose.${item.id}`)
      else if (item.kind === 'endpoint') {
        const base = `endpoints.${endpointId(item)}`
        required.add(`${base}.title`)
        required.add(`${base}.summary`)
        optional.add(`${base}.notes`)
        paramKeys(item.pathParams, `${base}.params`, required)
        paramKeys(item.query, `${base}.params`, required)
        fieldKeys(item.response.fields ?? [], `${base}.fields`, '', required)
        for (const status of item.statuses ?? []) {
          required.add(`statuses.${statusKey(status)}`)
          optional.add(`${base}.statuses.${statusKey(status)}`)
        }
      } else if (item.kind === 'changes') {
        // The dated entries are required above.
      } else if (item.kind === 'model') {
        required.add(`models.${item.name}.title`)
        required.add(`models.${item.name}.description`)
        fieldKeys(item.fields, `models.${item.name}.fields`, '', required)
      } else {
        required.add(`enums.${item.name}.title`)
        required.add(`enums.${item.name}.description`)
        for (const value of item.values) required.add(`enums.${item.name}.values.${value}`)
      }
    }
  }
  return { required, optional }
}

/** Every dotted key that has a value in a texts object, for comparing languages. */
export function flattenTexts(value: unknown, prefix = '', out = new Map<string, string>()): Map<string, string> {
  if (typeof value === 'string') out.set(prefix, value)
  else if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) flattenTexts(child, prefix ? `${prefix}.${key}` : key, out)
  }
  return out
}
