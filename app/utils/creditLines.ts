// The album editor's ways of listing credits (docs/catalog/README.md#制作人员), over the document's
// one-row-per-person-role-track credits: the byline block (the whole album's 署名与发行), lines by role
// (roles × people × tracks, the way a booklet prints them) and lists by track. The views are worked out
// again after every change, so nothing here is kept between edits; the edits keep row ids where they can,
// so the change preview shows changes rather than removals and additions.

import type { AggregateRef, AlbumDocument, RowId } from '~/types/document'
import { RELEASE_ROLES } from '../types/album'
import { addCredit, orderedTracks, patchCredits, removeCredits, type AlbumCreditRow } from './albumDocument'
import { byOrder, sameId } from './documentRows'

/** Who a credit names: an artist (an id, or "@ref" of one new in this revision) or only a printed name, and the detail. */
export interface CreditPerson {
  artist_id: AggregateRef | null
  credited_as: string | null
  detail: string | null
}

export const personOf = (row: AlbumCreditRow): CreditPerson => ({ artist_id: row.artist_id, credited_as: row.credited_as || null, detail: row.detail || null })
export const personKey = (person: CreditPerson) => JSON.stringify([person.artist_id, person.credited_as || null, person.detail || null])
const isPerson = (person: CreditPerson) => (row: AlbumCreditRow) => personKey(personOf(row)) === personKey(person)

/** The whole album's 署名与发行 credits, which the byline block edits; everything else is in the lines or the track lists. */
export const isBylineCredit = (row: AlbumCreditRow) => row.track_id === null && (RELEASE_ROLES as readonly string[]).includes(row.role)

/** Roles only the whole album can have (发行、厂牌 …): they belong in the byline block. */
export const ALBUM_ONLY_ROLES: readonly string[] = RELEASE_ROLES.filter(role => role !== 'artist')

/** The roles a line can be started with in one click; the rest are under 更多角色. */
export const COMMON_ROLES = ['composer', 'lyricist', 'arranger', 'vocals', 'performer', 'illustrator', 'mixing_engineer', 'mastering_engineer']

/** The byline block's credits of one role, in order. */
export const bylineCredits = (doc: AlbumDocument, role: string) => byOrder(doc.credits).filter(row => isBylineCredit(row) && row.role === role)

// ---- lines by role ----------------------------------------------------------------------------

export interface CreditLinePerson {
  person: CreditPerson
  rows: AlbumCreditRow[]
}

/** People who share the same roles on the same tracks: one line of the by-role view. */
export interface CreditLine {
  /** The first row's id: steady while the line's people are edited */
  key: string
  roles: string[]
  /** In tracklist order; empty for the whole album */
  trackIds: RowId[]
  people: CreditLinePerson[]
  rows: AlbumCreditRow[]
}

/**
 * The credits outside the byline block as lines: first each person's tracks for each role, then a person's roles
 * on the same tracks together ("作曲・編曲"), then the people with the same roles on the same tracks. In the
 * dictionary's role order, then by first track.
 */
export function creditLines(doc: AlbumDocument, roleOrder: (role: string) => number): CreditLine[] {
  const position = new Map(orderedTracks(doc).map((track, index) => [String(track.id), index]))
  const at = (id: RowId) => position.get(String(id)) ?? Number.MAX_SAFE_INTEGER

  const byRole = new Map<string, { person: CreditPerson, role: string, trackIds: RowId[], rows: AlbumCreditRow[] }>()
  for (const row of byOrder(doc.credits)) {
    if (isBylineCredit(row)) continue
    const person = personOf(row)
    const key = JSON.stringify([personKey(person), row.role, row.track_id === null])
    const entry = byRole.get(key) ?? { person, role: row.role, trackIds: [], rows: [] }
    byRole.set(key, entry)
    entry.rows.push(row)
    if (row.track_id !== null) entry.trackIds.push(row.track_id)
  }

  const byTracks = new Map<string, { person: CreditPerson, trackIds: RowId[], roles: string[], rows: AlbumCreditRow[] }>()
  for (const entry of byRole.values()) {
    const trackIds = [...entry.trackIds].sort((a, b) => at(a) - at(b))
    const key = JSON.stringify([personKey(entry.person), trackIds.map(String)])
    const item = byTracks.get(key) ?? { person: entry.person, trackIds, roles: [], rows: [] }
    byTracks.set(key, item)
    item.roles.push(entry.role)
    item.rows.push(...entry.rows)
  }

  const lines = new Map<string, CreditLine>()
  for (const item of byTracks.values()) {
    const roles = [...item.roles].sort((a, b) => roleOrder(a) - roleOrder(b))
    const key = JSON.stringify([roles, item.trackIds.map(String)])
    const line = lines.get(key) ?? { key: String(item.rows[0]!.id), roles, trackIds: item.trackIds, people: [], rows: [] }
    lines.set(key, line)
    line.people.push({ person: item.person, rows: item.rows })
    line.rows.push(...item.rows)
  }

  const first = (line: CreditLine) => line.trackIds.length ? at(line.trackIds[0]!) : -1
  const order = (line: CreditLine) => Math.min(...line.rows.map(row => row.sort_order ?? 0))
  return [...lines.values()].sort((a, b) => roleOrder(a.roles[0]!) - roleOrder(b.roles[0]!) || first(a) - first(b) || order(a) - order(b))
}

const scopeOf = (trackIds: RowId[]) => trackIds.length ? trackIds : null

/** Credits each person with each role, on the tracks, or on the whole album when there are none. */
export function addCreditLine(doc: AlbumDocument, roles: string[], people: CreditPerson[], trackIds: RowId[]) {
  for (const person of people) {
    for (const role of roles) addCredit(doc, { ...person, role }, scopeOf(trackIds))
  }
}

export function setLineRoles(doc: AlbumDocument, line: CreditLine, roles: string[]) {
  removeCredits(doc, line.rows.filter(row => !roles.includes(row.role)))
  addCreditLine(doc, roles.filter(role => !line.roles.includes(role)), line.people.map(entry => entry.person), line.trackIds)
}

/** Moves the line onto these tracks, or onto the whole album when there are none. */
export function setLineTracks(doc: AlbumDocument, line: CreditLine, trackIds: RowId[]) {
  const wanted = new Set(trackIds.map(String))
  removeCredits(doc, line.rows.filter(row => trackIds.length ? row.track_id === null || !wanted.has(String(row.track_id)) : row.track_id !== null))
  for (const { person, rows } of line.people) {
    for (const role of line.roles) {
      const have = new Set(rows.filter(row => row.role === role).map(row => String(row.track_id)))
      const missing = trackIds.length ? trackIds.filter(id => !have.has(String(id))) : have.has('null') ? [] : [null]
      if (!missing.length) continue
      addCredit(doc, { ...person, role }, missing[0] === null ? null : missing as RowId[])
    }
  }
}

export function addLinePerson(doc: AlbumDocument, line: CreditLine, person: CreditPerson) {
  addCreditLine(doc, line.roles, [person], line.trackIds)
}

export function removeLinePerson(doc: AlbumDocument, line: CreditLine, person: CreditPerson) {
  removeCredits(doc, line.rows.filter(isPerson(person)))
}

/** Changes how a person of the line is credited: the printed name, the detail, or the artist it points at. */
export function updateLinePerson(doc: AlbumDocument, line: CreditLine, person: CreditPerson, patch: Partial<CreditPerson>) {
  patchCredits(doc, line.rows.filter(isPerson(person)), patch)
}

export function removeCreditLine(doc: AlbumDocument, line: CreditLine) {
  removeCredits(doc, line.rows)
}

// ---- lists by track ---------------------------------------------------------------------------

export interface RoleCredits {
  role: string
  rows: AlbumCreditRow[]
}

/** A track's credits (or, with null, the whole album's outside the byline block) by role, in the dictionary's order. */
export function creditsOn(doc: AlbumDocument, trackId: RowId | null, roleOrder: (role: string) => number): RoleCredits[] {
  const roles = new Map<string, AlbumCreditRow[]>()
  for (const row of byOrder(doc.credits)) {
    const here = trackId === null ? row.track_id === null && !isBylineCredit(row) : sameId(row.track_id, trackId)
    if (here) roles.set(row.role, [...(roles.get(row.role) ?? []), row])
  }
  return [...roles].map(([role, rows]) => ({ role, rows })).sort((a, b) => roleOrder(a.role) - roleOrder(b.role))
}

const creditOnTrackKey = (row: AlbumCreditRow) => JSON.stringify([row.role, personKey(personOf(row))])

/** Whether two tracks credit the same people in the same roles. */
export function sameTrackCredits(doc: AlbumDocument, a: RowId, b: RowId) {
  const keys = (id: RowId) => new Set(doc.credits.filter(row => sameId(row.track_id, id)).map(creditOnTrackKey))
  const [left, right] = [keys(a), keys(b)]
  return left.size === right.size && [...left].every(key => right.has(key))
}

/** Makes a track's credits the same as another's: what the other has is added, what it lacks is removed. */
export function copyTrackCredits(doc: AlbumDocument, fromId: RowId, toId: RowId) {
  const source = byOrder(doc.credits).filter(row => sameId(row.track_id, fromId))
  const target = doc.credits.filter(row => sameId(row.track_id, toId))
  const wanted = new Set(source.map(creditOnTrackKey))
  removeCredits(doc, target.filter(row => !wanted.has(creditOnTrackKey(row))))
  const have = new Set(target.map(creditOnTrackKey))
  for (const row of source) {
    if (!have.has(creditOnTrackKey(row))) addCredit(doc, { ...personOf(row), role: row.role }, [toId])
  }
}
