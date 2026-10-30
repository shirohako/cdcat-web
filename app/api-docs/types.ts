import type { DocSectionLink } from '~/documents/sections'
import type { JsonExample } from '~/utils/jsonExample'

/**
 * The API reference at /docs/api. The technical part (sections, endpoints, parameters, fields, examples) is written
 * once in structure.ts; each language only supplies the words, in locales/<locale>.ts, under the same ids.
 * Maintainer notes: the API repository's docs/api/README.md#对外的接口文档.
 */

/** The languages the reference is written in; index.ts loads one chunk per language. */
export type ApiDocsLocale = 'zh-Hans' | 'en' | 'zh-Hant' | 'ja' | 'ko'

export type HttpMethod = 'GET'

/**
 * A field of a response or of a model. `type` reads like `integer`, `string | null` or `AlbumSimple[]`: a model name
 * links to its definition. Its description is the locale text under the field's dotted path, or `common.fields.<shared>`.
 */
export interface FieldSpec {
  name: string
  type: string
  /** Some answers leave the key out (the description says which), rather than sending null. */
  optional?: boolean
  /** A few allowed values, shown with the field; longer lists are an enum. */
  values?: string[]
  /** The enum, in the dictionaries section, the values come from. */
  enum?: string
  /** The fields of a nested object without a model of its own, or the fields added to the model `type` names. */
  fields?: FieldSpec[]
  /** Uses the description `common.fields.<shared>`, the same wherever the field appears. */
  shared?: string
}

export interface ParamSpec {
  name: string
  type: string
  default?: string
  /** Allowed numbers or lengths, like `1–100`. */
  range?: string
  required?: boolean
  values?: string[]
  enum?: string
  /** Uses the description `common.params.<shared>`. */
  shared?: string
}

export interface ExampleSpec {
  /** Path and query after the base address, like `/albums?per_page=2`. */
  request: string
  status?: number
  body: JsonExample
}

export interface EndpointSpec {
  kind: 'endpoint'
  method: HttpMethod
  /** With `{name}` for path parameters. */
  path: string
  pathParams?: ParamSpec[]
  query?: ParamSpec[]
  /** What `data` is: a model, or fields of its own. */
  response: { model?: string, fields?: FieldSpec[] }
  /** Answers worth naming besides the general ones; their meaning is `statuses.<key>`, or the endpoint's own. */
  statuses?: { status: number, name?: string }[]
  example: ExampleSpec
}

export interface ModelSpec {
  kind: 'model'
  name: string
  /** A model this one has every field of, before its own. */
  extends?: string
  fields: FieldSpec[]
}

export interface EnumSpec {
  kind: 'enum'
  name: string
  values: string[]
}

/** A block of Markdown, the locale text `prose.<id>`. */
export interface ProseSpec {
  kind: 'prose'
  id: string
}

/** The dated list of `changes`. */
export interface ChangesSpec {
  kind: 'changes'
}

export type ItemSpec = ProseSpec | EndpointSpec | ModelSpec | EnumSpec | ChangesSpec

export interface SectionSpec {
  /** A stable English slug, the same in every language: /docs/api#albums. */
  id: string
  items: ItemSpec[]
}

export interface ApiDocsStructure {
  /** Numbers and names the texts quote as {{name}}, so every language says the same thing. */
  constants: Record<string, string | number>
  /** Changes that matter to clients, newest first; each has the text `changes.<id>`. */
  changes: { id: string, date: string }[]
  sections: SectionSpec[]
}

export interface SectionText {
  title: string
  /** A shorter title for the table of contents. */
  short?: string
  lead: string
}

export interface EndpointText {
  title: string
  summary: string
  /** Markdown after the fields: callouts, caveats. */
  notes?: string
  params?: Record<string, string>
  fields?: Record<string, string>
  /** What a status means for this endpoint, instead of the general `statuses.<key>`. */
  statuses?: Record<string, string>
}

export interface ModelText {
  title: string
  description: string
  fields: Record<string, string>
}

export interface EnumText {
  title: string
  description: string
  values: Record<string, string>
}

/** The interface words of the page, in the language of the text. */
export interface ApiDocsLabels {
  tag: string
  beta: string
  beta_note: string
  base_url: string
  copy: string
  copied: string
  copy_url: string
  copy_json: string
  copy_failed: string
  in_section: string
  path_params: string
  query_params: string
  response: string
  response_model: string
  extends: string
  statuses: string
  example: string
  default: string
  required: string
  optional: string
  see: string
  more_items: string
  more_model: string
  model: string
  enum: string
  feedback_title: string
  feedback_text: string
  feedback_issue: string
  feedback_email: string
}

export interface ApiDocsTexts {
  title: string
  intro: string
  labels: ApiDocsLabels
  common: { params: Record<string, string>, fields: Record<string, string> }
  sections: Record<string, SectionText>
  prose: Record<string, string>
  endpoints: Record<string, EndpointText>
  models: Record<string, ModelText>
  enums: Record<string, EnumText>
  statuses: Record<string, string>
  changes: Record<string, string>
}

/** A section as the page shows it: the structure with its words. */
export interface ApiDocsSection extends DocSectionLink {
  index: number
  lead: string
  items: ItemSpec[]
}

export interface ApiDocsDoc {
  locale: ApiDocsLocale
  updated: string
  texts: ApiDocsTexts
}
