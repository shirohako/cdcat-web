import type { SearchResult } from '~/types/search'

/** Shortest query the API takes: 2 characters, or 1 with a kanji, kana or hangul (docs/api/search.md). */
export const searchable = (query: string) => {
  const text = query.replace(/\s+/g, '')
  return text.length >= 2 || /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u.test(text)
}

/** Where a search result opens. */
export const searchResultPath = (result: Pick<SearchResult, 'type' | 'id' | 'meta'>) => {
  switch (result.type) {
    case 'album': return `/albums/${result.id}`
    case 'track': return `/tracks/${result.id}`
    case 'artist': return `/artists/${result.id}`
    case 'entry': return `/entries/${result.id}`
    case 'franchise': return `/franchises/${result.id}`
  }
}
