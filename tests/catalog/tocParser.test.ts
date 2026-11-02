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

// The MusicBrainz documentation's example disc with a data track 11400 sectors after the audio, as on an Enhanced CD.
const ENHANCED = `Exact Audio Copy V1.6 from 23. October 2020

TOC of the extracted CD

     Track |   Start  |  Length  | Start sector | End sector
    ---------------------------------------------------------
        1  |  0:00.00 |  3:22.63 |         0    |     15212
        2  |  3:22.63 |  3:46.01 |     15213    |     32163
        3  |  7:08.64 |  3:10.28 |     32164    |     46441
        4  | 10:19.17 |  3:44.22 |     46442    |     63263
        5  | 14:03.39 |  3:47.50 |     63264    |     80338
        6  | 17:51.14 |  3:19.48 |     80339    |     95311
        7  | 23:42.62 |  1:00.00 |    106712    |    111211
`

describe('parseToc', () => {
  it('reads an EAC TOC with the lead-in added', () => {
    expect(parseToc(EAC)).toEqual({
      first_track: 1,
      last_track: 3,
      leadout_offset: 57186,
      offsets: [150, 25064, 43611],
      data_track: null,
      source: 'eac',
    })
  })

  it('finds the data track of an Enhanced CD by the gap before it', () => {
    expect(parseToc(ENHANCED)).toEqual({
      first_track: 1,
      last_track: 7,
      leadout_offset: 111362,
      offsets: [150, 15363, 32314, 46592, 63414, 80489, 106862],
      data_track: 7,
      source: 'eac',
    })
    // One sector more than the gap of a second session is just a long pause.
    expect(parseToc(ENHANCED.replace('106712    |', '106713    |'))).toMatchObject({ data_track: null })
  })

  it('reads XLD timestamps and marks the source', () => {
    const toc = parseToc('X Lossless Decoder version 20230627\n        1  | 00:00:00 | 03:00:00 |         0    |    13499   \n')
    expect(toc).toMatchObject({ first_track: 1, last_track: 1, leadout_offset: 13650, offsets: [150], data_track: null, source: 'xld' })
  })

  it('marks CUERipper logs', () => {
    expect(parseToc(`CUERipper v2.2.5 Copyright (C) 2008-2023 Grigory Chudov\n\n${EAC.split('\n').slice(2).join('\n')}`)).toMatchObject({ source: 'cueripper' })
  })

  it('says why a text gives no TOC', () => {
    expect(parseToc('no toc here')).toBe('none')
    expect(parseToc(`${EAC}\n${EAC}`)).toBe('several')
    expect(parseToc('  1 | 0:00.00 | 1:00.00 | 0 | 4499\n  3 | 2:00.00 | 1:00.00 | 9000 | 13499')).toBe('gaps')
  })
})
