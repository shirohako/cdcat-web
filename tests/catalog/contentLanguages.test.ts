import { describe, expect, it } from 'vitest'
import { isReading, languageKeywords, languageTag } from '../../app/utils/contentLanguages'

describe('languageTag', () => {
  it('canonicalizes tags the API accepts', () => {
    expect(languageTag(' pt-br ')).toBe('pt-BR')
    expect(languageTag('ZH-hans')).toBe('zh-Hans')
    expect(languageTag('ja-latn')).toBe('ja-Latn')
    expect(languageTag('yue')).toBe('yue')
  })

  it('rejects what the API would', () => {
    expect(languageTag('french')).toBeNull()
    expect(languageTag('en-u-ca-gregory')).toBeNull()
    expect(languageTag('ja-')).toBeNull()
    expect(languageTag('')).toBeNull()
  })
})

describe('languages', () => {
  it('treats romanizations and kana readings as readings', () => {
    expect(isReading('ja-Latn')).toBe(true)
    expect(isReading('ja-Hrkt')).toBe(true)
    expect(isReading('zh-Hant')).toBe(false)
  })

  it('finds a language by its own and its English name', () => {
    expect(languageKeywords('de')).toContain('Deutsch')
    expect(languageKeywords('de')).toContain('German')
  })
})
