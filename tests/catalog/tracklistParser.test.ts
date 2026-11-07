import { describe, expect, it } from 'vitest'
import { parseDuration, parseTracklist, readTracklist, TRACKLIST_FORMATS } from '../../app/utils/tracklistParser'

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

// Pasted by users, one format each.
const TITLE_ARTIST = `1. Bipolar Singularity - Rmjesty (02:00)

2. Moonset~Another side - Tiuro逍遥 & AivF (04:57)

3. Moon Street - xuAlex5 (03:18)

4. Ad Astra - ak1NaN (03:26)

5. 地月係間軌道躍遷 - Iridia (04:11)

6. DESIRE OVERDRIVE - IVLiVS (08:05)

7. 秘星浮塵～Unfassbares Universum - Tiuro逍遥 (07:02)

8. 星窓終電 ～The scene of what she saw - tRee (05:19)

9. Towards Life and Death - Flaw1ess (04:24)`

const ARTIST_TITLE = `1.samebeam - do you understand how i feel? 02:50
2.kasumi - Lindo o aterrador 02:38
3.negimiso - She's into the stupid game 02:52
4.komato - save her smile 02:32
5.rtmfrk - is it stuck in the past 01:44
6.takahiro(FKS) - Ｒubberムirl メ 夢見心地 03:09
7.がくがく - どうせ先に死ぬんだろう？ 03:44
8.Kettenkrad - all my illusions 03:13
9.toyod ine - Judge not, ye shall not be judged. 03:23
10..｡*ﾟ+.*.Curren｡+..｡*ﾟ+ - Accelerate 02:56
11.nice - 2013 03:11
12.m4titann - my t4ilwind 04:11
13.setsuna__ - Does the song title of hyperflip have to be long? 03:22
14.momone - ☆★☆ I WANNA BE A PERFECT STAR ☆★☆ 02:31
15.キャップは？ - meteor360000000000 03:10
16.X TAMAMO X - DARLING❤️LIGHTNING LOVE BEAM⚡ 02:54
17.fuluca - the niconico medley to hyperflip pipeline 04:37
18.yax03 - 17 yo silly EDM artist from Japan vs. the World 05:29
19.DJ Raisei - せかいから____がきえるとき 04:04
20.雨部冷キザミ - With the rain that never stops 03:14`

const ARTIST_TITLE_TITLES = ['do you understand how i feel?', 'Lindo o aterrador', "She's into the stupid game", 'save her smile', 'is it stuck in the past', 'Ｒubberムirl メ 夢見心地', 'どうせ先に死ぬんだろう？', 'all my illusions', 'Judge not, ye shall not be judged.', 'Accelerate', '2013', 'my t4ilwind', 'Does the song title of hyperflip have to be long?', '☆★☆ I WANNA BE A PERFECT STAR ☆★☆', 'meteor360000000000', 'DARLING❤️LIGHTNING LOVE BEAM⚡', 'the niconico medley to hyperflip pipeline', '17 yo silly EDM artist from Japan vs. the World', 'せかいから____がきえるとき', 'With the rain that never stops']

describe('readTracklist', () => {
  it('cuts the artist off "Title - Artist" lines', () => {
    const { discs, artists } = readTracklist(TITLE_ARTIST)
    expect(artists).toEqual({ side: 'right', guess: 'right', sure: true })
    expect(discs[0]!.tracks.map(track => [track.track_number, track.title, track.duration])).toEqual([
      [1, 'Bipolar Singularity', 120], [2, 'Moonset~Another side', 297], [3, 'Moon Street', 198], [4, 'Ad Astra', 206],
      [5, '地月係間軌道躍遷', 251], [6, 'DESIRE OVERDRIVE', 485], [7, '秘星浮塵～Unfassbares Universum', 422],
      [8, '星窓終電 ～The scene of what she saw', 319], [9, 'Towards Life and Death', 264],
    ])
    expect(discs[0]!.tracks[1]!.artist).toBe('Tiuro逍遥 & AivF')
  })

  it('cuts the artist off "Artist - Title" lines', () => {
    const { discs, artists } = readTracklist(ARTIST_TITLE)
    expect(artists).toMatchObject({ side: 'left', guess: 'left' })
    expect(discs[0]!.tracks.map(track => track.title)).toEqual(ARTIST_TITLE_TITLES)
    expect(discs[0]!.tracks.map(track => track.track_number)).toEqual(Array.from({ length: 20 }, (_, index) => index + 1))
    expect(discs[0]!.tracks[9]!.artist).toBe('.｡*ﾟ+.*.Curren｡+..｡*ﾟ+')
    expect(discs[0]!.tracks[19]!.duration).toBe(194)
  })

  it('joins a number on a line of its own to the title after it', () => {
    const numberLines = ARTIST_TITLE.replace(/^(\d+\.)/gm, '$1\n')
    const { discs, artists } = readTracklist(numberLines)
    expect(artists?.side).toBe('left')
    expect(discs[0]!.tracks.map(track => track.title)).toEqual(ARTIST_TITLE_TITLES)
  })

  it('takes the side it is told, or none', () => {
    expect(readTracklist(ARTIST_TITLE, { artistSide: 'right' }).discs[0]!.tracks[0]!.title).toBe('samebeam')
    const whole = readTracklist(ARTIST_TITLE, { artistSide: 'none' })
    expect(whole.artists?.side).toBe('none')
    expect(whole.discs[0]!.tracks[0]).toEqual({ track_number: 1, number_label: null, title: 'samebeam - do you understand how i feel?', duration: 170 })
  })

  it('leaves a dash in a few titles alone', () => {
    const { discs, artists } = readTracklist('1. Opening - Reprise\n2. Main Theme\n3. Ending')
    expect(artists).toEqual({ side: 'none', guess: 'none', sure: false })
    expect(discs[0]!.tracks[0]!.title).toBe('Opening - Reprise')
  })

  it('keeps a number on its own line before a numbered line', () => {
    const [disc] = parseTracklist('1.\n2. Song')
    expect(disc!.tracks.map(track => [track.track_number, track.title])).toEqual([[1, '1.'], [2, 'Song']])
  })

  it.each(TRACKLIST_FORMATS.map(format => [format.key, format.text]))('reads the %s example', (_, text) => {
    const { discs } = readTracklist(text)
    expect(discs.flatMap(disc => disc.tracks).length).toBeGreaterThan(2)
    expect(discs.flatMap(disc => disc.tracks).every(track => track.title && !track.title.includes(' - '))).toBe(true)
  })
})
