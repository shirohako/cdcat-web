import { ALBUM_REF } from '~/composables/useAlbumEditor'
import type { DraftItem } from '~/composables/useRevisionDraft'
import type { AlbumDocument, RowId } from '~/types/document'
import type { HarvestCandidateDetail } from '~/types/harvest'
import { addCredit, addDisc, addProduct, addTrack, emptyAlbumDocument, setTitleIn } from '~/utils/albumDocument'
import { newKey, newRef } from '~/utils/documentKeys'
import { DRAFT_REF, draftPeople } from '~/utils/harvestPeople'

/** Album types the editor knows, by the kind a source gave. */
const TYPES: Record<string, string> = { album: 'album', single: 'single', ep: 'ep', compilation: 'compilation', drama: 'drama' }

/** Links that say nothing about the album itself (a post on X). */
const SKIPPED_PROVIDERS = new Set(['twitter'])

/** "2026-04" (month precision) → "2026-04-01"; the editor stores full dates with a precision. */
const fullDate = (date: string) => date.length === 4 ? `${date}-01-01` : date.length === 7 ? `${date}-01` : date

/**
 * The album draft a harvest candidate starts as in the review page (docs/harvest/README.md#审核):
 * title and names, release date and event (the suggested first release and the sources' earliest
 * date), the description of the highest-priority source that has one, the circle as
 * album artist, the tracklist, the edition's catalog number and price, credits and links. The circle
 * and the credited names are linked or created as the server suggests (utils/harvestPeople); the
 * names left to the reviewer stay printed names. The cover is picked by the reviewer, because only
 * a picked image is stored.
 */
export function buildHarvestDraft(detail: HarvestCandidateDetail): { items: DraftItem[], summary: string, sources: string[] } {
  const { candidate, event } = detail
  const merged = candidate.merged
  const doc: AlbumDocument = emptyAlbumDocument()
  const artists: DraftItem[] = []
  const people = draftPeople(detail.people ?? [], detail.circle_match ?? null,
    id => (detail.references.artist?.[String(id)] as { name?: string } | undefined)?.name,
    (document) => {
      const ref = newRef(DRAFT_REF)
      artists.push({ ref, resource_type: 'artist', action: 'create', document: JSON.parse(JSON.stringify(document)) as Record<string, unknown> })
      return `@${ref}`
    })
  doc.title = merged.title.value ?? candidate.title
  doc.type = TYPES[merged.kind_hint ?? ''] ?? 'album'
  if (merged.release.date) {
    doc.release_date = fullDate(merged.release.date)
    doc.release_date_precision = merged.release.precision ?? 'day'
  }
  doc.release_event_id = event?.id ?? null
  doc.is_adult = candidate.is_adult
  doc.description = merged.descriptions[0]?.text.trim() || null
  for (const title of merged.titles) {
    if (title.kind === 'official' && title.title === doc.title) continue
    setTitleIn(doc, 'titles', null, title.locale, title.kind, title.title)
  }
  const circle = detail.circle_match ? people.circle() : candidate.artist_id
  if (circle) doc.artists = [{ id: newKey('aa'), artist_id: circle, credited_as: null, join_phrase: null }]

  const digital = merged.media.length > 0 && merged.media.every(medium => medium === 'digital')
  const first = doc.discs[0]!
  first.format = digital ? 'digital' : 'cd'
  const discs = new Map<number, RowId>([[1, first.id]])
  const positions = [...new Set([...merged.tracklist.discs.map(disc => disc.position), ...merged.tracklist.tracks.map(track => track.disc)])].sort((a, b) => a - b)
  for (const position of positions) {
    if (!discs.has(position)) discs.set(position, addDisc(doc, { position, format: first.format }).id)
    const title = merged.tracklist.discs.find(disc => disc.position === position)?.title
    if (title) doc.discs.find(disc => disc.id === discs.get(position))!.title = title
  }
  const tracks = new Map<string, RowId>()
  for (const track of merged.tracklist.tracks) {
    const row = addTrack(doc, discs.get(track.disc) ?? first.id, { track_number: track.number, number_label: track.numberLabel, title: track.title, duration: track.duration })
    tracks.set(`${track.disc}-${track.number}`, row.id)
  }

  const numbers = merged.catalog_numbers.value ?? []
  const price = merged.price.value
  if (numbers.length || merged.barcode.value || price) {
    addProduct(doc, {
      catalog_number: numbers.join(' / ') || null,
      barcode: merged.barcode.value,
      price: price ? String(price.amount) : null,
      currency: price?.currency ?? null,
      region: price?.currency === 'JPY' ? 'JP' : null,
    })
  }

  for (const credit of merged.credits) {
    if (!credit.role) continue
    const trackId = credit.track ? tracks.get(`${credit.track.disc}-${credit.track.number}`) : null
    if (credit.track && !trackId) continue
    const who = people.credit(credit.name) ?? { artist_id: credit.artist_id, credited_as: credit.artist_id ? null : credit.name }
    addCredit(doc, { ...who, role: credit.role, detail: credit.detail }, trackId ? [trackId] : null)
  }

  const seen = new Set<string>()
  for (const link of merged.links) {
    if (!link.provider_id || SKIPPED_PROVIDERS.has(link.provider ?? '') || seen.has(link.url)) continue
    seen.add(link.url)
    doc.links.push({ id: newKey('l'), link_provider_id: link.provider_id, url: link.url })
  }

  return {
    items: [{ ref: ALBUM_REF, resource_type: 'album', action: 'create', document: doc as unknown as Record<string, unknown> }, ...artists],
    summary: event ? `采集：${event.name}「${doc.title}」` : `采集：「${doc.title}」`,
    sources: [...new Set(merged.sources.map(source => source.url))].slice(0, 20),
  }
}
