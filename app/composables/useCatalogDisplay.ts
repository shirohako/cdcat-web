import type { CatalogAttribute, CatalogTitle } from '~/types/catalog'
import type { DatePrecision } from '~/types/entry'

/** Enums whose labels live outside catalog.<enum>, e.g. album_type under albums.type. */
const ENUM_GROUPS: Record<string, string> = {
  album_type: 'albums.type',
  entry_album_relation: 'catalog.album_relation',
  entry_relation: 'catalog.relation',
  date_precision: 'catalog.precision',
}

const TITLE_LOCALES: Record<string, string[]> = {
  'zh-Hans': ['zh-Hans', 'zh-CN', 'zh'],
  'zh-Hant': ['zh-Hant', 'zh-TW', 'zh-HK'],
  en: ['en'],
  ja: ['ja'],
}

/**
 * Display helpers for catalog pages: names in the UI language, dates at their precision,
 * durations, enum labels and attribute values. Entry and series pages use useEntryDisplay.
 */
export const useCatalogDisplay = () => {
  const { t, te, locale } = useI18n()
  const { intlLocale, languageName, localizedContent } = useLocaleFormatting()
  const { attributeDefinition } = useCatalogSchema()

  /** An official name in the UI language, then a translation in it, then the original. */
  const localName = (original: string, titles?: CatalogTitle[] | null) => {
    const wanted = TITLE_LOCALES[locale.value] || [locale.value]
    for (const kind of ['official', 'translation']) {
      const match = titles?.find(title => title.kind === kind && title.locale && wanted.includes(title.locale))
      if (match) return match.title
    }
    return original
  }

  /** The original name when the shown one differs, for a subtitle. */
  const originalName = (original: string, titles?: CatalogTitle[] | null) => localName(original, titles) !== original ? original : ''

  /** A name in one tracklist language (locale + kind); null when there is none. */
  const titleIn = (titles: CatalogTitle[] | null | undefined, wanted: { locale: string, kind: string } | null) =>
    wanted ? titles?.find(title => title.locale === wanted.locale && title.kind === wanted.kind)?.title ?? null : null

  /** "日本語 (Latin)" style names for BCP 47 tags, e.g. ja-Latn. */
  const localeName = (code: string) => {
    const [language, script] = code.split('-')
    if (script === 'Latn' && language) return t('catalog.romanized', { language: languageName(language) })
    if (script === 'Hrkt' && language) return t('catalog.kana_reading', { language: languageName(language) })
    return languageName(code)
  }

  const formatDate = (date: string | null | undefined, precision: DatePrecision | null | undefined = 'day') => {
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

  /** 3:05, or 1:02:03 past an hour; '' when unknown. */
  const formatDuration = (seconds: number | null | undefined) => {
    if (seconds === null || seconds === undefined || seconds < 0) return ''
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const rest = String(Math.floor(seconds % 60)).padStart(2, '0')
    return hours ? `${hours}:${String(minutes).padStart(2, '0')}:${rest}` : `${minutes}:${rest}`
  }

  /** The label of an enum value: catalog.<group>.<value> (see ENUM_GROUPS), or the value with spaces when there is no message. */
  const enumLabel = (group: string, value: string | null | undefined) => {
    if (!value) return ''
    const key = `${ENUM_GROUPS[group] ?? `catalog.${group}`}.${value}`
    return te(key) ? t(key) : value.replaceAll('_', ' ')
  }

  /** The English label, for showing next to the UI-language one; empty until the English messages are loaded. */
  const enumLabelEn = (group: string, value: string | null | undefined) => {
    if (!value) return ''
    const key = `${ENUM_GROUPS[group] ?? `catalog.${group}`}.${value}`
    return te(key, 'en') ? t(key, {}, { locale: 'en' }) : ''
  }

  /** An attribute value as text: choices by their name, dates at their precision, references by the item's name. */
  const attributeText = (attribute: CatalogAttribute) => {
    const definition = attributeDefinition(attribute.key)
    const value = attribute.value as unknown
    if (attribute.label) return attribute.label
    if (definition?.value_type === 'choice') {
      return localizedContent(definition.choices?.find(choice => choice.value === value)?.names, String(value))
    }
    if (definition?.value_type === 'boolean') return t(value ? 'catalog.yes' : 'catalog.no')
    if (value && typeof value === 'object' && 'date' in value) {
      const dated = value as { date: string, precision: DatePrecision }
      return formatDate(dated.date, dated.precision)
    }
    return String(value ?? '')
  }

  /** Where a referenced attribute value links to, e.g. /entries/12. */
  const attributeLink = (attribute: CatalogAttribute) => {
    const value = attribute.value as { type?: string, id?: number } | null
    if (!value || typeof value !== 'object' || !value.type || !value.id) return null
    const resource = { album: 'albums', artist: 'artists', label: 'labels', entry: 'entries', franchise: 'franchises' }[value.type]
    return resource ? `/${resource}/${value.id}` : null
  }

  return { localName, originalName, titleIn, localeName, formatDate, formatDuration, enumLabel, enumLabelEn, attributeText, attributeLink }
}
