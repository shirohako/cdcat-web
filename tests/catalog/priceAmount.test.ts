import { describe, expect, it } from 'vitest'
import { plainAmount } from '../../app/utils/priceAmount'

// The same cases as the server's tests/Feature/Catalog/ProductPricesTest.php.
describe('plainAmount', () => {
  it('drops thousands separators', () => {
    expect(plainAmount('6,000')).toBe('6000')
    expect(plainAmount(' 1，234,567.5 ')).toBe('1234567.5')
  })

  it('turns full-width characters into half-width ones', () => {
    expect(plainAmount('６，０００')).toBe('6000')
    expect(plainAmount('３３００')).toBe('3300')
    expect(plainAmount('　１９．９０')).toBe('19.90')
  })

  it('leaves everything else as typed', () => {
    expect(plainAmount('3300')).toBe('3300')
    expect(plainAmount('19.90')).toBe('19.90')
    expect(plainAmount('19,90')).toBe('19,90')
    expect(plainAmount('')).toBe('')
    expect(plainAmount(null)).toBe('')
  })
})
