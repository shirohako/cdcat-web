import { describe, expect, it } from 'vitest'
import { parseDuration, parseTracklist } from '../../app/utils/tracklistParser'

describe('parseTracklist', () => {
  it('reads numbered lines with durations', () => {
    expect(parseTracklist('1. Opening 3:45\n02 Ending (4:05)\n3) Bonus [1:02:03]')).toEqual([{
      position: 1,
      title: null,
      tracks: [
        { track_number: 1, number_label: null, title: 'Opening', duration: 225 },
        { track_number: 2, number_label: null, title: 'Ending', duration: 245 },
        { track_number: 3, number_label: null, title: 'Bonus', duration: 3723 },
      ],
    }])
  })

  it('starts a new disc on disc headings and disc-track numbers', () => {
    const discs = parseTracklist('Disc 1\n1. A\n2. B\nDISC 2: Remixes\n1. C\n\n3-01 D')
    expect(discs.map(disc => [disc.position, disc.title, disc.tracks.map(track => track.title)])).toEqual([
      [1, null, ['A', 'B']],
      [2, 'Remixes', ['C']],
      [3, null, ['D']],
    ])
  })

  it('keeps vinyl side numbers as printed numbers', () => {
    const [disc] = parseTracklist('A1 Intro 1:00\nA2 Song\nB1 Outro')
    expect(disc!.tracks.map(track => [track.track_number, track.number_label, track.title])).toEqual([
      [1, 'A1', 'Intro'], [2, 'A2', 'Song'], [3, 'B1', 'Outro'],
    ])
  })

  it('numbers lines without a number and keeps numbers inside titles', () => {
    const [disc] = parseTracklist('Song\t3:00\n1999\nもう一つの曲')
    expect(disc!.tracks.map(track => [track.track_number, track.title, track.duration])).toEqual([
      [1, 'Song', 180], [2, '1999', null], [3, 'もう一つの曲', null],
    ])
  })

  it('parses durations', () => {
    expect(parseDuration('0:59')).toBe(59)
    expect(parseDuration('x:10')).toBeNull()
  })
})
