import { describe, expect, it } from 'vitest'
import { parseDateText } from '../../app/utils/dateText'

const day = (date: string) => ({ date, precision: 'day' })
const month = (date: string) => ({ date, precision: 'month' })

describe('parseDateText', () => {
  it.each([
    ['Nov 06, 2026', day('2026-11-06')],
    ['nov 6 2026', day('2026-11-06')],
    ['Nov. 6, 2026', day('2026-11-06')],
    ['November 6th, 2026', day('2026-11-06')],
    ['Sept 30, 2026', day('2026-09-30')],
    ['6 Nov 2026', day('2026-11-06')],
    ['06-Nov-2026', day('2026-11-06')],
    ['1st May, 2026', day('2026-05-01')],
    ['Nov 2026', month('2026-11-01')],
    ['November, 2026', month('2026-11-01')],
  ])('reads %s', (text, expected) => {
    expect(parseDateText(text)).toEqual(expected)
  })

  it.each([
    ['2026', { date: '2026-01-01', precision: 'year' }],
    ['2026年', { date: '2026-01-01', precision: 'year' }],
    ['2026-05', month('2026-05-01')],
    ['2026年5月', month('2026-05-01')],
    ['2026-05-12', day('2026-05-12')],
    ['2026/5/2', day('2026-05-02')],
    ['2026.05.12', day('2026-05-12')],
    ['2026年5月12日', day('2026-05-12')],
    ['  2026-05-12  ', day('2026-05-12')],
  ])('still reads %s', (text, expected) => {
    expect(parseDateText(text)).toEqual(expected)
  })

  it.each(['Nov', 'Nov 6', 'Nov 31, 2026', 'Feb 29, 2026', 'Foo 06, 2026', 'Novem 6, 2026', '2026-13', '2026-02-30', '11/06/2026', '06/11/2026', '26-11-06', 'abc'])('turns down %s', (text) => {
    expect(parseDateText(text)).toBeNull()
  })
})
