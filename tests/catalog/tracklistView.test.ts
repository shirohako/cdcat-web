import type { AlbumDisc, AlbumTrack } from '../../app/types/album'
import type { CatalogCredit } from '../../app/types/catalog'
import type { TracklistHelpers } from '../../app/utils/tracklistView'
import { describe, expect, it } from 'vitest'
import { buildTracklist, defaultLanguageKey, normalizeTracklistPrefs } from '../../app/utils/tracklistView'

const ORDER = ['artist', 'composer', 'lyricist', 'arranger', 'vocals', 'voice_actor']
const CATEGORIES: Record<string, string> = { artist: 'release', composer: 'composition', lyricist: 'lyrics', arranger: 'arrangement', vocals: 'vocals', voice_actor: 'vocals' }

const helpers: TracklistHelpers = {
  titleIn: (titles, wanted) => (wanted ? titles.find(title => title.locale === wanted.locale && title.kind === wanted.kind)?.title ?? null : null),
  roleName: role => role.toUpperCase(),
  roleCategory: role => CATEGORIES[role] ?? 'other',
  roleOrder: role => ORDER.indexOf(role),
  enumLabel: (group, value) => `${group}:${value}`,
  localeName: code => `lang:${code}`,
  formatDuration: seconds => (seconds == null ? '' : `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`),
  attribute: attribute => ({ label: attribute.key.toUpperCase(), value: String(attribute.value) }),
}

let nextId = 1
const credit = (role: string, name: string, artistId: number | null = null, detail: string | null = null): CatalogCredit => ({
  id: nextId++, role, category: CATEGORIES[role] ?? null, artist: artistId ? { id: artistId, name } : null, credited_as: artistId ? null : name, detail,
})
const track = (number: number, extra: Partial<AlbumTrack> = {}): AlbumTrack => ({
  id: number * 10, disc_number: 1, track_number: number, number_label: null, title: `Track ${number}`, titles: [], duration: 200,
  is_instrumental: false, isrc: null, favorites_count: 0, is_favorited: false, has_lyrics: false, lyrics_count: 0,
  translations_count: 0, originals: [], credits: [], attributes: [], ...extra,
})
const disc = (position: number, tracks: AlbumTrack[], extra: Partial<AlbumDisc> = {}): AlbumDisc => ({
  id: position, position, title: null, titles: [], format: 'cd', bonus_id: null, tracks, ...extra,
})

describe('buildTracklist', () => {
  it('sorts tracks, pads numbers and keeps printed labels', () => {
    const { discs } = buildTracklist({ discs: [disc(1, [track(2), track(1, { number_label: 'A1' })])], bonuses: [], language: null }, helpers)
    expect(discs[0]!.rows.map(row => row.number)).toEqual(['A1', '02'])
  })

  it('shows disc headers only for several discs, bonuses, other formats or titles', () => {
    const single = buildTracklist({ discs: [disc(1, [track(1)])], bonuses: [], language: null }, helpers)
    expect(single.discs[0]!.showHeader).toBe(false)
    const bluray = buildTracklist({ discs: [disc(1, [track(1)], { format: 'bd' })], bonuses: [], language: null }, helpers)
    expect(bluray.discs[0]).toMatchObject({ showHeader: true, format: 'disc_format:bd' })
    const two = buildTracklist({ discs: [disc(1, [track(1)]), disc(2, [track(1)], { bonus_id: 7 })], bonuses: [{ id: 7, name: 'Bonus CD' } as never], language: null }, helpers)
    expect(two.discs.map(item => item.showHeader)).toEqual([true, true])
    expect(two.discs[1]!.bonus).toEqual({ id: 7, name: 'Bonus CD' })
  })

  it('totals a disc only when every duration is known', () => {
    const { discs } = buildTracklist({ discs: [disc(1, [track(1), track(2, { duration: 100 })]), disc(2, [track(1, { duration: null })])], bonuses: [], language: null }, helpers)
    expect(discs.map(item => item.duration)).toEqual(['5:00', null])
  })

  it('groups credits by role in order, keeps detail notes and picks the key people by category', () => {
    const credits = [credit('vocals', 'Vivienne', 3), credit('arranger', 'NAGI', 1), credit('arranger', 'Eris', null, 'remix'), credit('composer', 'NAGI', 1)]
    const row = buildTracklist({ discs: [disc(1, [track(1, { credits })])], bonuses: [], language: null }, helpers).discs[0]!.rows[0]!
    expect(row.groups.map(group => group.role)).toEqual(['composer', 'arranger', 'vocals'])
    expect(row.groups[1]!.people).toEqual([{ name: 'NAGI', artistId: 1, detail: null }, { name: 'Eris', artistId: null, detail: 'remix' }])
    expect(row.lead?.role).toBe('vocals')
    expect(row.maker?.role).toBe('arranger')
  })

  it('leads with the 署名艺术家, falls back to composers and reads roles by category', () => {
    const row = (credits: CatalogCredit[]) => buildTracklist({ discs: [disc(1, [track(1, { credits })])], bonuses: [], language: null }, helpers).discs[0]!.rows[0]!
    expect(row([credit('vocals', 'A', 1), credit('artist', 'B', 2)]).lead?.role).toBe('artist')
    expect(row([credit('voice_actor', 'C', 3), credit('composer', 'D', 4)])).toMatchObject({ lead: { role: 'voice_actor' }, maker: { role: 'composer' } })
    expect(row([])).toMatchObject({ lead: null, maker: null })
  })

  it('lists the roles credited on each disc for the table', () => {
    const { discs } = buildTracklist({ discs: [disc(1, [track(1, { credits: [credit('vocals', 'A', 1)] }), track(2, { credits: [credit('composer', 'B', 2)] })]), disc(2, [track(1)])], bonuses: [], language: null }, helpers)
    expect(discs[0]!.roles.map(role => role.role)).toEqual(['composer', 'vocals'])
    expect(discs[1]!.roles).toEqual([])
  })

  it('counts each artist\'s roles on the album, album-wide credits as 0', () => {
    const tracks = [
      track(1, { credits: [credit('arranger', 'NAGI', 1), credit('composer', 'NAGI', 1)] }),
      track(2, { credits: [credit('arranger', 'NAGI', 1), credit('arranger', 'NAGI', 1, 'second pass')] }),
    ]
    const { artistRoles, artists } = buildTracklist({ discs: [disc(1, tracks)], bonuses: [], credits: [credit('artist', 'NAGI', 1)], language: null }, helpers)
    expect(artistRoles.get(1)).toEqual([
      { role: 'artist', label: 'ARTIST', category: 'release', count: 0 },
      { role: 'composer', label: 'COMPOSER', category: 'composition', count: 1 },
      { role: 'arranger', label: 'ARRANGER', category: 'arrangement', count: 2 },
    ])
    expect(artists.get(1)?.name).toBe('NAGI')
  })

  it('shows titles in the chosen language, with the original under them, and marks missing ones', () => {
    const tracks = [track(1, { titles: [{ title: '信', locale: 'zh-Hans', kind: 'translation' }] }), track(2)]
    const { discs } = buildTracklist({ discs: [disc(1, tracks)], bonuses: [], language: { locale: 'zh-Hans', kind: 'translation' } }, helpers)
    expect(discs[0]!.rows.map(row => [row.title, row.subtitle, row.translated])).toEqual([['信', 'Track 1', true], ['Track 2', '', false]])
    expect(discs[0]!.rows[0]!.otherTitles).toEqual([{ title: '信', label: 'lang:zh-Hans · title_kind:translation' }])
    const original = buildTracklist({ discs: [disc(1, tracks)], bonuses: [], language: null }, helpers)
    expect(original.discs[0]!.rows[0]).toMatchObject({ title: 'Track 1', subtitle: '', translated: null })
  })

  it('counts lyrics without the translations', () => {
    const row = buildTracklist({ discs: [disc(1, [track(1, { lyrics_count: 4, translations_count: 2 })])], bonuses: [], language: null }, helpers).discs[0]!.rows[0]!
    expect([row.lyrics, row.translations]).toEqual([2, 2])
  })
})

describe('normalizeTracklistPrefs', () => {
  it('fills in defaults and drops unknown values', () => {
    expect(normalizeTracklistPrefs(undefined, ['list', 'table'])).toEqual({ style: 'list', density: 'comfy', trackCard: true, artistCard: true })
    expect(normalizeTracklistPrefs({ style: 'table', density: 'full', trackCard: false, artistCard: 'no' }, ['list', 'table']))
      .toEqual({ style: 'table', density: 'full', trackCard: false, artistCard: true })
    expect(normalizeTracklistPrefs({ style: 'gone', density: 'huge' }, ['list'])).toMatchObject({ style: 'list', density: 'comfy' })
  })
})

describe('defaultLanguageKey', () => {
  it('starts in the UI language when there is an official name or translation in it', () => {
    const languages = [{ locale: 'zh-Hans', kind: 'translation', count: 3, total: 4 }, { locale: 'ja-Latn', kind: 'transliteration', count: 4, total: 4 }] as never
    expect(defaultLanguageKey(languages, 'zh-Hans')).toBe('zh-Hans|translation')
    expect(defaultLanguageKey(languages, 'en')).toBe('')
  })
})
