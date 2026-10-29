import type { AlbumBonus, AlbumDisc, AlbumTrack, TrackOriginal, TracklistLanguage } from '~/types/album'
import type { CatalogAttribute, CatalogCredit, CatalogTitle } from '~/types/catalog'

/**
 * The album page's tracklist, worked out once for every style: shown titles, numbers, durations, credits grouped by
 * role with their names and categories, the key people of the 舒适 line, disc totals, and each artist's roles on the
 * album for the hover card. Row components only display what is here, so they call no composables.
 */

export type TracklistDensity = 'compact' | 'comfy' | 'full'
export const TRACKLIST_DENSITIES: readonly TracklistDensity[] = ['compact', 'comfy', 'full']

export interface TracklistPrefs {
  style: string
  density: TracklistDensity
  trackCard: boolean
  artistCard: boolean
}
export const DEFAULT_TRACKLIST_PREFS: TracklistPrefs = { style: 'list', density: 'comfy', trackCard: true, artistCard: true }

/** The saved preferences, with anything unknown (a removed style, a hand-edited cookie) back at its default. */
export const normalizeTracklistPrefs = (raw: unknown, styleKeys: readonly string[]): TracklistPrefs => {
  const value = (raw && typeof raw === 'object' ? raw : {}) as Partial<Record<keyof TracklistPrefs, unknown>>
  return {
    style: typeof value.style === 'string' && styleKeys.includes(value.style) ? value.style : DEFAULT_TRACKLIST_PREFS.style,
    density: TRACKLIST_DENSITIES.includes(value.density as TracklistDensity) ? value.density as TracklistDensity : DEFAULT_TRACKLIST_PREFS.density,
    trackCard: typeof value.trackCard === 'boolean' ? value.trackCard : DEFAULT_TRACKLIST_PREFS.trackCard,
    artistCard: typeof value.artistCard === 'boolean' ? value.artistCard : DEFAULT_TRACKLIST_PREFS.artistCard,
  }
}

export interface TracklistLanguageChoice {
  locale: string
  kind: string
}

export const tracklistLanguageKey = (language: TracklistLanguageChoice) => `${language.locale}|${language.kind}`

const UI_LOCALES: Record<string, string[]> = { 'zh-Hans': ['zh-Hans', 'zh-CN'], 'zh-Hant': ['zh-Hant', 'zh-TW'], 'en': ['en'], 'ja': ['ja'] }

/** Starts in the UI language when the tracklist has an official name or a translation in it, else in the original (''). */
export const defaultLanguageKey = (languages: TracklistLanguage[], uiLocale: string) => {
  const match = languages.find(language => language.kind !== 'transliteration' && (UI_LOCALES[uiLocale] ?? [uiLocale]).includes(language.locale))
  return match ? tracklistLanguageKey(match) : ''
}

export const parseLanguageKey = (key: string): TracklistLanguageChoice | null => {
  if (!key) return null
  const [locale, kind] = key.split('|') as [string, string]
  return { locale, kind }
}

export interface TracklistPerson {
  name: string
  artistId: number | null
  detail: string | null
}

export interface TracklistRoleGroup {
  role: string
  label: string
  category: string
  people: TracklistPerson[]
}

export interface TracklistRow {
  id: number
  discPosition: number
  /** The printed number (A1 on vinyl) or the zero-padded track number */
  number: string
  title: string
  /** The original title under a translated one; '' when the original is shown */
  subtitle: string
  /** False when a language is chosen and this track has no name in it; null when the original is shown */
  translated: boolean | null
  otherTitles: Array<{ title: string, label: string }>
  /** '' when unknown */
  duration: string
  instrumental: boolean
  isrc: string | null
  favorites: number
  favorited: boolean
  /** The original and its readings */
  lyrics: number
  translations: number
  /** 舒适: who performs (署名艺术家, else the first vocal role) and who made it (arrangement, else composition) */
  lead: TracklistRoleGroup | null
  maker: TracklistRoleGroup | null
  /** 完整: every credit by role, in the dictionary's order */
  groups: TracklistRoleGroup[]
  originals: TrackOriginal[]
  attributes: Array<{ key: string, label: string, value: string }>
}

export interface TracklistDisc {
  id: number
  position: number
  title: string
  /** The format's name when it isn't a CD */
  format: string
  bonus: { id: number, name: string } | null
  showHeader: boolean
  /** The disc's running time; null when any track's is unknown */
  duration: string | null
  rows: TracklistRow[]
  /** The roles credited on this disc, in order, for the table's columns */
  roles: Array<{ role: string, label: string, category: string }>
}

export interface TracklistArtist {
  id: number
  name: string
  image_url?: string | null
  type?: string | null
}

export interface TracklistArtistRole {
  role: string
  label: string
  category: string
  /** Tracks credited in this role; 0 for an album-wide credit */
  count: number
}

export interface TracklistHelpers {
  titleIn: (titles: CatalogTitle[], wanted: TracklistLanguageChoice | null) => string | null
  roleName: (role: string) => string
  roleCategory: (role: string) => string
  roleOrder: (role: string) => number
  enumLabel: (group: string, value: string | null | undefined) => string
  localeName: (code: string) => string
  formatDuration: (seconds: number | null | undefined) => string
  attribute: (attribute: CatalogAttribute) => { label: string, value: string }
}

export interface TracklistInput {
  discs: AlbumDisc[]
  bonuses: AlbumBonus[]
  /** The album-wide credits, for each artist's roles on the album */
  credits?: CatalogCredit[]
  language: TracklistLanguageChoice | null
}

const groupCredits = (credits: CatalogCredit[], helpers: TracklistHelpers): TracklistRoleGroup[] => {
  const groups = new Map<string, TracklistRoleGroup>()
  for (const credit of credits) {
    const group = groups.get(credit.role) ?? {
      role: credit.role,
      label: helpers.roleName(credit.role),
      category: credit.category ?? helpers.roleCategory(credit.role),
      people: [],
    }
    group.people.push({ name: credit.credited_as || credit.artist?.name || '', artistId: credit.artist?.id ?? null, detail: credit.detail })
    groups.set(credit.role, group)
  }
  return [...groups.values()].sort((a, b) => helpers.roleOrder(a.role) - helpers.roleOrder(b.role))
}

const buildRow = (track: AlbumTrack, discPosition: number, input: TracklistInput, helpers: TracklistHelpers): TracklistRow => {
  const translated = helpers.titleIn(track.titles, input.language)
  const groups = groupCredits(track.credits, helpers)
  const byCategory = (category: string) => groups.find(group => group.category === category) ?? null
  return {
    id: track.id,
    discPosition,
    number: track.number_label || String(track.track_number).padStart(2, '0'),
    title: translated ?? track.title,
    subtitle: translated && translated !== track.title ? track.title : '',
    translated: input.language ? translated !== null : null,
    otherTitles: track.titles.map(title => ({
      title: title.title,
      label: [title.locale ? helpers.localeName(title.locale) : '', helpers.enumLabel('title_kind', title.kind)].filter(Boolean).join(' · '),
    })),
    duration: helpers.formatDuration(track.duration),
    instrumental: track.is_instrumental,
    isrc: track.isrc,
    favorites: track.favorites_count,
    favorited: track.is_favorited,
    lyrics: Math.max(0, track.lyrics_count - track.translations_count),
    translations: track.translations_count,
    lead: groups.find(group => group.role === 'artist') ?? byCategory('vocals'),
    maker: byCategory('arrangement') ?? byCategory('composition'),
    groups,
    originals: track.originals,
    attributes: track.attributes.map(attribute => ({ key: attribute.key, ...helpers.attribute(attribute) })),
  }
}

export const buildTracklist = (input: TracklistInput, helpers: TracklistHelpers) => {
  const artists = new Map<number, TracklistArtist>()
  const roleCounts = new Map<number, Map<string, number>>()
  const count = (credit: CatalogCredit, tracks: number) => {
    if (!credit.artist) return
    artists.set(credit.artist.id, credit.artist)
    const roles = roleCounts.get(credit.artist.id) ?? new Map<string, number>()
    roles.set(credit.role, (roles.get(credit.role) ?? 0) + tracks)
    roleCounts.set(credit.artist.id, roles)
  }
  for (const credit of input.credits ?? []) count(credit, 0)

  const discs: TracklistDisc[] = input.discs.map((disc) => {
    const tracks = [...disc.tracks].sort((a, b) => a.track_number - b.track_number)
    const seen = new Set<string>()
    for (const track of tracks) {
      for (const credit of track.credits) {
        // A person credited twice in one role on a track still counts that track once.
        const key = `${track.id}|${credit.artist?.id}|${credit.role}`
        if (!seen.has(key)) count(credit, 1)
        seen.add(key)
      }
    }
    const rows = tracks.map(track => buildRow(track, disc.position, input, helpers))
    const roles = new Map<string, { role: string, label: string, category: string }>()
    for (const row of rows) for (const group of row.groups) roles.set(group.role, { role: group.role, label: group.label, category: group.category })
    const known = tracks.every(track => track.duration !== null)
    const bonus = input.bonuses.find(item => item.id === disc.bonus_id)
    const title = helpers.titleIn(disc.titles, input.language) ?? disc.title ?? ''
    return {
      id: disc.id,
      position: disc.position,
      title,
      format: disc.format === 'cd' ? '' : helpers.enumLabel('disc_format', disc.format),
      bonus: bonus ? { id: bonus.id, name: bonus.name } : null,
      showHeader: false,
      duration: known && tracks.length ? helpers.formatDuration(tracks.reduce((sum, track) => sum + (track.duration ?? 0), 0)) : null,
      rows,
      roles: [...roles.values()].sort((a, b) => helpers.roleOrder(a.role) - helpers.roleOrder(b.role)),
    }
  })
  for (const disc of discs) disc.showHeader = discs.length > 1 || Boolean(disc.bonus || disc.format || disc.title)

  const artistRoles = new Map<number, TracklistArtistRole[]>()
  for (const [id, roles] of roleCounts) {
    artistRoles.set(id, [...roles.entries()]
      .sort(([a], [b]) => helpers.roleOrder(a) - helpers.roleOrder(b))
      .map(([role, tracks]) => ({ role, label: helpers.roleName(role), category: helpers.roleCategory(role), count: tracks })))
  }

  return { discs, artists, artistRoles }
}
