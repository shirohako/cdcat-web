/** The two legal documents, and the languages each is written in (the English text prevails). */
export type LegalKind = 'terms' | 'privacy'
export type LegalLocale = 'en' | 'ja' | 'zh-Hans' | 'zh-Hant'

/** One of the "at a glance" cards under the hero; `to` is the id of the section it sums up. */
export interface LegalHighlight {
  icon: string
  title: string
  text: string
  to: string
}

export interface LegalSection {
  /** A stable English slug, the same in every language, so /privacy#cookies works whatever the reader's language. */
  id: string
  title: string
  /** A shorter title for the table of contents, where the full one would wrap too much. */
  short?: string
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

/**
 * Markdown written as an indented template literal inside a content file: drops the shared indentation and the blank
 * edges. The renderer turns every single newline into a line break, so write one paragraph or list item per line and
 * leave a blank line between paragraphs.
 */
export function md(strings: TemplateStringsArray, ...values: Array<string | number>): string {
  const text = strings.reduce((out, part, index) => out + part + (index < values.length ? String(values[index]) : ''), '')
  const lines = text.split('\n')
  const indent = Math.min(...lines.filter(line => line.trim()).map(line => line.length - line.trimStart().length))
  return lines.map(line => line.slice(indent)).join('\n').trim()
}
