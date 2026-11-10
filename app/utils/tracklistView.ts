import type { AlbumBonus, AlbumDisc, AlbumTrack, TrackOriginal, TracklistLanguage } from '~/types/album'
import type { CatalogAttribute, CatalogCredit, CatalogTitle } from '~/types/catalog'
import { ARTIST_ROLE, attachGuests, FEATURING_ROLE } from './artistLine'

/**
 * The album page's tracklist, worked out once for every style: shown titles, numbers, durations, credits grouped by
 * role with their names and categories, the key people of the 舒适 line, disc totals, and each artist's roles on the
 * album for the hover card. 表格 · 完整's columns (tableLayout) are worked out by that view alone, when it shows. Row components only display what is here, so they call no composables.
 */

export type TracklistDensity = 'compact' | 'comfy' | 'full'
export const TRACKLIST_DENSITIES: readonly TracklistDensity[] = ['compact', 'comfy', 'full']

/** Track numbers: each disc from 1 (`disc`), or later discs carrying on from the one before (`album`). */
export type TracklistNumbering = 'disc' | 'album'
export const TRACKLIST_NUMBERINGS: readonly TracklistNumbering[] = ['disc', 'album']

/**
 * What a reader picks as one 样式 is a layout (`style`: 清单, 内页, 表格) at one of the densities that layout offers;
 * the two are kept apart so a density change within a layout opens and folds rows instead of swapping the list.
 */
export interface TracklistPrefs {
  style: string
  density: TracklistDensity
  numbering: TracklistNumbering
}
export const DEFAULT_TRACKLIST_PREFS: TracklistPrefs = { style: 'list', density: 'comfy', numbering: 'disc' }

/**
 * The saved preferences, with anything unknown (a removed layout, a hand-edited cookie) back at its default. `layouts`
 * maps each layout to the densities it offers; a density the layout doesn't offer (内页 · 简洁 before it went) becomes
 * the default density if the layout has it, else the layout's first, so the reader keeps the layout. `moved` maps a
 * `style.density` pair that went to another layout (表格 · 简洁 → 清单 · 简洁) to its new place.
 */
export const normalizeTracklistPrefs = (
  raw: unknown,
  layouts: Readonly<Record<string, readonly TracklistDensity[]>>,
  moved: Readonly<Record<string, Pick<TracklistPrefs, 'style' | 'density'>>> = {},
): TracklistPrefs => {
  const saved = (raw && typeof raw === 'object' ? raw : {}) as Partial<Record<keyof TracklistPrefs, unknown>>
  const pair = `${String(saved.style)}.${String(saved.density)}`
  const value = Object.hasOwn(moved, pair) ? { ...saved, ...moved[pair] } : saved
  const style = typeof value.style === 'string' && Object.hasOwn(layouts, value.style) ? value.style : DEFAULT_TRACKLIST_PREFS.style
  const offered = layouts[style] ?? TRACKLIST_DENSITIES
  const density = offered.includes(value.density as TracklistDensity)
    ? value.density as TracklistDensity
    : offered.includes(DEFAULT_TRACKLIST_PREFS.density) ? DEFAULT_TRACKLIST_PREFS.density : offered[0] ?? DEFAULT_TRACKLIST_PREFS.density
  return {
    style,
    density,
    numbering: TRACKLIST_NUMBERINGS.includes(value.numbering as TracklistNumbering) ? value.numbering as TracklistNumbering : DEFAULT_TRACKLIST_PREFS.numbering,
  }
}

export interface TracklistLanguageChoice {
  locale: string
  kind: string
}

export const tracklistLanguageKey = (language: TracklistLanguageChoice) => `${language.locale}|${language.kind}`

const UI_LOCALES: Record<string, string[]> = { 'zh-Hans': ['zh-Hans', 'zh-CN'], 'zh-Hant': ['zh-Hant', 'zh-TW'], 'en': ['en'], 'ja': ['ja'], 'ko': ['ko'] }

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
  creditId: number
  /** As credited: credited_as, else the artist's name */
  name: string
  artistId: number | null
  /** The artist's own name, for linking only that part of a credited name ("void (Mournfinale)": void) */
  artistName: string | null
  detail: string | null
  /** The 客串 that belong to this credit (parent_id, utils/artistLine), shown with it: "Xeno feat. eili" */
  guests: TracklistPerson[]
  /** The word printed before this artist, joining it to the one before: "awfuless meets PODA" */
  joinPhrase?: string
  /** The artists joined to this one, shown in its tag */
  joined?: TracklistPerson[]
}

export interface TracklistRoleGroup {
  /** One group per role and printed job title, in the order they first appear */
  key: string
  role: string
  /** The printed job title, else the role's name */
  label: string
  /** The role's own name */
  roleName: string
  /** The tooltip of a printed job title (useCatalogSchema roleTip), empty when the tag shows the role's name */
  tip: string
  category: string
  people: TracklistPerson[]
}

/**
 * A credit on 清单 · 舒适's line: one or more roles held by exactly the same people (作曲·编曲 高田暁), with at most
 * KEY_NAMES of them shown and the rest counted.
 */
export interface TracklistKeyCredit {
  key: string
  roles: TracklistRoleGroup[]
  /** The names shown, at most KEY_NAMES */
  people: TracklistPerson[]
  /** The names past those, behind a +N */
  more: TracklistPerson[]
}

/** How many names a credit on 清单 · 舒适's line shows before the rest go behind a +N. */
export const KEY_NAMES = 2

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
  favorited: boolean
  /** The original and its readings */
  lyrics: number
  translations: number
  /** 舒适: who performs (艺术家, else the first vocal role, with the 客串 after them) and who made it (arrangement, else composition) */
  lead: TracklistRoleGroup | null
  maker: TracklistRoleGroup | null
  /** 清单 · 舒适: 艺术家, 作曲, 编曲, 演唱 (keyCredits) */
  key: TracklistKeyCredit[]
  /** 表格 · 舒适's 参与人员: everyone credited, once each, 艺术家, 作曲, 编曲 and 演唱 first, then the rest by role */
  everyone: TracklistPerson[]
  /** 完整: every credit by role, in the dictionary's order; the 客串 inside the lead rather than a group of their own */
  groups: TracklistRoleGroup[]
  /** How many people `groups` names, each once (countPeople): the 清单 · 简洁 people button */
  people: number
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
  roleTip: (role: string, label: string | null | undefined) => string
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
  /** Each disc from 1 when left out */
  numbering?: TracklistNumbering
}

/**
 * How much to add to each disc's track numbers when they run on through the album: a disc carries on from the last
 * number of the disc before it. A bonus's discs (特典) run on among themselves, apart from the album's own. A disc
 * already numbered on (its first number past the last one before it) keeps its numbers.
 */
const numberOffsets = (discs: AlbumDisc[]) => {
  const offsets = new Map<number, number>()
  const reached = new Map<number | null, number>()
  for (const disc of [...discs].sort((a, b) => a.position - b.position)) {
    const numbers = disc.tracks.map(track => track.track_number)
    if (!numbers.length) continue
    const last = reached.get(disc.bonus_id ?? null) ?? 0
    const offset = Math.min(...numbers) > last ? 0 : last
    offsets.set(disc.id, offset)
    reached.set(disc.bonus_id ?? null, offset + Math.max(...numbers))
  }
  return offsets
}

export const groupCredits = (credits: CatalogCredit[], helpers: TracklistHelpers): TracklistRoleGroup[] => {
  const groups = new Map<string, TracklistRoleGroup>()
  for (const credit of credits) {
    const key = credit.role_label ? JSON.stringify([credit.role, credit.role_label]) : credit.role
    const group = groups.get(key) ?? {
      key,
      role: credit.role,
      label: credit.role_label || helpers.roleName(credit.role),
      roleName: helpers.roleName(credit.role),
      tip: helpers.roleTip(credit.role, credit.role_label),
      category: credit.category ?? helpers.roleCategory(credit.role),
      people: [],
    }
    group.people.push({
      creditId: credit.id,
      name: credit.credited_as || credit.artist?.name || '',
      artistId: credit.artist?.id ?? null,
      artistName: credit.artist?.name ?? null,
      detail: credit.detail,
      guests: [],
      ...(credit.join_phrase ? { joinPhrase: credit.join_phrase } : {}),
    })
    groups.set(key, group)
  }
  return [...groups.values()].sort((a, b) => helpers.roleOrder(a.role) - helpers.roleOrder(b.role))
}

/**
 * Each 客串 goes into the tag of the credit it belongs to, wherever that one is listed ("Xeno feat. eili"), so the
 * 客串 role only keeps those whose credit is not on the track; with none left it is no group of its own.
 */
const attachFeaturing = (groups: TracklistRoleGroup[], credits: CatalogCredit[]): TracklistRoleGroup[] => {
  const featuring = groups.find(group => group.role === FEATURING_ROLE)
  if (!featuring) return groups
  const people = groups.filter(group => group !== featuring).flatMap(group => group.people)
  const parents = new Map(credits.map(credit => [credit.id, credit.parent_id ?? null]))
  const { lines, left } = attachGuests(people, featuring.people, person => person.creditId, guest => parents.get(guest.creditId))
  for (const line of lines) line.item.guests = line.guests
  featuring.people = left
  return left.length ? groups : groups.filter(group => group !== featuring)
}

/** An artist with a word before it goes into the tag of the one before it, 客串 and all; they stay in order. */
const joinArtists = (groups: TracklistRoleGroup[]): TracklistRoleGroup[] => groups.map((group) => {
  if (group.role !== ARTIST_ROLE) return group
  const heads: TracklistPerson[] = []
  for (const person of group.people) {
    const head = heads.at(-1)
    if (person.joinPhrase && head) head.joined = [...(head.joined ?? []), person]
    else heads.push(person)
  }
  return { ...group, people: heads }
})

/**
 * Everyone named in a track's credit groups, each once however many roles they hold: an artist by id and the name
 * they are credited under (someone under two names is two people, as in the credits card), a name-only credit by its
 * name. The 客串 and joined artists inside a tag count too.
 */
export const countPeople = (groups: TracklistRoleGroup[]) => {
  const keys = new Set<string>()
  const add = (person: TracklistPerson) => {
    keys.add(`${person.artistId ?? ''}|${person.name}`)
    for (const other of [...person.guests, ...(person.joined ?? [])]) add(other)
  }
  for (const group of groups) {
    for (const person of group.people) add(person)
  }
  return keys.size
}

/** Credit groups held by exactly the same people, with the same notes, folded into one at the first one's place. */
export interface TracklistMergedCredit {
  key: string
  roles: TracklistRoleGroup[]
  people: TracklistPerson[]
}

/**
 * Roles held by exactly the same people (and the same detail notes) as one credit, in the order the first of them
 * comes: 作曲 编曲 高田暁, 录音 混音 高田浩太郎. A group given twice counts once. 清单 · 舒适's line and 内页's liner
 * both read credits this way.
 */
export const mergeSamePeople = (groups: Array<TracklistRoleGroup | null | undefined>): TracklistMergedCredit[] => {
  const credits: TracklistMergedCredit[] = []
  const bySameNames = new Map<string, TracklistMergedCredit>()
  const seen = new Set<string>()
  for (const group of groups) {
    if (!group || seen.has(group.key)) continue
    seen.add(group.key)
    const names = group.people.map(person => `${person.artistId ?? ''}|${person.name}|${person.detail ?? ''}`).sort().join('\n')
    const same = bySameNames.get(names)
    if (same) {
      same.roles.push(group)
      continue
    }
    const credit = { key: group.key, roles: [group], people: group.people }
    bySameNames.set(names, credit)
    credits.push(credit)
  }
  return credits
}

/** 表格 · 完整: a credit group gets a column of its own once this many tracks of the disc have it. */
export const TABLE_COLUMN_TRACKS = 2

export interface TracklistTableColumn {
  /** The credit group's key: its role and printed job title, so each instrument of 演奏 (Guitar, Drums) is a column */
  key: string
  role: string
  label: string
  tip: string
  category: string
}

export interface TracklistTableLayout {
  /** The groups on at least TABLE_COLUMN_TRACKS tracks, in the dictionary's order, job titles as they first come */
  columns: TracklistTableColumn[]
  /** Each row's other groups (by track id), one line per set held by the same people: 其他人员, or 参与人员 with no columns */
  others: Map<number, TracklistMergedCredit[]>
  /** Each row's groups, the same way: the row's credits once the rows turn into blocks */
  lines: Map<number, TracklistMergedCredit[]>
  /** The attributes any track of the disc has (BPM …), as they first come: a column each, after the credits */
  attributes: Array<{ key: string, label: string }>
  /** Whether any track has an ISRC: its column, the last that scrolls */
  isrc: boolean
}

/**
 * 表格 · 完整's layout of one disc (user picks of 2026-11-11: B2, E1). A credit group (a role and its printed job
 * title) gets a column once it is on TABLE_COLUMN_TRACKS tracks or more, the same people on every track or not; one on
 * a single track goes to the row's 其他人员 cell, so a disc of one track has no columns at all. Columns come in the
 * dictionary's order (`roleOrder`), the job titles of one role in the order they first come. (A 全碟署名 box for
 * credits the same on every track, pick A3, was built and then dropped by the user the same day.)
 */
export const tableLayout = (rows: TracklistRow[], roleOrder: (role: string) => number): TracklistTableLayout => {
  const first = new Map<string, { group: TracklistRoleGroup, at: number }>()
  const tracks = new Map<string, number>()
  for (const row of rows) {
    for (const group of row.groups) {
      if (!first.has(group.key)) first.set(group.key, { group, at: first.size })
      tracks.set(group.key, (tracks.get(group.key) ?? 0) + 1)
    }
  }
  const ordered = [...first.values()].sort((a, b) => roleOrder(a.group.role) - roleOrder(b.group.role) || a.at - b.at).map(item => item.group)
  const columns = ordered
    .filter(group => (tracks.get(group.key) ?? 0) >= TABLE_COLUMN_TRACKS)
    .map(group => ({ key: group.key, role: group.role, label: group.label, tip: group.tip, category: group.category }))
  const inColumns = new Set(columns.map(column => column.key))
  const attributes = new Map<string, string>()
  for (const row of rows) {
    for (const attribute of row.attributes) {
      if (!attributes.has(attribute.key)) attributes.set(attribute.key, attribute.label)
    }
  }
  return {
    columns,
    others: new Map(rows.map(row => [row.id, mergeSamePeople(row.groups.filter(group => !inColumns.has(group.key)))])),
    lines: new Map(rows.map(row => [row.id, mergeSamePeople(row.groups)])),
    attributes: [...attributes].map(([key, label]) => ({ key, label })),
    isrc: rows.some(row => Boolean(row.isrc)),
  }
}

/**
 * 清单 · 舒适's line, the credits that matter most at a glance, in this order: the 艺术家 (with their 客串), 作曲, 编曲
 * and 演唱 (the vocals role, else the first of the vocals category); the first role of each category, a role split by
 * job titles taken whole. Roles held by exactly the same people share one credit (mergeSamePeople), and each shows
 * KEY_NAMES names at most.
 */
export const keyCredits = (picks: Array<TracklistRoleGroup | null | undefined>): TracklistKeyCredit[] =>
  mergeSamePeople(picks).map(credit => ({ ...credit, people: credit.people.slice(0, KEY_NAMES), more: credit.people.slice(KEY_NAMES) }))

/** The people of these groups in order, each once (by artist and credited name); 客串 stay inside their tag. */
const everyoneIn = (groups: Array<TracklistRoleGroup | null | undefined>): TracklistPerson[] => {
  const seen = new Set<string>()
  const people: TracklistPerson[] = []
  for (const group of groups) {
    for (const person of group?.people ?? []) {
      const key = `${person.artistId ?? ''}|${person.name}`
      if (seen.has(key)) continue
      seen.add(key)
      people.push(person)
    }
  }
  return people
}

const buildRow = (track: AlbumTrack, discPosition: number, offset: number, input: TracklistInput, helpers: TracklistHelpers): TracklistRow => {
  const translated = helpers.titleIn(track.titles, input.language)
  const groups = joinArtists(attachFeaturing(groupCredits(track.credits, helpers), track.credits))
  // A role split by job titles counts as one for the key people: they are all of the role, under its own name.
  const whole = (group: TracklistRoleGroup | undefined) => {
    if (!group) return null
    const same = groups.filter(other => other.role === group.role)
    return same.length > 1 ? { ...group, key: group.role, label: group.roleName, tip: '', people: same.flatMap(other => other.people) } : group
  }
  const byCategory = (category: string) => whole(groups.find(group => group.category === category))
  const keyPicks = [
    whole(groups.find(group => group.role === ARTIST_ROLE)),
    byCategory('composition'),
    byCategory('arrangement'),
    whole(groups.find(group => group.role === 'vocals')) ?? byCategory('vocals'),
  ]
  const key = keyCredits(keyPicks)
  const subtitle = translated && translated !== track.title ? track.title : ''
  return {
    id: track.id,
    discPosition,
    number: track.number_label || String(track.track_number + offset).padStart(2, '0'),
    title: translated ?? track.title,
    subtitle,
    translated: input.language ? translated !== null : null,
    otherTitles: track.titles.map(title => ({
      title: title.title,
      label: [title.locale ? helpers.localeName(title.locale) : '', helpers.enumLabel('title_kind', title.kind)].filter(Boolean).join(' · '),
    })),
    duration: helpers.formatDuration(track.duration),
    instrumental: track.is_instrumental,
    isrc: track.isrc,
    favorited: track.is_favorited,
    lyrics: Math.max(0, track.lyrics_count - track.translations_count),
    translations: track.translations_count,
    // The 艺术家, else the first role of the vocals; the 客串 when no credit of the track takes them
    lead: whole(groups.find(group => group.role === ARTIST_ROLE)) ?? byCategory('vocals'),
    maker: byCategory('arrangement') ?? byCategory('composition'),
    key,
    everyone: everyoneIn([...keyPicks, ...groups]),
    groups,
    people: countPeople(groups),
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
  const offsets = input.numbering === 'album' ? numberOffsets(input.discs) : null

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
    const rows = tracks.map(track => buildRow(track, disc.position, offsets?.get(disc.id) ?? 0, input, helpers))
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
