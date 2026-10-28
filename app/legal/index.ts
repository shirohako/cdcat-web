import { markdownHeadings } from '~/utils/markdown'
import { LEGAL_DATES } from './constants'
import type { LegalContent, LegalDoc, LegalKind, LegalLocale } from './types'

type Loader = () => Promise<{ default: LegalContent }>

// Each language is its own chunk, so a page only fetches the text it shows.
const LOADERS: Record<LegalKind, Record<LegalLocale, Loader>> = {
  terms: {
    'en': () => import('./terms/en'),
    'ja': () => import('./terms/ja'),
    'zh-Hans': () => import('./terms/zh-Hans'),
    'zh-Hant': () => import('./terms/zh-Hant'),
  },
  privacy: {
    'en': () => import('./privacy/en'),
    'ja': () => import('./privacy/ja'),
    'zh-Hans': () => import('./privacy/zh-Hans'),
    'zh-Hant': () => import('./privacy/zh-Hant'),
  },
}

/** The document in the reader's language, or in English (the version that prevails) for any other. */
export async function loadLegal(kind: LegalKind, locale: string): Promise<LegalDoc> {
  const loaders = LOADERS[kind]
  const content = (await (loaders[locale as LegalLocale] ?? loaders.en)()).default
  if (import.meta.dev) warnOnClashingIds(kind, content)
  return { ...LEGAL_DATES[kind], ...content }
}

/** A heading inside a body gets an id from its text; it must not take a section's id, or the anchors break. */
function warnOnClashingIds(kind: LegalKind, content: LegalContent) {
  const sectionIds = new Set(content.sections.map(section => section.id))
  for (const section of content.sections) {
    for (const heading of markdownHeadings(section.body)) {
      if (sectionIds.has(heading.id)) console.warn(`[legal] ${kind}#${section.id}: heading "${heading.text}" takes the section id "${heading.id}"`)
    }
  }
}

export type { LegalDoc, LegalKind, LegalSection } from './types'
