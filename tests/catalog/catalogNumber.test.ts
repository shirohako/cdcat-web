import { describe, expect, it } from 'vitest'
import { formatCatalogNumber } from '../../app/utils/catalogNumber'

// The same cases as the server's tests/Unit/Search/CatalogNumberTest.php.
describe('formatCatalogNumber', () => {
  it('writes consecutive numbers as one ~ range', () => {
    expect(formatCatalogNumber('DVSP-0324 / DVSP-0325 / DVSP-0326')).toBe('DVSP-0324~6')
    expect(formatCatalogNumber(['DVSP-0324', 'DVSP-0325', 'DVSP-0326'])).toBe('DVSP-0324~6')
    expect(formatCatalogNumber('DVSP-0324〜0326')).toBe('DVSP-0324~6')
    expect(formatCatalogNumber('DVSP-0324/5/6')).toBe('DVSP-0324~6')
    expect(formatCatalogNumber('KECH-8059~KECH-8062')).toBe('KECH-8059~62')
    expect(formatCatalogNumber('VICL-62000/1')).toBe('VICL-62000~1')
    expect(formatCatalogNumber('DVSP-0099 / DVSP-0100')).toBe('DVSP-0099~100')
    expect(formatCatalogNumber('LACA-9999~LACA-10001')).toBe('LACA-9999~10001')
    expect(formatCatalogNumber('ABC-1 ~ ABC-2')).toBe('ABC-1~2')
    expect(formatCatalogNumber('ＫＥＣＨ－８０５９～６０')).toBe('KECH-8059~60')
    expect(formatCatalogNumber('B-2 / A-1 / B-1')).toBe('B-1~2 / A-1')
  })

  it('keeps gaps, long ranges and values without numbers apart', () => {
    expect(formatCatalogNumber('ABC-1, ABC-3')).toBe('ABC-1 / ABC-3')
    expect(formatCatalogNumber('ABC-1/2/4')).toBe('ABC-1~2 / ABC-4')
    expect(formatCatalogNumber('XYZ-1~500')).toBe('XYZ-1~500')
    expect(formatCatalogNumber('C97-A / C97-B')).toBe('C97-A / C97-B')
    expect(formatCatalogNumber('FELT-019')).toBe('FELT-019')
    expect(formatCatalogNumber('N/A')).toBe('N/A')
    expect(formatCatalogNumber('  ')).toBeNull()
    expect(formatCatalogNumber(null)).toBeNull()
  })
})
