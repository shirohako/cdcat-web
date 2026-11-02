import { describe, expect, it } from 'vitest'
import { audioLength, audioRows, formatFrames, sameToc, toSeconds, tocRows } from '../../app/utils/discToc'
import { parseToc } from '../../app/utils/tocParser'

const plain = { first_track: 1, last_track: 6, leadout_offset: 95462, offsets: [150, 15363, 32314, 46592, 63414, 80489], data_track: null }
const enhanced = { ...plain, last_track: 7, leadout_offset: 111362, offsets: [...plain.offsets, 106862], data_track: 7 }

describe('tocRows', () => {
  it('lays a TOC out as EAC prints it', () => {
    expect(tocRows(plain)[0]).toEqual({ track: 1, data: false, start: 0, end: 15212, length: 15213 })
    expect(tocRows(plain).at(-1)).toEqual({ track: 6, data: false, start: 80339, end: 95311, length: 14973 })
  })

  it('ends the audio of an Enhanced CD before the gap to its data track', () => {
    const rows = tocRows(enhanced)
    expect(rows.at(-2)).toEqual({ track: 6, data: false, start: 80339, end: 95311, length: 14973 })
    expect(rows.at(-1)).toEqual({ track: 7, data: true, start: 106712, end: 111211, length: 4500 })
    expect(audioRows(enhanced)).toEqual(audioRows(plain))
    expect(audioLength(enhanced)).toBe(audioLength(plain))
  })

  it('reads back the table it lays out', () => {
    const table = tocRows(enhanced).map(row => `  ${row.track} | ${formatFrames(row.start)} | ${formatFrames(row.length)} | ${row.start} | ${row.end}`).join('\n')
    expect(parseToc(table)).toEqual({ ...enhanced, source: 'manual' })
  })
})

describe('frames', () => {
  it('writes m:ss.ff and rounds to whole seconds', () => {
    expect(formatFrames(20773)).toBe('4:36.73')
    expect(formatFrames(0)).toBe('0:00.00')
    expect(toSeconds(15213)).toBe(203)
    expect(toSeconds(14973)).toBe(200)
  })

  it('compares TOCs by their sectors, not the data track', () => {
    expect(sameToc(enhanced, { ...enhanced, data_track: null })).toBe(true)
    expect(sameToc(plain, enhanced)).toBe(false)
  })
})
