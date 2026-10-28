import { describe, expect, it } from 'vitest'
import type { HarvestCircleMatch, HarvestNewArtist, HarvestPerson } from '../../app/types/harvest'
import { addCredit, emptyAlbumDocument } from '../../app/utils/albumDocument'
import { albumPublisher, draftPeople, linkPrintedName, peopleWarnings, setCirclePublisher, settleSuggestions } from '../../app/utils/harvestPeople'

const person = (names: string[], state: HarvestPerson['state'], extra: Partial<HarvestPerson> = {}): HarvestPerson => ({
  key: names[0]!.toLowerCase(), names, state, artist_id: null, follows_circle: false, candidates: [], db_keys: [],
  create: { name: names[0]!, type: 'person', links: [] }, ...extra,
})
const circle = (state: HarvestCircleMatch['state'], extra: Partial<HarvestCircleMatch> = {}): HarvestCircleMatch => ({
  state, name: 'Starlit Garden', artist_id: null, candidates: [], suggestion: null, create: { name: 'Starlit Garden', type: 'circle', links: [] }, ...extra,
})
const names: Record<number, string> = { 7: 'Kanade Mizuki', 9: 'Moonlit Lab' }

/** A create callback that records what it made. */
const creator = () => {
  const made: HarvestNewArtist[] = []
  return { made, create: (document: HarvestNewArtist) => `@hv${made.push(document)}` }
}

describe('draftPeople', () => {
  it('links the settled names, creates one artist per new person and keeps the others printed', () => {
    const { made, create } = creator()
    const draft = draftPeople([
      person(['Kanade Mizuki', 'KANADE MIZUKI'], 'name', { artist_id: 7 }),
      person(['Simona Stanzani Pini', 'S. S. Pini'], 'new'),
      person(['Yuki Tanaka'], 'namesake', { candidates: [1, 2] }),
      person(['Starlit Garden'], 'circle', { follows_circle: true }),
    ], circle('new'), id => names[id], create)

    expect(draft.circle()).toBe('@hv1')
    expect(draft.credit('Kanade Mizuki')).toEqual({ artist_id: 7, credited_as: null })
    // Printed otherwise than the artist's name: kept as credited.
    expect(draft.credit('KANADE  MIZUKI')).toEqual({ artist_id: 7, credited_as: null })
    expect(draft.credit('Simona Stanzani Pini')).toEqual({ artist_id: '@hv2', credited_as: null })
    expect(draft.credit('S. S. Pini')).toEqual({ artist_id: '@hv2', credited_as: 'S. S. Pini' })
    expect(draft.credit('Yuki Tanaka')).toEqual({ artist_id: null, credited_as: 'Yuki Tanaka' })
    expect(draft.credit('Starlit Garden')).toEqual({ artist_id: '@hv1', credited_as: null })
    expect(draft.credit('Somebody else')).toBeNull()
    expect(made.map(document => document.name)).toEqual(['Starlit Garden', 'Simona Stanzani Pini'])
  })

  it('creates the circle only when something uses it', () => {
    const { made, create } = creator()
    const draft = draftPeople([person(['Hoshino'], 'new')], circle('new'), id => names[id], create)
    draft.credit('Hoshino')
    expect(made.map(document => document.name)).toEqual(['Hoshino'])
    expect(draftPeople([], circle('linked', { artist_id: 9 }), id => names[id], create).circle()).toBe(9)
  })
})

describe('peopleWarnings', () => {
  it('lists the names left to the reviewer and whether the draft still prints them', () => {
    const doc = emptyAlbumDocument()
    addCredit(doc, { artist_id: null, credited_as: 'Yuki Tanaka', role: 'composer', detail: null }, null)
    addCredit(doc, { artist_id: 3, credited_as: 'ZUN', role: 'arranger', detail: null }, null)
    const people = [person(['Yuki Tanaka'], 'namesake', { candidates: [1, 2] }), person(['ZUN'], 'short'), person(['Hoshino'], 'new')]

    expect(peopleWarnings(doc, people, circle('shop', { name: 'イオシスショップ' })).map(warning => [warning.kind, warning.names[0], warning.open])).toEqual([
      ['circle', 'イオシスショップ', true],
      ['person', 'Yuki Tanaka', true],
      ['person', 'ZUN', false],
    ])
    setCirclePublisher(doc, 4)
    linkPrintedName(doc, ['yuki tanaka'], 1, 'Yuki Tanaka')
    expect(peopleWarnings(doc, people, circle('shop')).filter(warning => warning.open)).toEqual([])
    expect(doc.credits.find(row => row.role === 'composer')).toMatchObject({ artist_id: 1, credited_as: null })
  })
})

describe('settleSuggestions', () => {
  it('brings an older draft up to the suggestions without touching what the reviewer settled', () => {
    const doc = emptyAlbumDocument()
    addCredit(doc, { artist_id: null, credited_as: 'Kanade Mizuki', role: 'lyricist', detail: null }, null)
    addCredit(doc, { artist_id: null, credited_as: 'Hoshino', role: 'composer', detail: null }, null)
    addCredit(doc, { artist_id: null, credited_as: 'Yuki Tanaka', role: 'arranger', detail: null }, null)
    addCredit(doc, { artist_id: 5, credited_as: 'Ayane', role: 'vocals', detail: null }, null)
    const { made, create } = creator()

    const changed = settleSuggestions(doc, [
      person(['Kanade Mizuki'], 'name', { artist_id: 7 }),
      person(['Hoshino'], 'new'),
      person(['Yuki Tanaka'], 'namesake'),
      person(['Ayane'], 'new'),
    ], circle('linked', { artist_id: 9 }), id => names[id], create)

    expect(changed).toBe(3)
    expect(albumPublisher(doc)).toBe(9)
    expect(doc.credits.map(row => [row.role, row.credited_as, row.artist_id])).toEqual([
      ['lyricist', null, 7], ['composer', null, '@hv1'], ['arranger', 'Yuki Tanaka', null], ['vocals', 'Ayane', 5], ['publisher', null, 9],
    ])
    expect(made.map(document => document.name)).toEqual(['Hoshino'])
  })
})
