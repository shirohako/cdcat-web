import type { DocSectionLink } from '~/documents/sections'

/** The two legal documents, and the languages each is written in (the English text prevails). */
export type LegalKind = 'terms' | 'privacy'
export type LegalLocale = 'en' | 'ja' | 'zh-Hans' | 'zh-Hant' | 'ko'

/** One of the "at a glance" cards under the hero; `to` is the id of the section it sums up. */
export interface LegalHighlight {
  icon: string
  title: string
  text: string
  to: string
}

export interface LegalSection extends DocSectionLink {
  /** The plain-language version, shown above the full text. */
  summary: string
  /** Markdown, rendered by RichContent: tables and ::: callouts welcome, headings no bigger than ###. */
  body: string
}

/** What a language file provides; the dates are the same in every language and come from constants.ts. */
export interface LegalContent {
  intro: string
  highlights: LegalHighlight[]
  sections: LegalSection[]
}

export interface LegalDoc extends LegalContent {
  /** YYYY-MM-DD. */
  effective: string
  updated: string
}
