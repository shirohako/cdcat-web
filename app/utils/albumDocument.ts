// Operations on an album document (docs/catalog/editing.md#各类文档) that keep it valid while it is
// edited: discs and tracks keep unique numbers, editions tick the discs they contain, and rows that
// point at a removed disc, track, edition or bonus go with it. Pure functions: pass the reactive
// document and they mutate it in place.

import type { AggregateRef, AlbumDocument, RowId, TitleRow } from '~/types/document'
import type { ParsedDisc } from './tracklistParser'
import { newKey } from './documentKeys'
import { byOrder, nextOrder, sameId } from './documentRows'

export type AlbumDiscRow = AlbumDocument['discs'][number]
export type AlbumTrackRow = AlbumDocument['tracks'][number]
export type AlbumProductRow = AlbumDocument['products'][number]
export type AlbumBonusRow = AlbumDocument['bonuses'][number]
export type AlbumImageRow = AlbumDocument['images'][number]
export type AlbumCreditRow = AlbumDocument['credits'][number]
export type AlbumOriginalRow = AlbumDocument['track_originals'][number]
export type TitleCollection = 'titles' | 'disc_titles' | 'track_titles'

/** A new album: one CD and nothing else. The server adds a default edition when there is none. */
export const emptyAlbumDocument = (): AlbumDocument => ({
  title: '',
  slug: null,
  type: null,
  categories: [],
  release_date: null,
  release_date_precision: 'day',
  release_event_id: null,
  description: null,
  is_adult: false,
  banner_url: null,
  titles: [],
  artists: [],
  labels: [],
  products: [],
  bonuses: [],
  discs: [{ id: newKey('d'), position: 1, title: null, format: 'cd', bonus_id: null }],
  disc_titles: [],
  tracks: [],
  track_titles: [],
  track_originals: [],
  disc_tocs: [],
  credits: [],
  images: [],
  attributes: [],
  track_attributes: [],
  image_attributes: [],
  links: [],
  entries: [],
})

/** Brings a document kept in a draft up to date: tracks lose `work_id`, and `track_originals` exists. */
export function upgradeAlbumDocument(doc: AlbumDocument) {
  for (const track of doc.tracks as Array<AlbumDocument['tracks'][number] & { work_id?: unknown }>) delete track.work_id
  doc.track_originals ??= []
}

// ---- discs and tracks -------------------------------------------------------------------------

export const sortedDiscs = (doc: AlbumDocument) => [...doc.discs].sort((a, b) => a.position - b.position)
export const mainDiscs = (doc: AlbumDocument) => sortedDiscs(doc).filter(disc => disc.bonus_id === null)
export const tracksOn = (doc: AlbumDocument, discId: RowId) =>
  doc.tracks.filter(track => sameId(track.disc_id, discId)).sort((a, b) => a.track_number - b.track_number)
export const orderedTracks = (doc: AlbumDocument) => sortedDiscs(doc).flatMap(disc => tracksOn(doc, disc.id))
export const findDisc = (doc: AlbumDocument, id: RowId | null | undefined) => doc.discs.find(disc => sameId(disc.id, id)) ?? null
export const findTrack = (doc: AlbumDocument, id: RowId | null | undefined) => doc.tracks.find(track => sameId(track.id, id)) ?? null

const tickEverywhere = (doc: AlbumDocument, discId: RowId) => {
  for (const product of doc.products) {
    if (!product.disc_ids.some(id => sameId(id, discId))) product.disc_ids.push(discId)
  }
}
const untickEverywhere = (doc: AlbumDocument, discId: RowId) => {
  for (const product of doc.products) product.disc_ids = product.disc_ids.filter(id => !sameId(id, discId))
}

/** Adds a disc after the last one, in the last disc's format; a main disc is ticked in every edition. */
export function addDisc(doc: AlbumDocument, fields: Partial<AlbumDiscRow> = {}): AlbumDiscRow {
  const last = sortedDiscs(doc).at(-1)
  doc.discs.push({ id: newKey('d'), position: (last?.position ?? 0) + 1, title: null, format: last?.format ?? 'cd', bonus_id: null, ...fields })
  const disc = doc.discs[doc.discs.length - 1]!
  if (disc.bonus_id === null) tickEverywhere(doc, disc.id)
  return disc
}

/** Removes a disc with its tracks, names and TOCs; images of the disc stay on the album. Later discs move up. */
export function removeDisc(doc: AlbumDocument, discId: RowId) {
  removeTrackRows(doc, new Set(tracksOn(doc, discId).map(track => String(track.id))))
  doc.discs = doc.discs.filter(disc => !sameId(disc.id, discId))
  doc.disc_titles = doc.disc_titles.filter(row => !sameId(row.disc_id, discId))
  doc.disc_tocs = doc.disc_tocs.filter(row => !sameId(row.disc_id, discId))
  untickEverywhere(doc, discId)
  for (const image of doc.images) {
    if (sameId(image.disc_id, discId)) image.disc_id = null
  }
  sortedDiscs(doc).forEach((disc, index) => { disc.position = index + 1 })
}

export function moveDisc(doc: AlbumDocument, discId: RowId, delta: number) {
  const discs = sortedDiscs(doc)
  const index = discs.findIndex(disc => sameId(disc.id, discId))
  const disc = discs[index]
  const other = discs[index + delta]
  if (!disc || !other) return
  ;[disc.position, other.position] = [other.position, disc.position]
}

/** Makes a disc part of a bonus (no edition contains it) or a main disc again (every edition does). */
export function setDiscBonus(doc: AlbumDocument, discId: RowId, bonusId: RowId | null) {
  const disc = findDisc(doc, discId)
  if (!disc) return
  disc.bonus_id = bonusId
  if (bonusId === null) tickEverywhere(doc, discId)
  else untickEverywhere(doc, discId)
}

export function addTrack(doc: AlbumDocument, discId: RowId, fields: Partial<AlbumTrackRow> = {}): AlbumTrackRow {
  const last = tracksOn(doc, discId).at(-1)
  doc.tracks.push({
    id: newKey('t'), disc_id: discId, track_number: (last?.track_number ?? 0) + 1, number_label: null, title: '',
    duration: null, is_instrumental: false, isrc: null, ...fields,
  })
  return doc.tracks[doc.tracks.length - 1]!
}

/** Removes tracks and what hangs on them: names, credits, details and 原曲, including other tracks' 原曲 pointing at them. */
function removeTrackRows(doc: AlbumDocument, ids: Set<string>) {
  if (!ids.size) return
  doc.tracks = doc.tracks.filter(track => !ids.has(String(track.id)))
  doc.track_titles = doc.track_titles.filter(row => !ids.has(String(row.track_id)))
  doc.track_attributes = doc.track_attributes.filter(row => !ids.has(String(row.track_id)))
  doc.track_originals = doc.track_originals.filter(row => !ids.has(String(row.track_id)) && !ids.has(String(row.original_track_id)))
  doc.credits = doc.credits.filter(row => row.track_id === null || !ids.has(String(row.track_id)))
}

/** Tracks numbered 1..n stay 1..n after one leaves the disc; other numberings are left alone. */
const compact = (doc: AlbumDocument, discId: RowId, before: number[]) => {
  if (before.every((number, index) => number === index + 1)) {
    tracksOn(doc, discId).forEach((track, index) => { track.track_number = index + 1 })
  }
}

export function removeTrack(doc: AlbumDocument, trackId: RowId) {
  const track = findTrack(doc, trackId)
  if (!track) return
  const discId = track.disc_id
  const before = tracksOn(doc, discId).map(item => item.track_number)
  removeTrackRows(doc, new Set([String(trackId)]))
  compact(doc, discId, before)
}

/** Swaps a track's number with its neighbour's. */
export function moveTrack(doc: AlbumDocument, trackId: RowId, delta: number) {
  const track = findTrack(doc, trackId)
  if (!track) return
  const tracks = tracksOn(doc, track.disc_id)
  const other = tracks[tracks.findIndex(item => sameId(item.id, trackId)) + delta]
  if (!other) return
  ;[track.track_number, other.track_number] = [other.track_number, track.track_number]
}

/** Moves a track to the end of another disc. */
export function moveTrackToDisc(doc: AlbumDocument, trackId: RowId, discId: RowId) {
  const track = findTrack(doc, trackId)
  if (!track || sameId(track.disc_id, discId)) return
  const from = track.disc_id
  const before = tracksOn(doc, from).map(item => item.track_number)
  track.track_number = (tracksOn(doc, discId).at(-1)?.track_number ?? 0) + 1
  track.disc_id = discId
  compact(doc, from, before)
}

/**
 * Applies a pasted tracklist. `update` matches tracks by disc and number: existing tracks get the
 * pasted title and duration, missing ones are added, nothing is removed. `append` adds every pasted
 * track after the tracks already on its disc. Discs that do not exist yet are added.
 */
export function importTracklist(doc: AlbumDocument, parsed: ParsedDisc[], mode: 'update' | 'append' = 'update') {
  let added = 0
  let updated = 0
  for (const parsedDisc of parsed) {
    const disc = sortedDiscs(doc).find(item => item.position === parsedDisc.position) ?? addDisc(doc, { position: parsedDisc.position })
    if (parsedDisc.title && !disc.title) disc.title = parsedDisc.title
    const offset = mode === 'append' ? (tracksOn(doc, disc.id).at(-1)?.track_number ?? 0) : 0
    for (const parsedTrack of parsedDisc.tracks) {
      const trackNumber = parsedTrack.track_number + offset
      const existing = mode === 'update' ? tracksOn(doc, disc.id).find(track => track.track_number === trackNumber) : undefined
      if (!existing) {
        addTrack(doc, disc.id, { track_number: trackNumber, title: parsedTrack.title, duration: parsedTrack.duration, number_label: parsedTrack.number_label })
        added++
        continue
      }
      const before = JSON.stringify([existing.title, existing.duration, existing.number_label])
      existing.title = parsedTrack.title
      if (parsedTrack.duration !== null) existing.duration = parsedTrack.duration
      if (parsedTrack.number_label) existing.number_label = parsedTrack.number_label
      if (JSON.stringify([existing.title, existing.duration, existing.number_label]) !== before) updated++
    }
  }
  return { added, updated }
}

// ---- editions and bonuses ---------------------------------------------------------------------

export const sortedProducts = (doc: AlbumDocument) => byOrder(doc.products)

/** A new edition with every main disc; digital when all of them are digital. */
/** A new edition with every main disc, not yet on the album. */
export function blankProduct(doc: AlbumDocument, fields: Partial<AlbumProductRow> = {}): AlbumProductRow {
  const discs = mainDiscs(doc)
  return {
    id: newKey('p'), name: null, edition_type: 'regular',
    medium: discs.length && discs.every(disc => disc.format === 'digital') ? 'digital' : 'physical',
    limited_rule: null, limited_name: null, catalog_number: null, barcode: null, release_date: null, release_date_precision: 'day',
    region: null, price: null, currency: null, is_hires: false, is_available: true, sort_order: nextOrder(doc.products),
    disc_ids: discs.map(disc => disc.id), ...fields,
  }
}

export function addProduct(doc: AlbumDocument, fields: Partial<AlbumProductRow> = {}): AlbumProductRow {
  doc.products.push(blankProduct(doc, fields))
  return doc.products[doc.products.length - 1]!
}

/** The edition the album's catalog number comes from; added on demand. */
export const firstProduct = (doc: AlbumDocument, create = false) => sortedProducts(doc)[0] ?? (create ? addProduct(doc) : null)

/** Removes an edition; discs only it contained move to the first remaining edition. */
export function removeProduct(doc: AlbumDocument, productId: RowId) {
  doc.products = doc.products.filter(product => !sameId(product.id, productId))
  for (const bonus of doc.bonuses) bonus.product_ids = bonus.product_ids.filter(id => !sameId(id, productId))
  for (const image of doc.images) {
    if (sameId(image.product_id, productId)) image.product_id = null
  }
  const first = firstProduct(doc)
  if (!first) return
  for (const disc of untickedDiscs(doc)) first.disc_ids.push(disc.id)
}

export function setProductDisc(product: AlbumProductRow, discId: RowId, on: boolean) {
  const has = product.disc_ids.some(id => sameId(id, discId))
  if (on && !has) product.disc_ids.push(discId)
  if (!on && has) product.disc_ids = product.disc_ids.filter(id => !sameId(id, discId))
}

/** Main discs no edition contains (an error once the album has editions). */
export const untickedDiscs = (doc: AlbumDocument) => doc.products.length
  ? mainDiscs(doc).filter(disc => !doc.products.some(product => product.disc_ids.some(id => sameId(id, disc.id))))
  : []

/** A new bonus, not yet on the album. */
export const blankBonus = (doc: AlbumDocument, fields: Partial<AlbumBonusRow> = {}): AlbumBonusRow => ({
  id: newKey('b'), name: '', type: 'other', description: null, is_digital: false, shop: null, availability: null,
  note: null, event_id: null, sort_order: nextOrder(doc.bonuses), product_ids: [], ...fields,
})

export function addBonus(doc: AlbumDocument, fields: Partial<AlbumBonusRow> = {}): AlbumBonusRow {
  doc.bonuses.push(blankBonus(doc, fields))
  return doc.bonuses[doc.bonuses.length - 1]!
}

/** Removes a bonus; its discs become main discs of every edition and its images stay on the album. */
export function removeBonus(doc: AlbumDocument, bonusId: RowId) {
  for (const disc of doc.discs) {
    if (sameId(disc.bonus_id, bonusId)) setDiscBonus(doc, disc.id, null)
  }
  for (const image of doc.images) {
    if (sameId(image.bonus_id, bonusId)) image.bonus_id = null
  }
  doc.bonuses = doc.bonuses.filter(bonus => !sameId(bonus.id, bonusId))
}

// ---- images -----------------------------------------------------------------------------------

export const isUnscoped = (image: AlbumImageRow) => image.product_id === null && image.bonus_id === null && image.disc_id === null
export const coverOf = (doc: AlbumDocument) => doc.images.find(image => image.kind === 'cover' && isUnscoped(image)) ?? null

/** Uses an uploaded image as the album cover, replacing the current one. */
export function setCover(doc: AlbumDocument, imageId: number) {
  const cover = coverOf(doc)
  if (cover) {
    cover.image_id = imageId
    return cover
  }
  for (const image of doc.images) image.sort_order = (image.sort_order ?? 0) + 1
  doc.images.push({ id: newKey('i'), image_id: imageId, kind: 'cover', label: null, caption: null, product_id: null, bonus_id: null, disc_id: null, sort_order: 0 })
  return doc.images[doc.images.length - 1]!
}

export function addImage(doc: AlbumDocument, imageId: number, fields: Partial<AlbumImageRow> = {}): AlbumImageRow {
  doc.images.push({
    id: newKey('i'), image_id: imageId, kind: 'other', label: null, caption: null, product_id: null, bonus_id: null, disc_id: null,
    sort_order: nextOrder(doc.images), ...fields,
  })
  return doc.images[doc.images.length - 1]!
}

export function removeImage(doc: AlbumDocument, rowId: RowId) {
  doc.images = doc.images.filter(image => !sameId(image.id, rowId))
  doc.image_attributes = doc.image_attributes.filter(row => !sameId(row.album_image_id, rowId))
}

// ---- credits ----------------------------------------------------------------------------------

/** Credits with the same person, role and detail, edited as one row with a set of tracks. */
export interface CreditGroup {
  /** Id of the first row: stable while the group's fields are edited */
  key: string
  /** Credited on the whole album rather than on tracks */
  album: boolean
  artist_id: AggregateRef | null
  credited_as: string | null
  role: string
  detail: string | null
  rows: AlbumCreditRow[]
  trackIds: RowId[]
}

const creditKey = (row: AlbumCreditRow) => JSON.stringify([row.track_id === null, row.artist_id, row.credited_as || null, row.role, row.detail || null])

export function creditGroups(doc: AlbumDocument): CreditGroup[] {
  const groups = new Map<string, CreditGroup>()
  for (const row of byOrder(doc.credits)) {
    const key = creditKey(row)
    let group = groups.get(key)
    if (!group) {
      group = { key: String(row.id), album: row.track_id === null, artist_id: row.artist_id, credited_as: row.credited_as, role: row.role, detail: row.detail, rows: [], trackIds: [] }
      groups.set(key, group)
    }
    group.rows.push(row)
    if (row.track_id !== null) group.trackIds.push(row.track_id)
  }
  return [...groups.values()]
}

/** Drops exact duplicates, e.g. after two groups were edited into the same one. */
const dedupeCredits = (doc: AlbumDocument) => {
  const seen = new Set<string>()
  doc.credits = doc.credits.filter((row) => {
    const key = JSON.stringify([row.track_id, row.artist_id, row.credited_as || null, row.role, row.detail || null])
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function updateCreditGroup(doc: AlbumDocument, group: CreditGroup, patch: Partial<Pick<AlbumCreditRow, 'artist_id' | 'credited_as' | 'role' | 'detail'>>) {
  for (const row of group.rows) Object.assign(row, patch)
  Object.assign(group, patch)
  dedupeCredits(doc)
}

/** Track numbers as ranges: "1–3, 5", or "1: 1–3 · 2: 4" on albums with several discs. */
export function trackRanges(doc: AlbumDocument, trackIds: RowId[]): string {
  const has = (id: RowId) => trackIds.some(item => sameId(item, id))
  const discs = sortedDiscs(doc)
  return discs.map((disc) => {
    const tracks = tracksOn(doc, disc.id)
    const ranges: string[] = []
    let start = -1
    tracks.forEach((track, index) => {
      const on = has(track.id)
      if (on && start < 0) start = index
      const endsHere = on && (index === tracks.length - 1 || !has(tracks[index + 1]!.id))
      if (endsHere) {
        const label = (position: number) => tracks[position]!.number_label || String(tracks[position]!.track_number)
        ranges.push(start === index ? label(index) : `${label(start)}–${label(index)}`)
        start = -1
      }
    })
    return ranges.length ? (discs.length > 1 ? `${disc.position}: ${ranges.join(', ')}` : ranges.join(', ')) : ''
  }).filter(Boolean).join(' · ')
}

/** Credits `fields` on the whole album (trackIds null) or on each of the tracks. */
export function addCredit(doc: AlbumDocument, fields: Pick<AlbumCreditRow, 'artist_id' | 'credited_as' | 'role' | 'detail'>, trackIds: RowId[] | null) {
  let order = nextOrder(doc.credits)
  for (const trackId of trackIds ?? [null]) {
    doc.credits.push({ id: newKey('c'), track_id: trackId, ...fields, sort_order: order++ })
  }
  dedupeCredits(doc)
}

export function removeCreditGroup(doc: AlbumDocument, group: CreditGroup) {
  const ids = new Set(group.rows.map(row => String(row.id)))
  doc.credits = doc.credits.filter(row => !ids.has(String(row.id)))
}

/** Sets the tracks of a track-level group: rows of kept tracks keep their ids. */
export function setCreditTracks(doc: AlbumDocument, group: CreditGroup, trackIds: RowId[]) {
  const wanted = new Set(trackIds.map(String))
  const removed = new Set(group.rows.filter(row => row.track_id === null || !wanted.has(String(row.track_id))).map(row => String(row.id)))
  doc.credits = doc.credits.filter(row => !removed.has(String(row.id)))
  const have = new Set(group.rows.filter(row => !removed.has(String(row.id))).map(row => String(row.track_id)))
  const fields = { artist_id: group.artist_id, credited_as: group.credited_as, role: group.role, detail: group.detail }
  const missing = trackIds.filter(id => !have.has(String(id)))
  if (missing.length) addCredit(doc, fields, missing)
}

/** Moves a group between the whole album and tracks; going to tracks credits every track. */
export function setCreditScope(doc: AlbumDocument, group: CreditGroup, album: boolean) {
  if (group.album === album) return
  const fields = { artist_id: group.artist_id, credited_as: group.credited_as, role: group.role, detail: group.detail }
  removeCreditGroup(doc, group)
  addCredit(doc, fields, album ? null : orderedTracks(doc).map(track => track.id))
}

// ---- names in other languages -----------------------------------------------------------------

type TitleOwner = { field: 'disc_id' | 'track_id', id: RowId } | null

const titleRows = (doc: AlbumDocument, collection: TitleCollection) => doc[collection] as Array<TitleRow & Partial<Record<'disc_id' | 'track_id', RowId>>>

const matches = (row: TitleRow & Partial<Record<'disc_id' | 'track_id', RowId>>, owner: TitleOwner, locale: string, kind: string) =>
  row.locale === locale && row.kind === kind && (!owner || sameId(row[owner.field], owner.id))

/** The album's, a disc's or a track's name in one language and kind; '' when there is none. */
export const titleIn = (doc: AlbumDocument, collection: TitleCollection, owner: TitleOwner, locale: string, kind: string) =>
  titleRows(doc, collection).find(row => matches(row, owner, locale, kind))?.title ?? ''

/** Sets that name; a blank value keeps the row while editing and is dropped when saving (pruneAlbumDocument). */
export function setTitleIn(doc: AlbumDocument, collection: TitleCollection, owner: TitleOwner, locale: string, kind: string, value: string) {
  const rows = titleRows(doc, collection)
  const row = rows.find(item => matches(item, owner, locale, kind))
  if (row) {
    row.title = value
    return
  }
  if (!value.trim()) return
  rows.push({ id: newKey('n'), title: value, locale, kind: kind as TitleRow['kind'], sort_order: nextOrder(rows), ...(owner ? { [owner.field]: owner.id } : {}) })
}

// ---- checks -----------------------------------------------------------------------------------

export type RequiredItem = 'title' | 'type' | 'release_date' | 'cover' | 'tracks'

/** What an album needs before it can be submitted (docs/catalog/README.md#必填项). */
export const missingRequired = (doc: AlbumDocument): RequiredItem[] => [
  ...(!doc.title.trim() ? ['title' as const] : []),
  ...(!doc.type ? ['type' as const] : []),
  ...(!doc.release_date ? ['release_date' as const] : []),
  ...(!coverOf(doc) ? ['cover' as const] : []),
  ...(!doc.tracks.some(track => track.title.trim()) ? ['tracks' as const] : []),
]

export type SuggestedItem = 'artists' | 'catalog_number' | 'durations' | 'credits' | 'categories' | 'links'

/** Optional information worth adding (docs/catalog/README.md#必填项); shown as hints, never enforced. */
export const missingSuggested = (doc: AlbumDocument): SuggestedItem[] => [
  ...(!doc.artists.length ? ['artists' as const] : []),
  ...(!doc.products.some(product => product.catalog_number?.trim()) ? ['catalog_number' as const] : []),
  ...(doc.tracks.some(track => track.duration === null) ? ['durations' as const] : []),
  ...(!doc.credits.length ? ['credits' as const] : []),
  ...(!doc.categories.length ? ['categories' as const] : []),
  ...(!doc.links.length ? ['links' as const] : []),
]

const blank = (value: unknown): boolean => value === null || value === undefined || (typeof value === 'string' && !value.trim())
  || (typeof value === 'object' && !Array.isArray(value) && 'date' in (value as object) && blank((value as { date: unknown }).date))

/**
 * A copy without rows left empty in the editor: blank names, links without a URL, details without a
 * value. Drafts saved before fields were dropped still carry them, so they go too: `track_links`, the
 * tracks' `work_id`, and the entries' `character_name` and `episode`.
 */
export function pruneAlbumDocument(doc: AlbumDocument): AlbumDocument {
  const copy = JSON.parse(JSON.stringify(doc)) as AlbumDocument & { track_links?: unknown }
  delete copy.track_links
  for (const track of copy.tracks as Array<Record<string, unknown>>) delete track.work_id
  copy.track_originals = (copy.track_originals ?? []).filter(row => row.original_track_id !== null || !blank(row.original_title))
  for (const row of copy.entries as Array<Record<string, unknown>>) {
    delete row.character_name
    delete row.episode
  }
  copy.titles = copy.titles.filter(row => !blank(row.title))
  copy.disc_titles = copy.disc_titles.filter(row => !blank(row.title))
  copy.track_titles = copy.track_titles.filter(row => !blank(row.title))
  copy.links = copy.links.filter(row => !blank(row.url))
  copy.attributes = copy.attributes.filter(row => !blank(row.value))
  copy.track_attributes = copy.track_attributes.filter(row => !blank(row.value))
  copy.image_attributes = copy.image_attributes.filter(row => !blank(row.value))
  return copy
}
