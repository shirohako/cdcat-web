// The album editor's ways of listing credits (docs/catalog/README.md#制作人员), over the document's
// one-row-per-person-role-track credits: the byline block (the whole album's 署名与发行), lines by role
// (roles × people × tracks, the way a booklet prints them) and lists by track. The views are worked out
// again after every change, so nothing here is kept between edits; the edits keep row ids where they can,
// so the change preview shows changes rather than removals and additions.

import type { AggregateRef, AlbumDocument, RowId } from '~/types/document'
import { RELEASE_ROLES } from '../types/album'
import { addCredit, canHaveRoleLabel, orderedTracks, patchCredits, removeCredits, trackArtists, type AlbumCreditRow } from './albumDocument'
import { ARTIST_ROLE, parentOf } from './artistLine'
import { byOrder, sameId } from './documentRows'

/**
 * Who a credit names: an artist (an id, or "@ref" of one new in this revision) or only a printed name, the printed job
 * title and the detail. `join_phrase` only comes with a change to a row: it says where on its track an artist stands, not who it is.
 */
export interface CreditPerson {
  artist_id: AggregateRef | null
  credited_as: string | null
  role_label?: string | null
  join_phrase?: string | null
  detail: string | null
}

export const personOf = (row: AlbumCreditRow): CreditPerson => ({ artist_id: row.artist_id, credited_as: row.credited_as || null, role_label: row.role_label || null, detail: row.detail || null })
/** Who a credit is about; a note doesn't make it someone else, so a note on one track doesn't split a line. */
export const personKey = (person: CreditPerson) => JSON.stringify([person.artist_id, person.credited_as || null, person.role_label || null])
const isPerson = (person: CreditPerson) => (row: AlbumCreditRow) => personKey(personOf(row)) === personKey(person)

/** The roles that decide the names under an album's title, which the byline block edits. */
export const BYLINE_ROLES: readonly string[] = ['artist', 'publisher']

/** The whole album's credits in the byline block; everything else is in the lines or the track lists. */
export const isBylineCredit = (row: AlbumCreditRow) => row.track_id === null && BYLINE_ROLES.includes(row.role)

/** Roles only the whole album can have (发行、厂牌 …), so a track never offers them. */
export const ALBUM_ONLY_ROLES: readonly string[] = RELEASE_ROLES.filter(role => role !== 'artist')

/** The roles a line can be started with in one click; the rest are under 更多角色. */
export const COMMON_ROLES = ['composer', 'lyricist', 'arranger', 'vocals', 'performer', 'illustrator', 'mixing', 'mastering', 'other']

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
 * on the same tracks together ("作曲・編曲"), then the people with the same roles on the same tracks. A job title
 * belongs to one role, so a credit with one takes no other role into its line. In the dictionary's role order, then by
 * first track.
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
    entry.person.detail ||= person.detail
    entry.rows.push(row)
    if (row.track_id !== null) entry.trackIds.push(row.track_id)
  }

  const byTracks = new Map<string, { person: CreditPerson, trackIds: RowId[], roles: string[], rows: AlbumCreditRow[] }>()
  for (const entry of byRole.values()) {
    const trackIds = [...entry.trackIds].sort((a, b) => at(a) - at(b))
    const key = JSON.stringify([personKey(entry.person), trackIds.map(String), entry.person.role_label ? entry.role : null])
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

/** A job title goes along when a line's one role is swapped for another; a role added beside it starts without one. */
export function setLineRoles(doc: AlbumDocument, line: CreditLine, roles: string[]) {
  const swapped = line.roles.length === 1 && roles.length === 1 && canHaveRoleLabel(roles[0]!)
  removeCredits(doc, line.rows.filter(row => !roles.includes(row.role)))
  addCreditLine(doc, roles.filter(role => !line.roles.includes(role)), line.people.map(entry => ({ ...entry.person, role_label: swapped ? entry.person.role_label : null })), line.trackIds)
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

/** Changes how a person of the line is credited: the printed name, the job title, the detail, or the artist it points at. */
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

/** A credit with the one it belongs to, so that "eili, Xeno's 客串" differs from "eili, Xeudo Code's". */
const creditWithParentKey = (row: AlbumCreditRow, rows: AlbumCreditRow[]) => {
  const parent = parentOf(row, rows)
  return JSON.stringify([creditOnTrackKey(row), parent ? creditOnTrackKey(parent) : null, row.join_phrase || null, row.detail || null])
}

/** Whether two tracks credit the same people in the same roles with the same notes, each 客串 with the same credit, the artists in the same order and joined by the same words. */
export function sameTrackCredits(doc: AlbumDocument, a: RowId, b: RowId) {
  const keys = (id: RowId) => {
    const rows = doc.credits.filter(row => sameId(row.track_id, id))
    return new Set(rows.map(row => creditWithParentKey(row, rows)))
  }
  const [left, right] = [keys(a), keys(b)]
  const order = (id: RowId) => JSON.stringify(trackArtists(doc, id).map(creditOnTrackKey))
  return left.size === right.size && [...left].every(key => right.has(key)) && order(a) === order(b)
}

/**
 * Makes a track's credits the same as another's: what the other has is added, what it lacks is removed, each has the
 * same note and belongs to the same credit as there, and the artists stand in the same order with the same words between them.
 */
export function copyTrackCredits(doc: AlbumDocument, fromId: RowId, toId: RowId) {
  const source = byOrder(doc.credits).filter(row => sameId(row.track_id, fromId))
  const target = doc.credits.filter(row => sameId(row.track_id, toId))
  const wanted = new Set(source.map(creditOnTrackKey))
  removeCredits(doc, target.filter(row => !wanted.has(creditOnTrackKey(row))))
  const have = new Set(target.map(creditOnTrackKey))
  for (const row of source) {
    if (!have.has(creditOnTrackKey(row))) addCredit(doc, { ...personOf(row), role: row.role }, [toId])
  }
  const copies = new Map(doc.credits.filter(row => sameId(row.track_id, toId)).map(row => [creditOnTrackKey(row), row]))
  for (const row of source) {
    const parent = parentOf(row, source)
    const copy = copies.get(creditOnTrackKey(row))
    if (copy) Object.assign(copy, { parent_id: parent ? copies.get(creditOnTrackKey(parent))?.id ?? null : null, detail: row.detail })
  }
  const places = trackArtists(doc, toId).map(row => row.sort_order)
  source.filter(row => row.role === ARTIST_ROLE).forEach((row, index) => {
    const copy = copies.get(creditOnTrackKey(row))
    if (copy) Object.assign(copy, { sort_order: places[index], join_phrase: row.join_phrase ?? null })
  })
}
