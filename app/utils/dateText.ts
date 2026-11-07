import type { DatePrecision } from '~/types/entry'

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december']

/** 1–12 for an English month name or its short form (Nov, Nov., Sept), else 0. */
const monthNumber = (name: string) => {
  const lower = name.toLowerCase()
  return lower === 'sept' ? 9 : MONTHS.findIndex(month => month === lower || month.slice(0, 3) === lower) + 1
}

/**
 * The year, month and day of a typed date, as text, or null when it is none of these forms. A month or day left out is
 * empty. Dates of digits only keep their year first: 11/06/2026 can be read two ways, so it counts as a mistake.
 */
const parts = (text: string): [string, string, string] | null => {
  const digits = text.match(/^(\d{4})(?:[-/.年](\d{1,2})(?:[-/.月](\d{1,2})日?)?月?)?年?$/)
  if (digits) return [digits[1]!, digits[2] ?? '', digits[3] ?? '']
  // Nov 06, 2026 · November 6th 2026 · Nov 2026
  const monthFirst = text.match(/^([a-z]{3,9})\.?[\s,-]*(?:(\d{1,2})(?:st|nd|rd|th)?[\s,-]+)?(\d{4})$/i)
  if (monthFirst) return monthNumber(monthFirst[1]!) ? [monthFirst[3]!, String(monthNumber(monthFirst[1]!)), monthFirst[2] ?? ''] : null
  // 6 Nov 2026 · 06-Nov-2026
  const dayFirst = text.match(/^(\d{1,2})(?:st|nd|rd|th)?[\s-]+([a-z]{3,9})\.?[\s,-]+(\d{4})$/i)
  if (dayFirst) return monthNumber(dayFirst[2]!) ? [dayFirst[3]!, String(monthNumber(dayFirst[2]!)), dayFirst[1]!] : null
  return null
}

/** A typed date as the stored date and how much of it is known, or null when it isn't a date. */
export const parseDateText = (text: string): { date: string, precision: DatePrecision } | null => {
  const found = parts(text.trim())
  if (!found) return null
  const [year, month, day] = [Number(found[0]), Number(found[1] || 1), Number(found[2] || 1)]
  const value = new Date(Date.UTC(year, month - 1, day))
  if (value.getUTCFullYear() !== year || value.getUTCMonth() !== month - 1 || value.getUTCDate() !== day) return null
  return {
    date: `${found[0]}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    precision: found[2] ? 'day' : found[1] ? 'month' : 'year',
  }
}
