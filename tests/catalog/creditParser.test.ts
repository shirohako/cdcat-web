import { describe, expect, it } from 'vitest'
import { foldRoleWord, parseCredits } from '../../app/utils/creditParser'

const WORDS: Record<string, string[]> = {
  composer: ['作曲', 'Composer', 'Music'],
  lyricist: ['作詞', 'Lyrics'],
  arranger: ['編曲', 'Arranger'],
  vocals: ['Vocal', 'ボーカル'],
  illustrator: ['Illustration'],
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

  it('marks role words it doesn\'t know and skips lines that are no credits', () => {
    const { lines, skipped } = parse('Recording：Studio Moon\nThanks to everyone\n作曲 ミナト')
    expect(lines).toHaveLength(1)
    expect(lines[0]).toMatchObject({ roles: [], unknown: ['Recording'] })
    expect(skipped).toEqual([2, 3])
  })
})
