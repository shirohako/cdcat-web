import { describe, expect, it } from 'vitest'
import { endpointId, itemId } from '../../app/api-docs/keys'
import { API_DOCS_STRUCTURE } from '../../app/api-docs/structure'
import type { EndpointSpec, EnumSpec, FieldSpec, ModelSpec } from '../../app/api-docs/types'
import type { JsonExample } from '../../app/utils/jsonExample'

const sections = API_DOCS_STRUCTURE.sections
const items = sections.flatMap(section => section.items)
const endpoints = items.filter((item): item is EndpointSpec => item.kind === 'endpoint')
const models = new Map(items.filter((item): item is ModelSpec => item.kind === 'model').map(model => [model.name, model]))
const enums = new Set(items.filter((item): item is EnumSpec => item.kind === 'enum').map(item => item.name))

/** Model names a type string mentions: `AlbumSimple[] | null` → AlbumSimple. */
const typeModels = (type: string) => type.match(/[A-Z][A-Za-z]+/g) ?? []

function allFields(fields: FieldSpec[]): FieldSpec[] {
  return fields.flatMap(field => [field, ...allFields(field.fields ?? [])])
}

/** Every field of a model, its own and those of the model it extends. */
function modelFields(name: string): FieldSpec[] {
  const model = models.get(name)
  if (!model) return []
  return [...(model.extends ? modelFields(model.extends) : []), ...model.fields]
}

/**
 * The keys of an example that the reference doesn't describe, as dotted paths. Objects without documented fields
 * (maps such as `names` or `roles`) aren't looked into; a `<name>` field stands for any key.
 */
function undocumented(value: JsonExample, fields: FieldSpec[], path: string, out: string[]) {
  if (Array.isArray(value)) {
    for (const item of value) undocumented(item, fields, path, out)
    return
  }
  if (value === null || typeof value !== 'object') return
  for (const [key, child] of Object.entries(value)) {
    if (key === '$more') continue
    const field = fields.find(candidate => candidate.name === key) ?? fields.find(candidate => candidate.name === '<name>')
    if (!field) {
      out.push(path ? `${path}.${key}` : key)
      continue
    }
    const model = typeModels(field.type).find(name => models.has(name))
    const childFields = [...(model ? modelFields(model) : []), ...(field.fields ?? [])]
    if (childFields.length) undocumented(child, childFields, path ? `${path}.${key}` : key, out)
  }
}

describe('API reference structure', () => {
  it('gives every section and item a unique, valid anchor', () => {
    const ids = [...sections.map(section => section.id), ...items.map(itemId).filter((id): id is string => id !== null)]
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) expect(id).toMatch(/^[a-z][a-z0-9-]*$/)
  })

  it('keeps the anchors other sites may link to', () => {
    expect(endpoints.map(endpointId)).toMatchInlineSnapshot(`
      [
        "get-albums",
        "get-albums-id",
        "get-tracks-id",
        "get-tracks-id-lyrics",
        "get-lyrics-id",
        "get-artists",
        "get-artists-id",
        "get-artists-id-albums",
        "get-artists-id-tracks",
        "get-artists-id-card",
        "get-artists-lookup",
        "get-event-series",
        "get-event-series-id",
        "get-events",
        "get-events-id",
        "get-events-id-map",
        "get-events-id-booths",
        "get-entries",
        "get-entries-id",
        "get-franchises",
        "get-franchises-id",
        "get-franchises-id-albums",
        "get-search",
        "get-catalog-schema",
        "get-link-providers",
      ]
    `)
  })

  it('names only models and enums that exist', () => {
    const fields = [...endpoints.flatMap(endpoint => allFields(endpoint.response.fields ?? [])), ...[...models.values()].flatMap(model => allFields(model.fields))]
    for (const field of fields) {
      for (const name of typeModels(field.type)) expect(models.has(name), `${field.name}: ${field.type}`).toBe(true)
      if (field.enum) expect(enums.has(field.enum), field.enum).toBe(true)
    }
    for (const param of endpoints.flatMap(endpoint => [...(endpoint.pathParams ?? []), ...(endpoint.query ?? [])])) {
      if (param.enum) expect(enums.has(param.enum), param.enum).toBe(true)
    }
    for (const endpoint of endpoints) {
      if (endpoint.response.model) expect(models.has(endpoint.response.model), endpoint.path).toBe(true)
    }
    for (const model of models.values()) {
      if (model.extends) expect(models.has(model.extends), model.name).toBe(true)
    }
  })

  it('uses every model somewhere', () => {
    const used = new Set<string>()
    for (const endpoint of endpoints) {
      if (endpoint.response.model) used.add(endpoint.response.model)
      for (const field of allFields(endpoint.response.fields ?? [])) typeModels(field.type).forEach(name => used.add(name))
    }
    for (const model of models.values()) {
      if (model.extends) used.add(model.extends)
      for (const field of allFields(model.fields)) typeModels(field.type).forEach(name => used.add(name))
    }
    // The error object is described from the errors section's text.
    used.add('Error')
    expect([...models.keys()].filter(name => !used.has(name))).toEqual([])
  })

  it('documents the parameters in every path', () => {
    for (const endpoint of endpoints) {
      const inPath = [...endpoint.path.matchAll(/\{(\w+)\}/g)].map(match => match[1])
      expect((endpoint.pathParams ?? []).map(param => param.name), endpoint.path).toEqual(inPath)
    }
  })

  it('writes examples that call their own endpoint with documented parameters', () => {
    for (const endpoint of endpoints) {
      const [path, query = ''] = endpoint.example.request.split('?')
      const pattern = new RegExp(`^${endpoint.path.replace(/\{\w+\}/g, '[^/]+')}$`)
      expect(path, endpoint.path).toMatch(pattern)
      const names = (endpoint.query ?? []).map(param => param.name)
      for (const pair of query.split('&').filter(Boolean)) {
        const name = pair.split('=')[0]!.replace(/\[[^\]]+\]$/, '[key]')
        expect(names, `${endpoint.path}: ${name}`).toContain(name)
      }
    }
  })

  it('shows only documented fields in the examples', () => {
    for (const endpoint of endpoints) {
      const body = endpoint.example.body as { success: boolean, data: JsonExample }
      expect(body.success, endpoint.path).toBe(true)
      const fields = endpoint.response.model ? modelFields(endpoint.response.model) : endpoint.response.fields ?? []
      const out: string[] = []
      undocumented(body.data, fields, '', out)
      expect(out, endpoint.path).toEqual([])
    }
  })
})
