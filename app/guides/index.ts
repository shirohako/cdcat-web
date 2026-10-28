import { markdownHeadings } from '~/utils/markdown'
import type { GuideContent, GuideDoc, GuideKind, GuideLocale } from './types'

type Loader = () => Promise<{ default: GuideContent }>

// Each language is its own chunk, so a page only fetches the text it shows.
const LOADERS: Record<GuideKind, Record<GuideLocale, Loader>> = {
  design: {
    'zh-Hans': () => import('./design/zh-Hans'),
  },
  editor: {
    'zh-Hans': () => import('./editor/zh-Hans'),
  },
}

/** The language a guide is first written in, which every reader gets until their own is written. */
const SOURCE_LOCALE: GuideLocale = 'zh-Hans'

/** When each guide's text last changed (YYYY-MM-DD); bump it with every edit that changes what the guide says. */
const GUIDE_UPDATED: Record<GuideKind, string> = {
  design: '2026-10-28',
  editor: '2026-10-28',
}

/** The guide in the reader's language, or in the language it was written in first. */
export async function loadGuide(kind: GuideKind, locale: string): Promise<GuideDoc> {
  const loaders = LOADERS[kind]
  const written = (locale in loaders ? locale : SOURCE_LOCALE) as GuideLocale
  const content = (await loaders[written]()).default
  if (import.meta.dev) warnOnBrokenAnchors(kind, content)
  return { ...content, locale: written, updated: GUIDE_UPDATED[kind] }
}

/**
 * A heading inside a body gets an id from its text; it must not take a section's id, or the anchors break. #links must
 * point at sections that exist.
 */
function warnOnBrokenAnchors(kind: GuideKind, content: GuideContent) {
  const sectionIds = new Set(content.sections.map(section => section.id))
  for (const section of content.sections) {
    const text = (typeof section.body === 'string' ? [section.body] : section.body).filter(part => typeof part === 'string').join('\n\n')
    for (const heading of markdownHeadings(text)) {
      if (sectionIds.has(heading.id)) console.warn(`[guide] ${kind}#${section.id}: heading "${heading.text}" takes the section id "${heading.id}"`)
    }
    for (const [, id] of text.matchAll(/\]\(#([\w-]+)\)/g)) {
      if (!sectionIds.has(id!)) console.warn(`[guide] ${kind}#${section.id}: link to a missing section #${id}`)
    }
  }
}

export type { GuideDoc, GuideKind, GuideSection } from './types'
