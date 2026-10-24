/**
 * Languages of catalog content (names, lyrics) as BCP 47 tags. They aren't limited to the interface
 * languages: pickers list COMMON_LANGUAGES first, then LANGUAGES, the ones a music catalog meets.
 */
export const COMMON_LANGUAGES = ['ja', 'zh-Hans', 'zh-Hant', 'en', 'ko']

/** Romanizations and kana readings: a name in one of these is a transliteration. */
export const READINGS = ['ja-Latn', 'ja-Hrkt']

/** Chinese is listed by script (zh-Hans, zh-Hant), so plain zh is left out. */
export const LANGUAGES = [
  'ar', 'cs', 'da', 'de', 'el', 'es', 'fi', 'fil', 'fr', 'hi', 'hu', 'id', 'it', 'la',
  'ms', 'nl', 'no', 'pl', 'pt', 'ro', 'ru', 'sv', 'th', 'tr', 'uk', 'vi', 'yue',
]

export const isReading = (code: string) => /-(Latn|Hrkt)$/.test(code)

/** `text` as a tag the API accepts, in canonical case (pt-br → pt-BR); null when it isn't one. */
export const languageTag = (text: string) => {
  try {
    const [tag] = Intl.getCanonicalLocales(text.trim())
    // The API's rule (Catalog\Document\Validator).
    return tag && tag.length <= 16 && /^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/.test(tag) ? tag : null
  } catch {
    return null
  }
}

const keywords = new Map<string, string>()
const nameIn = (language: string, code: string) => {
  try {
    return new Intl.DisplayNames([language], { type: 'language' }).of(code) ?? ''
  } catch {
    return ''
  }
}

/** The language's own name and its English name, so a search finds "Deutsch" or "german" in any UI language. */
export const languageKeywords = (code: string) => {
  let words = keywords.get(code)
  if (words === undefined) {
    words = `${nameIn(code, code)} ${nameIn('en', code)}`
    keywords.set(code, words)
  }
  return words
}
