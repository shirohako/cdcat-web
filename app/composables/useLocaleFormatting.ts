type LocalizedValue = Record<string, string | null | undefined>

const INTL_LOCALES: Record<string, string> = {
  'zh-Hans': 'zh-CN',
  'zh-Hant': 'zh-TW',
  en: 'en-US',
  ja: 'ja-JP',
}

const CONTENT_LOCALE_KEYS: Record<string, string[]> = {
  'zh-Hans': ['zh-Hans', 'zh-CN'],
  'zh-Hant': ['zh-Hant', 'zh-TW'],
  en: ['en'],
  ja: ['ja'],
}

export const useLocaleFormatting = (localeOverride?: string) => {
  const { locale } = useI18n()

  const intlLocale = computed(() => localeOverride || INTL_LOCALES[locale.value] || 'en-US')

  const formatDate = (
    value: string | number | Date | null | undefined,
    options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' },
  ) => {
    if (value === null || value === undefined || value === '') return ''
    const date = value instanceof Date ? value : new Date(value)
    if (Number.isNaN(date.getTime())) return String(value)
    return new Intl.DateTimeFormat(intlLocale.value, options).format(date)
  }

  const displayName = (code: string, type: 'language' | 'region' | 'currency') => {
    try {
      return new Intl.DisplayNames([intlLocale.value], { type }).of(code) || code
    } catch {
      return code
    }
  }

  const localizedContent = (value: string | LocalizedValue | null | undefined, fallback = '') => {
    if (!value) return fallback
    if (typeof value === 'string') return value

    const preferredKeys = CONTENT_LOCALE_KEYS[locale.value] || [locale.value]
    const fallbackKeys = ['en', 'zh-Hans', 'zh-CN']
    for (const key of [...preferredKeys, ...fallbackKeys]) {
      if (value[key]) return value[key] as string
    }
    return Object.values(value).find((item): item is string => Boolean(item)) || fallback
  }

  return {
    intlLocale,
    formatDate,
    languageName: (code: string) => displayName(code, 'language'),
    regionName: (code: string) => displayName(code, 'region'),
    currencyName: (code: string) => displayName(code, 'currency'),
    localizedContent,
  }
}
