import type { AggregateRef, AlbumDocument } from '../types/document'
import type { HarvestCircleMatch, HarvestNewArtist, HarvestPerson } from '../types/harvest'
import { creditGroups, updateCreditGroup } from './albumDocument'
import { newKey } from './documentKeys'

/**
 * The people of a harvest candidate in its album draft (docs/harvest/README.md#人员): the names the
 * server settled are linked to their artists or get new ones, the others stay printed names and
 * wait for the reviewer.
 */

/** Refs of the artists the draft creates for the sources' names; approval checks them once more. */
export const DRAFT_REF = 'hv'

/** States the draft settles by itself; the others are warnings. */
const SETTLED = new Set(['linked', 'ignored', 'link', 'circle', 'name', 'new'])
const LINKING = new Set(['linked', 'link', 'circle', 'name'])
const CIRCLE_SETTLED = new Set(['linked', 'name', 'new', 'unknown', 'unnamed'])

const normalize = (value: string) => value.normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').trim()

/** The same name, width, case and spacing aside. */
export const sameName = (a: string, b: string) => normalize(a) === normalize(b)

/** Adds an artist item for a new artist and returns the "@ref" to point at. */
export type CreateArtist = (document: HarvestNewArtist) => AggregateRef

export interface DraftPeople {
  /** The album artist: the circle's artist, or the new circle (created on the first call), or null */
  circle: () => AggregateRef | null
  /** How a credited name enters the album; null for a name the server did not look at */
  credit: (name: string) => { artist_id: AggregateRef | null, credited_as: string | null } | null
  /** What the server made of a credited name */
  person: (name: string) => HarvestPerson | undefined
}

/**
 * The circle and the credited names as the draft takes them. One new artist per person and one for
 * the circle, each created when first used; a name printed differently from its artist's stays as
 * credited.
 *
 * @param artistName the name of an artist already here, from the page's references
 */
export function draftPeople(people: HarvestPerson[], circle: HarvestCircleMatch | null, artistName: (id: number) => string | undefined, create: CreateArtist): DraftPeople {
  let circleRef: AggregateRef | null = null
  const circleArtist = () => {
    if (circle?.artist_id && (circle.state === 'linked' || circle.state === 'name')) return circle.artist_id
    if (circle?.state === 'new' && circle.create) return circleRef ??= create(circle.create)
    return null
  }
  const byName = new Map<string, HarvestPerson>()
  for (const entry of people) {
    for (const name of entry.names) byName.set(normalize(name), entry)
  }
  const person = (name: string) => byName.get(normalize(name))
  const created = new Map<string, AggregateRef>()
  const credit = (name: string) => {
    const found = person(name)
    if (!found) return null
    const asCredited = (artist: string | null | undefined) => artist && sameName(name, artist) ? null : name
    if (found.state === 'new' && found.create) {
      let ref = created.get(found.key)
      if (!ref) {
        ref = create(found.create)
        created.set(found.key, ref)
      }
      return { artist_id: ref, credited_as: asCredited(found.create.name) }
    }
    if (found.state === 'circle' && found.follows_circle) {
      const artist = circleArtist()
      return artist ? { artist_id: artist, credited_as: asCredited(circle?.create?.name) } : { artist_id: null, credited_as: name }
    }
    if (found.artist_id && LINKING.has(found.state)) return { artist_id: found.artist_id, credited_as: asCredited(artistName(found.artist_id)) }
    return { artist_id: null, credited_as: name }
  }
  return { circle: circleArtist, credit, person }
}

/** A name (or the circle) left to the reviewer. */
export interface PeopleWarning {
  /** The person's name key, or "circle" */
  key: string
  kind: 'person' | 'circle'
  names: string[]
  state: string
  candidates: number[]
  create: HarvestNewArtist | null
  /** Still a printed name in the draft (the circle: the album has no artist yet) */
  open: boolean
}

/** The names the server left to the reviewer, and which of them the draft still has unsettled. */
export function peopleWarnings(doc: AlbumDocument, people: HarvestPerson[], circle: HarvestCircleMatch | null): PeopleWarning[] {
  const printed = new Set(doc.credits.filter(row => row.artist_id === null && row.credited_as).map(row => normalize(row.credited_as!)))
  const warnings: PeopleWarning[] = []
  if (circle && !CIRCLE_SETTLED.has(circle.state)) {
    warnings.push({ key: 'circle', kind: 'circle', names: circle.name ? [circle.name] : [], state: circle.state, candidates: circle.candidates, create: circle.create, open: doc.artists.length === 0 })
  }
  for (const person of people) {
    if (SETTLED.has(person.state)) continue
    warnings.push({
      key: person.key, kind: 'person', names: person.names, state: person.state, candidates: person.candidates, create: person.create,
      open: person.names.some(name => printed.has(normalize(name))),
    })
  }
  return warnings
}

/** Points the printed credits of these names at an artist (an id or "@ref"). */
export function linkPrintedName(doc: AlbumDocument, names: string[], artistId: AggregateRef, artistName: string | null | undefined) {
  const wanted = new Set(names.map(normalize))
  for (const group of creditGroups(doc)) {
    if (group.artist_id !== null || !group.credited_as || !wanted.has(normalize(group.credited_as))) continue
    updateCreditGroup(doc, group, { artist_id: artistId, credited_as: artistName && sameName(group.credited_as, artistName) ? null : group.credited_as })
  }
}

/** Makes the artist the album's (the circle), unless the album has one. */
export function setAlbumArtist(doc: AlbumDocument, artistId: AggregateRef) {
  if (!doc.artists.length) doc.artists.push({ id: newKey('aa'), artist_id: artistId, credited_as: null, join_phrase: null })
}

/**
 * Brings a draft up to the server's suggestions, as a new draft would have them: printed names it
 * settles are linked or get their new artist, and an album without an artist gets the circle (a
 * name that is the circle follows the album artist the draft has). Returns how many changed.
 */
export function settleSuggestions(doc: AlbumDocument, people: HarvestPerson[], circle: HarvestCircleMatch | null, artistName: (id: number) => string | undefined, create: CreateArtist): number {
  const suggested = draftPeople(people, circle, artistName, create)
  let changed = 0
  if (!doc.artists.length) {
    const artist = suggested.circle()
    if (artist) {
      setAlbumArtist(doc, artist)
      changed++
    }
  }
  const albumArtist = doc.artists[0]?.artist_id ?? null
  for (const group of creditGroups(doc)) {
    if (group.artist_id !== null || !group.credited_as) continue
    const person = suggested.person(group.credited_as)
    const found = person?.state === 'circle' && person.follows_circle
      ? (albumArtist ? { artist_id: albumArtist, credited_as: group.credited_as } : null)
      : suggested.credit(group.credited_as)
    if (!found?.artist_id) continue
    updateCreditGroup(doc, group, found)
    changed++
  }
  return changed
}
