import type { AlbumDisc } from '~/types/album'

/**
 * The album page's 曲目参与人员: everyone credited on the tracks, grouped by artist (a name-only credit by its name),
 * in the order they first appear in the tracklist. Each person lists their roles in the dictionary's order, a role
 * with its detail (an instrument) apart, with the tracks as ranges: "1–3, 5", per disc when there are several
 * ("Disc 1: 1–3 · Disc 2: 2"), or `all` when it is every track of the album.
 */

export interface TrackPersonRole {
  role: string
  category: string | null
  detail: string | null
  /** The tracks as ranges, or null for every track */
  tracks: string | null
}

export interface TrackPerson {
  key: string
  name: string
  artistId: number | null
  roles: TrackPersonRole[]
}

export function trackPeople(discs: AlbumDisc[], roleOrder: (role: string) => number): TrackPerson[] {
  const ordered = [...discs].sort((a, b) => a.position - b.position)
    .map(disc => ({ disc, tracks: [...disc.tracks].sort((a, b) => a.track_number - b.track_number) }))
  const total = ordered.reduce((sum, item) => sum + item.tracks.length, 0)
  const people = new Map<string, TrackPerson & { tracks: Map<string, { role: TrackPersonRole, ids: Set<number> }> }>()

  for (const { tracks } of ordered) {
    for (const track of tracks) {
      for (const credit of track.credits) {
        const name = credit.artist?.name || credit.credited_as || ''
        if (!name) continue
        const key = credit.artist ? `a:${credit.artist.id}` : `n:${name}`
        const person = people.get(key) ?? { key, name, artistId: credit.artist?.id ?? null, roles: [], tracks: new Map() }
        people.set(key, person)
        const roleKey = JSON.stringify([credit.role, credit.detail || null])
        const entry = person.tracks.get(roleKey) ?? { role: { role: credit.role, category: credit.category ?? null, detail: credit.detail || null, tracks: null }, ids: new Set<number>() }
        person.tracks.set(roleKey, entry)
        entry.ids.add(track.id)
      }
    }
  }

  const label = (track: AlbumDisc['tracks'][number]) => track.number_label || String(track.track_number)
  const ranges = (ids: Set<number>) => {
    if (ids.size === total) return null
    const parts = ordered.map(({ disc, tracks }) => {
      const runs: string[] = []
      let start = -1
      tracks.forEach((track, index) => {
        const on = ids.has(track.id)
        if (on && start < 0) start = index
        if (on && (index === tracks.length - 1 || !ids.has(tracks[index + 1]!.id))) {
          runs.push(start === index ? label(track) : `${label(tracks[start]!)}–${label(track)}`)
          start = -1
        }
      })
      return { disc: disc.position, runs }
    }).filter(part => part.runs.length)
    return ordered.length > 1 ? parts.map(part => `Disc ${part.disc}: ${part.runs.join(', ')}`).join(' · ') : parts.map(part => part.runs.join(', ')).join('')
  }

  return [...people.values()].map(({ tracks, ...person }) => ({
    ...person,
    roles: [...tracks.values()].map(entry => ({ ...entry.role, tracks: ranges(entry.ids) }))
      .sort((a, b) => roleOrder(a.role) - roleOrder(b.role)),
  }))
}
