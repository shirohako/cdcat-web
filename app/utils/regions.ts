const englishNames = new Intl.DisplayNames(['en'], { type: 'region' })

/**
 * Where the full English name is longer than people write it ("Hong Kong SAR China", "Macao SAR China"); EU stands for
 * releases made for all of Europe, as VGMdb writes them.
 */
const SHORT_NAMES: Record<string, string> = { HK: 'Hong Kong', MO: 'Macau', EU: 'Europe' }

/** A release region (ISO 3166-1 alpha-2, "JP") by its English name, whatever the UI language: "Japan". */
export const regionEnglishName = (code: string) => {
  const upper = code.toUpperCase()
  try {
    return SHORT_NAMES[upper] ?? englishNames.of(upper) ?? upper
  } catch {
    return upper
  }
}
