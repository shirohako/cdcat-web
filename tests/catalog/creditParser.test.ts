import { describe, expect, it } from 'vitest'
import { foldRoleWord, newArtistName, parseCredits } from '../../app/utils/creditParser'

const WORDS: Record<string, string[]> = {
  composer: ['作曲', 'Composer', 'Music'],
  lyricist: ['作詞', 'Lyrics', 'Lyric'],
  arranger: ['編曲', 'Arranger'],
  vocals: ['Vocal', 'ボーカル'],
  artist: ['Artist', '艺术家'],
  illustrator: ['Illustration', 'Illust'],
  guitar: ['Guitar'],
  bass: ['Bass'],
  publisher: ['発売元'],
}
const lookup = new Map(Object.entries(WORDS).flatMap(([role, words]) => words.map(word => [foldRoleWord(word), [role]])))
const parse = (text: string) => parseCredits(text, word => lookup.get(word) ?? [])
const tracks = (refs: unknown) => Array.isArray(refs) ? refs.map(ref => `${ref.disc}-${ref.number}`) : refs

describe('pasted credit lists', () => {
  it('splits roles, names and each name\'s tracks', () => {
    const [line] = parse('作曲・編曲：ミナト（M1–M3）、Yuki（M4）').lines
    expect(line!.roles).toEqual(['composer', 'arranger'])
    expect(line!.names.map(name => [name.name, tracks(name.tracks)])).toEqual([['ミナト', ['1-1', '1-2', '1-3']], ['Yuki', ['1-4']]])
  })

  it('makes who comes after feat. a 客串, with the tracks of the whole name', () => {
    const { lines } = parse('Vocal：Gardens feat. moon jelly（M2）\nVocal：ルナ（CV：星野あかり） ft. Aoi & Mio\nVocal：Yuki (feat. Rin)、Sora')
    const names = lines.map(line => line.names.map(name => [name.name, name.detail, tracks(name.tracks), name.featuring ?? false]))
    expect(names).toEqual([
      [['Gardens', null, ['1-2'], false], ['moon jelly', null, ['1-2'], true]],
      [['ルナ', 'CV：星野あかり', null, false], ['Aoi', null, null, true], ['Mio', null, null, true]],
      [['Yuki', null, null, false], ['Rin', null, null, true], ['Sora', null, null, false]],
    ])
  })

  it('splits the people of one written name, each 客串 with the name right before its feat.', () => {
    const { lines } = parse('Artist：しゅーりん × MoAE:. feat.nayuta（M10）\nArtist：Xeudo Code & Xeno feat. eili、A×B、M&M\nArtist：Yuki (feat. Rin & Sora)\nArtist：A feat. X & B feat. Y')
    const names = lines.map(line => line.names.map(name => [name.name, name.featuring ? line.names[name.host!]!.name : null]))
    expect(names).toEqual([
      [['しゅーりん', null], ['MoAE:.', null], ['nayuta', 'MoAE:.']],
      [['Xeudo Code', null], ['Xeno', null], ['eili', 'Xeno'], ['A', null], ['B', null], ['M&M', null]],
      [['Yuki', null], ['Rin', 'Yuki'], ['Sora', 'Yuki']],
      [['A', null], ['X', 'A'], ['B', null], ['Y', 'B']],
    ])
    expect(lines[0]!.names.map(name => tracks(name.tracks))).toEqual([['1-10'], ['1-10'], ['1-10']])
    // The whole written name goes with its first person, for the dialog to keep it whole when it is an artist's name
    expect(lines[1]!.names.map(name => name.unit ?? null)).toEqual([{ name: 'Xeudo Code & Xeno', size: 2 }, null, null, { name: 'A×B', size: 2 }, null, null])
  })

  it('keeps brackets that are no track list as the detail, and reads shorthands and 全曲', () => {
    const { lines } = parse('Vocal：ルナ（CV：星野あかり）\nVo.: 星野あかり (Tr.2, 5)\nMusic: ZUN (全曲)\n作編曲：Yuki')
    expect(lines.map(line => line.roles)).toEqual([['vocals'], ['vocals'], ['composer'], ['composer', 'arranger']])
    expect(lines[0]!.names[0]).toMatchObject({ name: 'ルナ', detail: 'CV：星野あかり', tracks: null })
    expect(tracks(lines[1]!.names[0]!.tracks)).toEqual(['1-2', '1-5'])
    expect(lines[2]!.names[0]!.tracks).toBe('all')
  })

  it('gives a track\'s block to the lines under it, up to a blank line, and follows discs', () => {
    const { lines } = parse('01. 星屑のアトラス: Prologue\n作詞：ミナト\n\nDisc 2\nM3 Bonus\nComposer & Arranger: Yuki, A\n\nIllustration：mochi')
    expect(lines.map(line => [line.roleText, line.names.map(name => tracks(name.tracks))])).toEqual([
      ['作詞', [['1-1']]],
      ['Composer & Arranger', [['2-3'], ['2-3']]],
      ['Illustration', [null]],
    ])
  })

  it('reads M-01. and M1.Title blocks, indented or double-spaced, and & between Japanese names', () => {
    const credits = (text: string) => parse(text).lines.map(line => [line.roles.join('+'), line.names.map(name => `${name.name}@${tracks(name.tracks) ?? 'album'}`).join(' / ')])
    expect(credits('M-01.\nVocal: nayuta\nMusic&Lyric: Minato Suzuya\n\nM-02.\nGuitar&Bass: Maki Hanagata\n\nIllust: K-ko')).toEqual([
      ['vocals', 'nayuta@1-1'], ['composer+lyricist', 'Minato Suzuya@1-1'], ['guitar+bass', 'Maki Hanagata@1-2'], ['illustrator', 'K-ko@album'],
    ])
    const indented = 'M1.プリズムにさよならを\n\n   Vocal:nayuta\n\n   Music&Lyric:鈴谷皆人\n\n\n\nM3.破滅しゅぎ的恋愛\n\n   Vocal:つぐ&るる'
    const expected = [['vocals', 'nayuta@1-1'], ['composer+lyricist', '鈴谷皆人@1-1'], ['vocals', 'つぐ@1-3 / るる@1-3']]
    expect(credits(indented)).toEqual(expected)
    expect(credits(`${indented.replace(/^ {3}/gm, '')}\n\n\n\nIllust:K子`)).toEqual([...expected, ['illustrator', 'K子@album']])
    expect(credits('Artist: Tom&Jerry')).toEqual([['artist', 'Tom&Jerry@album']])
    expect([newArtistName('上杉 悟'), newArtistName('ナツメ\u3000ユウキ'), newArtistName('Aki Ra')]).toEqual(['上杉悟', 'ナツメユウキ', 'Aki Ra'])
  })

  it('keeps a company suffix after a comma with the name, and reads ranges of zero-padded numbers', () => {
    const { lines } = parse('Composer: dDedalus (01, 10, 14)\nArranger: ESTIMATE, LLC. (02-04, 11-12)\nArtist: Foo Co., Ltd.、Bar Inc. (M3)、Baz')
    expect(lines.map(line => line.names.map(name => [name.name, tracks(name.tracks)]))).toEqual([
      [['dDedalus', ['1-1', '1-10', '1-14']]],
      [['ESTIMATE, LLC.', ['1-2', '1-3', '1-4', '1-11', '1-12']]],
      [['Foo Co., Ltd.', null], ['Bar Inc.', ['1-3']], ['Baz', null]],
    ])
    const quoted = parse('Composer: 《ESTIMATE, LLC.》 (02-03, 15)\nArtist: 「A, B & C」、『D』 feat. 〈E, F〉（M1）').lines
    expect(quoted.map(line => line.names.map(name => [name.name, tracks(name.tracks)]))).toEqual([
      [['ESTIMATE, LLC.', ['1-2', '1-3', '1-15']]],
      [['A, B & C', null], ['D', ['1-1']], ['E, F', ['1-1']]],
    ])
  })

  it('reads disc.track numbers, feat. against a Japanese name, and a name list that wraps', () => {
    const { lines, skipped } = parse([
      '艺术家:Animalost(1.1)、雨部冷キザミfeat.宮舞モ力',
      '(1.5)、Tatsh(1.6)、夜未アガリfeat.重音テトSV(1.10)、',
      'WHITEFISTS feat.Sennzai(2.1)、ak+q(2.4)、LV.4(2.8)、wa.(2.9)、Junk feat.《夢/結唱R0sE》(2.11)、',
      'ex.Zekk(3.4)、Mei Naganowa feat.L4hee(3.11)、天門',
      '(4.7)、黒魔feat.カゼヒキV(4.10)、aon(4.11)',
    ].join('\n'))
    expect(skipped).toEqual([])
    expect(lines).toHaveLength(1)
    expect(lines[0]!.roles).toEqual(['artist'])
    expect(lines[0]!.names.map(name => [name.name, tracks(name.tracks), name.featuring ? lines[0]!.names[name.host!]!.name : null])).toEqual([
      ['Animalost', ['1-1'], null],
      ['雨部冷キザミ', ['1-5'], null],
      ['宮舞モ力', ['1-5'], '雨部冷キザミ'],
      ['Tatsh', ['1-6'], null],
      ['夜未アガリ', ['1-10'], null],
      ['重音テトSV', ['1-10'], '夜未アガリ'],
      ['WHITEFISTS', ['2-1'], null],
      ['Sennzai', ['2-1'], 'WHITEFISTS'],
      ['ak+q', ['2-4'], null],
      ['LV.4', ['2-8'], null],
      ['wa.', ['2-9'], null],
      ['Junk', ['2-11'], null],
      ['夢/結唱R0sE', ['2-11'], 'Junk'],
      ['ex.Zekk', ['3-4'], null],
      ['Mei Naganowa', ['3-11'], null],
      ['L4hee', ['3-11'], 'Mei Naganowa'],
      ['天門', ['4-7'], null],
      ['黒魔', ['4-10'], null],
      ['カゼヒキV', ['4-10'], '黒魔'],
      ['aon', ['4-11'], null],
    ])
  })

  it('reads disc.track ranges, and keeps a version number as the detail', () => {
    const { lines } = parse('Vocal: A (1.2-1.4, 2.1)\nVocal: B (1.8-10)\nVocal: C (1.8-2.3)\nVocal: D (2.0)')
    expect(lines.map(line => tracks(line.names[0]!.tracks))).toEqual([['1-2', '1-3', '1-4', '2-1'], ['1-8', '1-9', '1-10'], null, null])
    expect(lines.slice(2).map(line => line.names[0]!.detail)).toEqual(['1.8-2.3', '2.0'])
  })

  it('leaves a name glued to feat in Latin letters, and doesn\'t wrap past the end of a list', () => {
    const { lines, skipped } = parse('Vocal: Swift.Kid、Mofeat.Rin\n作曲：A、\n編曲：B\nVocal: C、\nDisc 2\n作曲：D\n这是一行说明\n(M2) 这行也不是\n\n作曲：E、\n\nF')
    expect(lines.map(line => [line.line, line.names.map(name => name.name)])).toEqual([
      [1, ['Swift.Kid', 'Mofeat.Rin']], [2, ['A']], [3, ['B']], [4, ['C']], [6, ['D']], [10, ['E']],
    ])
    expect(tracks(lines[4]!.names[0]!.tracks)).toBe(null)
    expect(skipped).toEqual([7, 8, 12])
  })

  it('numbers lines after a wrapped list as they stand in the text', () => {
    const { lines, skipped } = parse('作曲：A、\nB\n说明\n編曲：C')
    expect(lines.map(line => line.line)).toEqual([1, 4])
    expect(lines[0]!.names.map(name => name.name)).toEqual(['A', 'B'])
    expect(skipped).toEqual([3])
  })

  it('marks role words it doesn\'t know and skips lines that are no credits', () => {
    const { lines, skipped } = parse('Recording：Studio Moon\nThanks to everyone\n作曲 ミナト')
    expect(lines).toHaveLength(1)
    expect(lines[0]).toMatchObject({ roles: [], unknown: ['Recording'] })
    expect(skipped).toEqual([2, 3])
  })
})
