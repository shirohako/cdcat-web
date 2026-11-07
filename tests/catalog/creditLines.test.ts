import { describe, expect, it } from 'vitest'
import { addCredit, addTrack, changeCreditRole, emptyAlbumDocument, moveTrackArtist, patchCredits, removeCredits, trackArtists, tracksOn } from '../../app/utils/albumDocument'
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

describe('artists joined by a word', () => {
  /** Two or three artists of the first track, one word already on the second. */
  const joined = (...ids: number[]) => {
    const { doc, tracks } = album()
    for (const id of ids) addCredit(doc, { ...person(id), role: 'artist', role_label: null }, [tracks[0]!])
    const rows = trackArtists(doc, tracks[0]!)
    patchCredits(doc, [rows[1]!], { join_phrase: 'meets' })
    return { doc, tracks, track: tracks[0]!, rows: () => trackArtists(doc, tracks[0]!) }
  }
  const line = (rows: Array<{ artist_id: unknown, join_phrase?: string | null }>) => rows.map(row => [row.join_phrase, row.artist_id].filter(Boolean).join(' ')).join(' ')

  it('swaps two artists and leaves the word where it is printed', () => {
    const { doc, rows } = joined(2, 1)
    expect(line(rows())).toBe('2 meets 1')
    moveTrackArtist(doc, rows()[1]!, -1)
    expect(line(rows())).toBe('1 meets 2')
  })

  it('moves one place along among the artists only, past nothing else', () => {
    const { doc, track, rows } = joined(1, 2, 3)
    addCredit(doc, { ...person(9), role: 'composer', role_label: null }, [track])
    moveTrackArtist(doc, rows()[2]!, -1)
    expect(line(rows())).toBe('1 meets 3 2')
    moveTrackArtist(doc, rows()[0]!, -1)
    moveTrackArtist(doc, rows()[2]!, 1)
    expect(line(rows())).toBe('1 meets 3 2')
    expect(creditsOn(doc, track, roleOrder).map(item => item.role)).toEqual(['artist', 'composer'])
  })

  it('drops the word of an artist left first, and of anything but a track\'s artist', () => {
    const removed = joined(1, 2, 3)
    removeCredits(removed.doc, [removed.rows()[0]!])
    expect(line(removed.rows())).toBe('2 3')

    const changed = joined(1, 2)
    changeCreditRole(changed.doc, [changed.rows()[1]!], 'composer')
    expect(changed.doc.credits.map(row => row.join_phrase ?? null)).toEqual([null, null])

    const { doc } = album()
    const [first] = addCredit(doc, { ...person(1), role: 'artist', role_label: null }, null)
    const [second] = addCredit(doc, { ...person(2), role: 'artist', role_label: null }, null)
    patchCredits(doc, [first!, second!], { join_phrase: 'meets' })
    expect(doc.credits.map(row => row.join_phrase)).toEqual([null, null])
  })

  it('leaves the word out of who a person is: one artist stays one person in a line by role', () => {
    const { doc, tracks, rows } = joined(1, 2)
    addCredit(doc, { ...person(2), role: 'artist', role_label: null }, [tracks[1]!])
    expect(rows()[1]!.join_phrase).toBe('meets')
    expect(new Set(creditLines(doc, roleOrder).flatMap(item => item.people.map(entry => entry.person.artist_id)))).toEqual(new Set([1, 2]))
    expect(creditLines(doc, roleOrder).find(item => item.trackIds.length === 2)?.people.map(entry => entry.person.artist_id)).toEqual([2])
  })

  it('takes order and words over with 和上一首相同, and tells tracks apart by them', () => {
    const { doc, tracks, track } = joined(1, 2)
    const other = tracks[1]!
    for (const id of [2, 1]) addCredit(doc, { ...person(id), role: 'artist', role_label: null }, [other])
    expect(sameTrackCredits(doc, track, other)).toBe(false)
    copyTrackCredits(doc, track, other)
    expect(line(trackArtists(doc, other))).toBe('1 meets 2')
    expect(sameTrackCredits(doc, track, other)).toBe(true)
    patchCredits(doc, [trackArtists(doc, other)[1]!], { join_phrase: 'vs' })
    expect(sameTrackCredits(doc, track, other)).toBe(false)
  })
})

describe('belonging to a credit', () => {
  it('ends when a 客串 becomes another role, and leaves other roles alone', () => {
    const { doc, tracks } = album()
    const [host] = addCredit(doc, { ...person(1), role: 'artist', role_label: null }, [tracks[0]!])
    const [guest] = addCredit(doc, { ...person(2), role: 'featuring', role_label: null }, [tracks[0]!])
    const [member] = addCredit(doc, { ...person(3), role: 'composer', role_label: null }, [tracks[0]!])
    guest!.parent_id = host!.id
    member!.parent_id = host!.id
    changeCreditRole(doc, [member!], 'arranger')
    expect(member!.parent_id).toBe(host!.id)
    changeCreditRole(doc, [guest!], 'vocals')
    expect(guest!.parent_id).toBeNull()
  })
})

describe('notes', () => {
  const note = (id: number, detail: string | null) => ({ ...person(id), detail, role: 'vocals', role_label: null })

  it('are no reason for a second credit: the first stays, an empty one takes the note', () => {
    const { doc, tracks } = album()
    const [first] = addCredit(doc, note(1, 'first'), [tracks[0]!])
    expect(addCredit(doc, note(1, 'second'), [tracks[0]!])[0]).toBe(first)
    expect(doc.credits.map(row => row.detail)).toEqual(['first'])

    const [plain] = addCredit(doc, note(2, null), [tracks[0]!])
    const [noted] = addCredit(doc, note(3, 'kept'), [tracks[0]!])
    patchCredits(doc, [noted!], { artist_id: 2 })
    expect(doc.credits.filter(row => row.artist_id === 2).map(row => row.detail)).toEqual(['kept'])
    expect(plain!.detail).toBe('kept')
  })

  it('don\'t split a person in a line by role, and show there', () => {
    const { doc, tracks } = album()
    addCredit(doc, note(1, null), [tracks[0]!])
    addCredit(doc, note(1, '5弦'), [tracks[1]!])
    const lines = creditLines(doc, roleOrder)
    expect(lines).toHaveLength(1)
    expect(lines[0]!.people.map(entry => [entry.person.artist_id, entry.person.detail])).toEqual([[1, '5弦']])
    expect(lines[0]!.trackIds).toHaveLength(2)
  })

  it('come along with 和上一首相同, and tell tracks apart', () => {
    const { doc, tracks } = album()
    addCredit(doc, note(1, '5弦'), [tracks[0]!])
    addCredit(doc, note(1, null), [tracks[1]!])
    expect(sameTrackCredits(doc, tracks[0]!, tracks[1]!)).toBe(false)
    copyTrackCredits(doc, tracks[0]!, tracks[1]!)
    expect(doc.credits.map(row => row.detail)).toEqual(['5弦', '5弦'])
    expect(sameTrackCredits(doc, tracks[0]!, tracks[1]!)).toBe(true)
  })
})
