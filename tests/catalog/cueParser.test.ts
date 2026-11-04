import { describe, expect, it } from 'vitest'
import { decodeCue, detectCueEncoding, parseCue } from '../../app/utils/cueParser'

const CUE = `TITLE "AD:PIANO X"
PERFORMER "Diverse System"
REM DATE "2026-04-26"
REM DISCNUMBER 2
REM TOTALDISCS 3
FILE "DVSP-0324.flac" WAVE
  TRACK 01 AUDIO
    TITLE "嘘喰らいの怪物"
    PERFORMER "濱田有共"
    ISRC JP-ABC-26-00001
    INDEX 01 00:00:00
  TRACK 02 AUDIO
    TITLE "hymn"
    PERFORMER "Juggernaut."
    ISRC 000000000000
    INDEX 00 03:56:00
    INDEX 01 03:58:06
  TRACK 03 AUDIO
    TITLE "from memory"
    INDEX 01 08:36:50`

describe('parseCue', () => {
  it('reads titles, performers, ISRCs and the disc number; a track ends where the next one starts', () => {
    const cue = parseCue(CUE)
    expect(cue.title).toBe('AD:PIANO X')
    expect(cue.disc_number).toBe(2)
    expect(cue.tracks[0]).toEqual({ track_number: 1, title: '嘘喰らいの怪物', performer: '濱田有共', isrc: 'JPABC2600001', duration: 238 })
    expect(cue.tracks[1]).toMatchObject({ track_number: 2, title: 'hymn', isrc: null })
  })

  it('cuts off a part of a second, however large', () => {
    // 3:58:06 to 8:36:50 is 278.59 seconds.
    expect(parseCue(CUE).tracks[1]!.duration).toBe(278)
  })

  it('has no length for the last track', () => {
    expect(parseCue(CUE).tracks[2]).toMatchObject({ title: 'from memory', performer: null, duration: null })
  })

  it('has no lengths with one file per track', () => {
    const cue = parseCue('FILE "1.flac" WAVE\nTRACK 01 AUDIO\nTITLE "A"\nINDEX 01 00:00:00\nFILE "2.flac" WAVE\nTRACK 02 AUDIO\nTITLE "B"\nINDEX 01 00:00:00')
    expect(cue.tracks.map(track => track.duration)).toEqual([null, null])
  })

  it('leaves out data tracks and the length up to them', () => {
    const cue = parseCue('FILE "a.bin" BINARY\nTRACK 01 AUDIO\nINDEX 01 00:00:00\nTRACK 02 MODE1/2352\nINDEX 01 05:00:00')
    expect(cue.tracks).toHaveLength(1)
    expect(cue.tracks[0]!.duration).toBeNull()
  })

  it('reads CRLF, unquoted values and titles with quotes inside', () => {
    expect(parseCue('FILE a.wav WAVE\r\n  TRACK 1 AUDIO\r\n    TITLE Plain title\r\n    INDEX 01 00:00:00\r\n').tracks[0]!.title).toBe('Plain title')
    expect(parseCue('TRACK 01 AUDIO\nTITLE "The "Final" Song"').tracks[0]!.title).toBe('The "Final" Song')
  })

  it('finds no tracks in other text', () => {
    expect(parseCue('01. Opening 3:45').tracks).toEqual([])
  })
})

describe('CUE encodings', () => {
  it('tells UTF-8, UTF-16 and older encodings apart', () => {
    const shiftJis = new Uint8Array([0x89, 0xCC]) // 歌
    expect(detectCueEncoding(new TextEncoder().encode('歌'))).toBe('utf-8')
    expect(detectCueEncoding(new Uint8Array([0xFF, 0xFE, 0x4C, 0x6B]))).toBe('utf-16le')
    expect(detectCueEncoding(shiftJis)).toBe('shift_jis')
    expect(decodeCue(shiftJis, 'shift_jis')).toBe('歌')
  })
})
