import { describe, expect, it } from 'vitest'
import { parseToc } from '../../app/utils/tocParser'

const EAC = `Exact Audio Copy V1.6 from 23. October 2020

TOC of the extracted CD

     Track |   Start  |  Length  | Start sector | End sector
    ---------------------------------------------------------
        1  |  0:00.00 |  5:32.14 |         0    |    24913
        2  |  5:32.14 |  4:07.22 |     24914    |    43460
        3  |  9:39.36 |  3:01.00 |     43461    |    57035
`

describe('parseToc', () => {
  it('reads an EAC TOC with the lead-in added', () => {
    expect(parseToc(EAC)).toEqual({
      first_track: 1,
      last_track: 3,
      leadout_offset: 57186,
      offsets: [150, 25064, 43611],
      source: 'eac',
    })
  })

  it('reads XLD timestamps and marks the source', () => {
    const toc = parseToc('X Lossless Decoder version 20230627\n        1  | 00:00:00 | 03:00:00 |         0    |    13499   \n')
    expect(toc).toMatchObject({ first_track: 1, last_track: 1, leadout_offset: 13650, offsets: [150], source: 'xld' })
  })

  it('rejects text without a TOC or with missing tracks', () => {
    expect(parseToc('no toc here')).toBeNull()
    expect(parseToc('  1 | 0:00.00 | 1:00.00 | 0 | 4499\n  3 | 2:00.00 | 1:00.00 | 9000 | 13499')).toBeNull()
  })
})
