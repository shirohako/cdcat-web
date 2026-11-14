import { describe, expect, it } from 'vitest'
import { languageAlternates, languageUrl } from '../../shared/utils/languageUrls'

describe('languageUrl', () => {
  it('leaves the bare address for Japanese, the language crawlers are shown there', () => {
    expect(languageUrl('/albums/209', 'ja')).toBe('/albums/209')
    expect(languageUrl('/albums?page=2', 'ja')).toBe('/albums?page=2')
  })

  it('names any other language with ?lang=, after a query that is already there', () => {
    expect(languageUrl('/albums/209', 'en')).toBe('/albums/209?lang=en')
    expect(languageUrl('/albums/209', 'zh-Hans')).toBe('/albums/209?lang=zh-Hans')
    expect(languageUrl('/albums?page=2', 'ko')).toBe('/albums?page=2&lang=ko')
    expect(languageUrl('/', 'zh-Hant')).toBe('/?lang=zh-Hant')
  })
})

describe('languageAlternates', () => {
  it('lists every language and gives x-default the English version', () => {
    expect(languageAlternates('/albums/209')).toEqual([
      { hreflang: 'ja', path: '/albums/209' },
      { hreflang: 'en', path: '/albums/209?lang=en' },
      { hreflang: 'zh-Hans', path: '/albums/209?lang=zh-Hans' },
      { hreflang: 'zh-Hant', path: '/albums/209?lang=zh-Hant' },
      { hreflang: 'ko', path: '/albums/209?lang=ko' },
      { hreflang: 'x-default', path: '/albums/209?lang=en' },
    ])
  })

  it('keeps to the languages a page is written in, falling back to the bare address without English', () => {
    expect(languageAlternates('/x', ['ja', 'zh-Hans'])).toEqual([
      { hreflang: 'ja', path: '/x' },
      { hreflang: 'zh-Hans', path: '/x?lang=zh-Hans' },
      { hreflang: 'x-default', path: '/x' },
    ])
    expect(languageAlternates('/x', ['zh-Hans']).map(entry => entry.hreflang)).toEqual(['zh-Hans'])
  })
})
