import type { ComputedRef, InjectionKey } from 'vue'
import { renderMarkdownInline } from '~/utils/markdown'
import { API_DOCS_STRUCTURE } from './structure'
import type { ApiDocsTexts, FieldSpec, ParamSpec } from './types'

/**
 * What every part of the API reference page reads: the words of the current language, the base address, and the
 * helpers that put the two together. ApiDocsDocument provides it.
 */
export interface ApiDocsContext {
  texts: ApiDocsTexts
  /** The address the paths are relative to, with /v1: this site's own API, so the dev site shows the dev API. */
  base: string
  /** Fills {{name}}: the structure's constants, {{base}} and {{site}}. */
  fill: (text: string) => string
  /** A filled one-line text as HTML (code, emphasis, links). */
  inline: (text: string | undefined) => string
  /** Model names, which a field's type links to. */
  models: ReadonlySet<string>
  /** A field's description: its own text under its dotted path in `table`, or the shared one. */
  fieldText: (field: FieldSpec, table: Record<string, string> | undefined, path: string) => string
  /** A parameter's description: its own text in `table`, or the shared one. */
  paramText: (param: ParamSpec, table: Record<string, string> | undefined) => string
}

export const API_DOCS_CONTEXT: InjectionKey<ComputedRef<ApiDocsContext>> = Symbol('api-docs')

export const MODEL_NAMES: ReadonlySet<string> = new Set(API_DOCS_STRUCTURE.sections.flatMap(section =>
  section.items.flatMap(item => item.kind === 'model' ? [item.name] : [])))

export function createApiDocsContext(texts: ApiDocsTexts, base: string, site: string): ApiDocsContext {
  const values: Record<string, string> = { ...Object.fromEntries(Object.entries(API_DOCS_STRUCTURE.constants).map(([key, value]) => [key, String(value)])), base, site }
  const fill = (text: string) => text.replace(/\{\{(\w+)\}\}/g, (match, name: string) => values[name] ?? match)
  return {
    texts,
    base,
    fill,
    inline: text => (text ? renderMarkdownInline(fill(text)) : ''),
    models: MODEL_NAMES,
    fieldText: (field, table, path) => (field.shared ? texts.common.fields[field.shared] : table?.[path]) ?? '',
    paramText: (param, table) => (param.shared ? texts.common.params[param.shared] : table?.[param.name]) ?? '',
  }
}

export function useApiDocs(): ComputedRef<ApiDocsContext> {
  const context = inject(API_DOCS_CONTEXT)
  if (!context) throw new Error('useApiDocs() outside ApiDocsDocument')
  return context
}
