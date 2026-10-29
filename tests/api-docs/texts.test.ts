import { readdirSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { flattenTexts, itemId, textKeys } from '../../app/api-docs/keys'
import { API_DOCS_STRUCTURE } from '../../app/api-docs/structure'
import type { ApiDocsTexts } from '../../app/api-docs/types'
import { markdownHeadings } from '../../app/utils/markdown'

// Every language of the API reference against the structure, and the other languages against Simplified Chinese.
const modules = import.meta.glob<{ default: ApiDocsTexts }>('../../app/api-docs/locales/*.ts', { eager: true })
const locales = Object.fromEntries(Object.entries(modules).map(([path, module]) => [path.match(/([\w-]+)\.ts$/)![1]!, module.default]))
const source = locales['zh-Hans']!
const { required, optional } = textKeys(API_DOCS_STRUCTURE)
/** Filled in on the page: the base address and the site's address. */
const RUNTIME = new Set(['base', 'site'])
const placeholders = (text: string) => [...text.matchAll(/\{\{(\w+)\}\}/g)].map(match => match[1]!).sort()

const anchors = new Set([
  ...API_DOCS_STRUCTURE.sections.map(section => section.id),
  ...API_DOCS_STRUCTURE.sections.flatMap(section => section.items.map(itemId)).filter((id): id is string => id !== null),
])

describe.each(Object.keys(locales))('API reference texts: %s', (locale) => {
  const texts = flattenTexts(locales[locale])

  it('has every text the structure needs, and no others', () => {
    expect([...required].filter(key => !texts.get(key)?.trim())).toEqual([])
    expect([...texts.keys()].filter(key => !required.has(key) && !optional.has(key))).toEqual([])
  })

  it('has the same texts as the Simplified Chinese, in the same order', () => {
    expect([...texts.keys()]).toEqual([...flattenTexts(source).keys()])
  })

  it('quotes the same numbers and names as the Simplified Chinese', () => {
    const reference = flattenTexts(source)
    for (const [key, text] of texts) {
      expect(placeholders(text), key).toEqual(placeholders(reference.get(key) ?? ''))
      for (const name of placeholders(text)) expect(name in API_DOCS_STRUCTURE.constants || RUNTIME.has(name), `${key}: {{${name}}}`).toBe(true)
    }
  })

  it('links only to anchors on the page', () => {
    const headings = new Set([...texts.values()].flatMap(text => markdownHeadings(text).map(heading => heading.id)))
    for (const [key, text] of texts) {
      for (const [, id] of text.matchAll(/\]\(#([^)]+)\)/g)) {
        expect(anchors.has(id!) || headings.has(id!), `${key} → #${id}`).toBe(true)
      }
    }
  })
})

describe('API reference languages', () => {
  it('is written in every language the site has', () => {
    const site = readdirSync(new URL('../../i18n/locales', import.meta.url)).filter(name => name.endsWith('.json')).map(name => name.replace(/\.json$/, ''))
    expect(Object.keys(locales).sort()).toEqual(site.sort())
  })
})
