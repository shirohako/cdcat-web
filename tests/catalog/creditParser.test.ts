import { describe, expect, it } from 'vitest'
import { foldRoleWord, newArtistName, parseCredits } from '../../app/utils/creditParser'

const WORDS: Record<string, string[]> = {
  composer: ['作曲', 'Composer', 'Music'],
  lyricist: ['作詞', 'Lyrics', 'Lyric'],
  arranger: ['編曲', 'Arranger'],
  vocals: ['Vocal', 'ボーカル'],
  artist: ['Artist'],
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

  it('marks role words it doesn\'t know and skips lines that are no credits', () => {
    const { lines, skipped } = parse('Recording：Studio Moon\nThanks to everyone\n作曲 ミナト')
    expect(lines).toHaveLength(1)
    expect(lines[0]).toMatchObject({ roles: [], unknown: ['Recording'] })
    expect(skipped).toEqual([2, 3])
  })
})
