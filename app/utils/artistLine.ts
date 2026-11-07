// A credit can belong to another credit of the same track (parent_id): a 客串 to the one it is printed after, so in
// "Xeudo Code & Xeno feat. eili" eili is Xeno's. Pages show each credit with the 客串 that belong to it, "Xeno feat.
// eili", one tag in the tracklist. × & and the like are not kept: names are simply listed. On a track every 客串 has
// one (the backend gives it, App\Services\Catalog\Aggregates\AlbumSchema::parents); parentOf gives the same answer
// while the editor's document is not saved yet. Two artists of a track stay two artists, but a word printed between
// them (join_phrase, on the later one) shows them as one: "awfuless meets PODA". See docs/catalog/README.md#署名行.

type Id = number | string

/** The 客串 role: its people belong to another credit of the track rather than leading it themselves. */
export const FEATURING_ROLE = 'featuring'

/** The role a track's own artists are credited in; their order is printed, and a word can join two (join_phrase). */
export const ARTIST_ROLE = 'artist'

export interface ParentCredit {
  id: Id
  track_id?: Id | null
  parent_id?: Id | null
  role: string
  sort_order?: number
}

const same = (a: Id | null | undefined, b: Id | null | undefined) => a != null && b != null && String(a) === String(b)

/** The credits of the track (or album) another one could belong to: not a 客串, not belonging to one, not itself. */
export function parentCandidates<T extends ParentCredit>(credit: T, credits: readonly T[]): T[] {
  return credits.filter(other => String(other.track_id ?? '') === String(credit.track_id ?? '') && !same(other.id, credit.id)
    && other.role !== FEATURING_ROLE && other.parent_id == null)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
}

/**
 * The credit one belongs to among `credits`: its parent_id when that is a credit of the same track; for a 客串 on a
 * track without one, the nearest candidate before it, else the last ("Xeudo Code & Xeno feat. eili": Xeno); else null.
 */
export function parentOf<T extends ParentCredit>(credit: T, credits: readonly T[]): T | null {
  const own = credits.find(other => same(other.id, credit.parent_id))
  if (own && !same(own.id, credit.id) && String(own.track_id ?? '') === String(credit.track_id ?? '')) return own
  if (credit.role !== FEATURING_ROLE || credit.track_id == null) return null
  const hosts = parentCandidates(credit, credits)
  return hosts.findLast(host => (host.sort_order ?? 0) < (credit.sort_order ?? 0)) ?? hosts.at(-1) ?? null
}

export interface WithGuests<T> {
  item: T
  guests: T[]
}

/** `items` each with the `guests` that belong to it, in order; the guests none of them takes are `left`. */
export function attachGuests<T>(items: readonly T[], guests: readonly T[], id: (item: T) => Id | null, parent: (item: T) => Id | null | undefined) {
  const lines = items.map(item => ({ item, guests: [] as T[] }))
  const left: T[] = []
  for (const guest of guests) {
    const host = lines.find(line => same(id(line.item), parent(guest)))
    if (host) host.guests.push(guest)
    else left.push(guest)
  }
  return { lines, left }
}

/** As text: "Xeudo Code, Xeno feat. eili", the guests no name takes after them all ("A, B feat. C"). */
export function lineText<T>(lines: readonly WithGuests<T>[], left: readonly T[], name: (item: T) => string): string {
  const names = (items: readonly T[]) => items.map(name).join(', ')
  const text = lines.map(line => line.guests.length ? `${name(line.item)} feat. ${names(line.guests)}` : name(line.item)).join(', ')
  if (!left.length || !text) return text || names(left)
  return `${text}${lines.at(-1)?.guests.length ? ', ' : ' feat. '}${names(left)}`
}

/**
 * A credited name around the artist's own name in it, for linking only that part: "void (Mournfinale)" by void is
 * ['', 'void', ' (Mournfinale)']. Matched ignoring case; null when the name doesn't hold it, or is exactly it.
 */
export function nameParts(name: string, artistName: string | null | undefined): [string, string, string] | null {
  if (!artistName || name === artistName) return null
  // Lower-casing can change a string's length (İ); then only the exact spelling is looked for
  const folds = name.toLowerCase().length === name.length && artistName.toLowerCase().length === artistName.length
  const at = folds ? name.toLowerCase().indexOf(artistName.toLowerCase()) : name.indexOf(artistName)
  if (at < 0) return null
  return [name.slice(0, at), name.slice(at, at + artistName.length), name.slice(at + artistName.length)]
}
