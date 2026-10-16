import { ENTRY_TYPE_ICONS, type DatePrecision, type EntryType, type NamedItem } from '~/types/entry'

const UI_TO_TITLE_LOCALES: Record<string, string[]> = {
  'zh-Hans': ['zh-Hans', 'zh-CN', 'zh'],
  'zh-Hant': ['zh-Hant', 'zh-TW', 'zh-HK'],
  en: ['en'],
  ja: ['ja'],
}

/** Display helpers shared by entry and series pages and forms. */
export const useEntryDisplay = () => {
  const { t, te, locale } = useI18n()
  const { intlLocale } = useLocaleFormatting()

  /** Official title in the UI language, else the primary title. */
  const displayName = (item: NamedItem | null | undefined) => {
    if (!item) return ''
    const wanted = UI_TO_TITLE_LOCALES[locale.value] || [locale.value]
    const match = item.titles?.find(title => title.kind === 'official' && title.locale && wanted.includes(title.locale))
    return match?.title || item.name
  }

  /** The primary title when it differs from the displayed one, shown as a subtitle. */
  const originalName = (item: NamedItem | null | undefined) => {
    if (!item) return ''
    const shown = displayName(item)
    return shown !== item.name ? item.name : ''
  }

  const label = (key: string, fallback: string) => te(key) ? t(key) : fallback

  const typeLabel = (type: string | null | undefined) => type ? label(`catalog.entry_type.${type}`, type) : ''
  const formatLabel = (format: string | null | undefined) => format ? label(`catalog.format.${format}`, format) : ''
  const relationLabel = (relation: string) => label(`catalog.relation.${relation}`, relation)
  const workRelationLabel = (relation: string | null | undefined) => label(`catalog.work_relation.${relation || 'other'}`, relation || '')
  const typeIcon = (type: string | null | undefined) => ENTRY_TYPE_ICONS[type as EntryType] || 'lucide:shapes'

  /** "Anime · TV", or just the type when there is no format. */
  const typeWithFormat = (type: string | null | undefined, format: string | null | undefined) =>
    [typeLabel(type), formatLabel(format)].filter(Boolean).join(' · ')

  /** Formats a date at the stored precision, so year-only dates don't show as 1 January. */
  const formatReleaseDate = (date: string | null | undefined, precision: DatePrecision | null | undefined = 'day') => {
    if (!date) return ''
    const value = new Date(`${date.slice(0, 10)}T00:00:00Z`)
    if (Number.isNaN(value.getTime())) return date
    const options: Intl.DateTimeFormatOptions = precision === 'year'
      ? { year: 'numeric', timeZone: 'UTC' }
      : precision === 'month'
        ? { year: 'numeric', month: 'short', timeZone: 'UTC' }
        : { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' }
    return new Intl.DateTimeFormat(intlLocale.value, options).format(value)
  }

  return { displayName, originalName, typeLabel, formatLabel, typeWithFormat, relationLabel, workRelationLabel, typeIcon, formatReleaseDate }
}
