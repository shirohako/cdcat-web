/**
 * What the pages of numbered sections share: the legal documents (app/legal) and the guides (app/guides).
 */

/** A section as the tables of contents list it. */
export interface DocSectionLink {
  /** A stable English slug, the same in every language, so /privacy#cookies works whatever the reader's language. */
  id: string
  title: string
  /** A shorter title for the table of contents, where the full one would wrap too much. */
  short?: string
}

// The about page's hue turns, cycled, so neighbouring sections never share a colour (see .accent in ui.css).
const SHIFTS = [0, 80, 150, -90, 40, -60, 190]

/** The --shift of the section at `index`, for its badge, its table of contents entry and its summary. */
export function sectionShift(index: number): number {
  return SHIFTS[index % SHIFTS.length]!
}

/** "01", "02" …: section numbers, as the table of contents and the badges show them. */
export function sectionNumber(index: number): string {
  return String(index + 1).padStart(2, '0')
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
