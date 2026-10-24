import { describe, expect, it } from 'vitest'
import { languageFromQuery, queryLanguage, withoutLanguageQuery } from '../../app/utils/languageQuery'

describe('languageFromQuery', () => {
  it('reads Steam language names', () => {
    expect(languageFromQuery('schinese')).toBe('zh-Hans')
    expect(languageFromQuery('tchinese')).toBe('zh-Hant')
    expect(languageFromQuery('english')).toBe('en')
    expect(languageFromQuery('Japanese')).toBe('ja')
  })

  it('reads language tags in any case, with a script or region', () => {
    expect(languageFromQuery('zh-Hans')).toBe('zh-Hans')
    expect(languageFromQuery('zh-hans')).toBe('zh-Hans')
    expect(languageFromQuery('zh')).toBe('zh-Hans')
    expect(languageFromQuery('zh-CN')).toBe('zh-Hans')
    expect(languageFromQuery('zh_TW')).toBe('zh-Hant')
    expect(languageFromQuery('zh-HK')).toBe('zh-Hant')
    expect(languageFromQuery('zh-Hant-TW')).toBe('zh-Hant')
    expect(languageFromQuery('ja-JP')).toBe('ja')
    expect(languageFromQuery(' en-GB ')).toBe('en')
  })

  it('refuses languages the site does not offer', () => {
    expect(languageFromQuery('koreana')).toBeNull()
    expect(languageFromQuery('ko')).toBeNull()
    expect(languageFromQuery('')).toBeNull()
  })
})

describe('queryLanguage', () => {
  it('takes lang first, then l, skipping values it cannot read', () => {
    expect(queryLanguage({ l: 'english' })).toBe('en')
    expect(queryLanguage({ lang: 'ja', l: 'english' })).toBe('ja')
    expect(queryLanguage({ lang: 'klingon', l: 'tchinese' })).toBe('zh-Hant')
    expect(queryLanguage({ l: ['schinese', 'english'] })).toBe('zh-Hans')
    expect(queryLanguage({ page: '2' })).toBeNull()
  })

  it('drops only the language parameters', () => {
    expect(withoutLanguageQuery({ l: 'english', lang: 'ja', page: '2', sort: 'new' })).toEqual({ page: '2', sort: 'new' })
  })
})
