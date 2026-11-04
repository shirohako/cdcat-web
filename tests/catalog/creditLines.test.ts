import { describe, expect, it } from 'vitest'
import { addCredit, addTrack, emptyAlbumDocument, tracksOn } from '../../app/utils/albumDocument'
import {
  addCreditLine, addLinePerson, copyTrackCredits, creditLines, creditsOn, removeLinePerson, sameTrackCredits,
  setLineRoles, setLineTracks, updateLinePerson,
} from '../../app/utils/creditLines'

const ORDER = ['artist', 'publisher', 'composer', 'lyricist', 'arranger', 'vocals', 'illustrator']
const roleOrder = (role: string) => ORDER.indexOf(role)

const album = () => {
  const doc = emptyAlbumDocument()
  const disc = doc.discs[0]!
  for (const title of ['A', 'B', 'C', 'D']) addTrack(doc, disc.id, { title })
  return { doc, tracks: tracksOn(doc, disc.id).map(track => track.id) }
}
const person = (artist_id: number | string | null, credited_as: string | null = null) => ({ artist_id, credited_as, detail: null })
const summary = (doc: ReturnType<typeof emptyAlbumDocument>) => creditLines(doc, roleOrder)
  .map(line => `${line.roles.join('+')} ${line.people.map(entry => entry.person.artist_id ?? entry.person.credited_as).join(',')} @${line.trackIds.length ? line.trackIds.length : 'album'}`)

describe('job titles', () => {
  const labelled = (artist_id: number, role_label: string) => ({ ...person(artist_id), role_label })

  it('keeps people of one role in one line, each with their own job title', () => {
    const { doc, tracks } = album()
    addCreditLine(doc, ['illustrator'], [labelled(1, 'Graphic Designer'), labelled(2, 'Package Designer'), person(3)], tracks)
    expect(summary(doc)).toEqual(['illustrator 1,2,3 @4'])
    expect(creditLines(doc, roleOrder)[0]!.people.map(entry => entry.person.role_label)).toEqual(['Graphic Designer', 'Package Designer', null])
  })

  it('keeps one person under two job titles of one role', () => {
    const { doc } = album()
    addCreditLine(doc, ['illustrator'], [labelled(1, 'Graphic Designer'), labelled(1, 'Package Designer')], [])
    expect(doc.credits.map(row => row.role_label)).toEqual(['Graphic Designer', 'Package Designer'])
  })

  it('keeps a credit with a job title out of a line of several roles', () => {
    const { doc, tracks } = album()
    addCreditLine(doc, ['composer', 'arranger'], [person(1)], tracks)
    addCreditLine(doc, ['composer'], [labelled(2, 'Sound Creator')], tracks)
    addCreditLine(doc, ['arranger'], [person(2)], tracks)
    expect(summary(doc)).toEqual(['composer+arranger 1 @4', 'composer 2 @4', 'arranger 2 @4'])
  })

  it('splits the line when a role is added, the new role without the job title', () => {
    const { doc, tracks } = album()
    addCreditLine(doc, ['composer'], [labelled(1, 'Sound Creator')], tracks)
    setLineRoles(doc, creditLines(doc, roleOrder)[0]!, ['composer', 'arranger'])
    expect(summary(doc)).toEqual(['composer 1 @4', 'arranger 1 @4'])
    expect(doc.credits.filter(row => row.track_id === tracks[0]).map(row => [row.role, row.role_label])).toEqual([['composer', 'Sound Creator'], ['arranger', null]])
  })

  it('keeps the job title when the line\'s one role is swapped, unless the new role can\'t have one', () => {
    const { doc } = album()
    addCreditLine(doc, ['composer'], [labelled(1, 'Sound Creator')], [])
    setLineRoles(doc, creditLines(doc, roleOrder)[0]!, ['arranger'])
    expect(doc.credits.map(row => [row.role, row.role_label])).toEqual([['arranger', 'Sound Creator']])
    setLineRoles(doc, creditLines(doc, roleOrder)[0]!, ['featuring'])
    expect(doc.credits.map(row => [row.role, row.role_label])).toEqual([['featuring', null]])
  })

  it('copies the job title with a track\'s credits and tells tracks with different ones apart', () => {
    const { doc, tracks } = album()
    addCreditLine(doc, ['illustrator'], [labelled(1, 'Graphic Designer')], [tracks[0]!])
    addCreditLine(doc, ['illustrator'], [person(1)], [tracks[1]!])
    expect(sameTrackCredits(doc, tracks[0]!, tracks[1]!)).toBe(false)
    copyTrackCredits(doc, tracks[0]!, tracks[1]!)
    expect(sameTrackCredits(doc, tracks[0]!, tracks[1]!)).toBe(true)
  })
})

describe('lines by role', () => {
  it('reads a booklet line back as one line: two roles, one person, the same tracks', () => {
    const { doc, tracks } = album()
    addCreditLine(doc, ['composer', 'arranger'], [person(1)], tracks.slice(0, 3))
    addCreditLine(doc, ['composer', 'arranger'], [person(2)], [tracks[3]!])
    addCreditLine(doc, ['vocals'], [person(3), person(4)], tracks.slice(0, 2))
    expect(summary(doc)).toEqual(['composer+arranger 1 @3', 'composer+arranger 2 @1', 'vocals 3,4 @2'])
  })

  it('leaves the whole album\'s 署名与发行 to the byline block', () => {
    const { doc, tracks } = album()
    addCredit(doc, { ...person(9), role: 'publisher' }, null)
    addCredit(doc, { ...person(9), role: 'artist' }, null)
    addCredit(doc, { ...person(5), role: 'artist' }, [tracks[0]!])
    expect(summary(doc)).toEqual(['artist 5 @1'])
  })

  it('moves a line between tracks and the whole album, keeping rows it keeps', () => {
    const { doc, tracks } = album()
    addCreditLine(doc, ['composer'], [person(1)], tracks.slice(0, 2))
    const kept = doc.credits.find(row => row.track_id === tracks[0])!.id
    setLineTracks(doc, creditLines(doc, roleOrder)[0]!, [tracks[0]!, tracks[2]!])
    expect(doc.credits.map(row => row.track_id)).toEqual([tracks[0], tracks[2]])
    expect(doc.credits[0]!.id).toBe(kept)
    setLineTracks(doc, creditLines(doc, roleOrder)[0]!, [])
    expect(doc.credits.map(row => row.track_id)).toEqual([null])
  })

  it('adds and drops roles, people and printed names for the whole line', () => {
    const { doc, tracks } = album()
    addCreditLine(doc, ['composer'], [person(1)], tracks.slice(0, 2))
    setLineRoles(doc, creditLines(doc, roleOrder)[0]!, ['composer', 'arranger'])
    addLinePerson(doc, creditLines(doc, roleOrder)[0]!, person(null, 'Yuki'))
    expect(doc.credits).toHaveLength(8)
    updateLinePerson(doc, creditLines(doc, roleOrder)[0]!, person(1), { credited_as: 'Minato' })
    expect(doc.credits.filter(row => row.artist_id === 1).every(row => row.credited_as === 'Minato')).toBe(true)
    removeLinePerson(doc, creditLines(doc, roleOrder)[0]!, person(null, 'Yuki'))
    setLineRoles(doc, creditLines(doc, roleOrder)[0]!, ['arranger'])
    expect(summary(doc)).toEqual(['arranger 1 @2'])
  })
})

describe('lists by track', () => {
  it('groups a track\'s credits by role and copies them onto another track', () => {
    const { doc, tracks } = album()
    addCredit(doc, { ...person(3), role: 'vocals' }, [tracks[0]!])
    addCredit(doc, { ...person(1), role: 'composer' }, [tracks[0]!, tracks[1]!])
    addCredit(doc, { ...person(7), role: 'lyricist' }, [tracks[1]!])
    expect(creditsOn(doc, tracks[0]!, roleOrder).map(item => item.role)).toEqual(['composer', 'vocals'])
    expect(sameTrackCredits(doc, tracks[0]!, tracks[1]!)).toBe(false)
    copyTrackCredits(doc, tracks[0]!, tracks[1]!)
    expect(sameTrackCredits(doc, tracks[0]!, tracks[1]!)).toBe(true)
    expect(doc.credits.some(row => row.role === 'lyricist')).toBe(false)
  })
})
