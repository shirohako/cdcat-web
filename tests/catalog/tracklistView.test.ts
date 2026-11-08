import type { AlbumDisc, AlbumTrack } from '../../app/types/album'
import type { CatalogCredit } from '../../app/types/catalog'
import type { TracklistHelpers, TracklistRoleGroup } from '../../app/utils/tracklistView'
import { describe, expect, it } from 'vitest'
import { buildTracklist, defaultLanguageKey, normalizeTracklistPrefs } from '../../app/utils/tracklistView'

const ORDER = ['artist', 'composer', 'lyricist', 'arranger', 'vocals', 'voice_actor', 'featuring']
const CATEGORIES: Record<string, string> = { artist: 'release', composer: 'composition', lyricist: 'lyrics', arranger: 'arrangement', vocals: 'vocals', voice_actor: 'vocals', featuring: 'vocals' }

const helpers: TracklistHelpers = {
  titleIn: (titles, wanted) => (wanted ? titles.find(title => title.locale === wanted.locale && title.kind === wanted.kind)?.title ?? null : null),
  roleName: role => role.toUpperCase(),
  roleTip: (role, label) => (label ? `${label}\n${role.toUpperCase()}` : ''),
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
  id: position, position, title: null, titles: [], format: 'cd', bonus_id: null, tocs: [], tracks, ...extra,
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
    expect(row.groups[1]!.people).toEqual([
      { creditId: credits[1]!.id, name: 'NAGI', artistId: 1, artistName: 'NAGI', detail: null, guests: [] },
      { creditId: credits[2]!.id, name: 'Eris', artistId: null, artistName: null, detail: 'remix', guests: [] },
    ])
    expect(row.lead?.role).toBe('vocals')
    expect(row.maker?.role).toBe('arranger')
  })

  it('gives each job title of a role its own group, and the key people all of the role under its name', () => {
    const titled = (name: string, id: number, role_label: string) => ({ ...credit('arranger', name, id), role_label })
    const row = (credits: CatalogCredit[]) => buildTracklist({ discs: [disc(1, [track(1, { credits })])], bonuses: [], language: null }, helpers).discs[0]!
    const split = row([titled('A', 1, 'Strings Arrangement'), titled('B', 2, 'Brass Arrangement'), credit('arranger', 'C', 3)])
    expect(split.rows[0]!.groups.map(group => [group.label, group.people.map(person => person.name)])).toEqual([['Strings Arrangement', ['A']], ['Brass Arrangement', ['B']], [helpers.roleName('arranger'), ['C']]])
    expect(split.rows[0]!.maker).toMatchObject({ label: helpers.roleName('arranger'), people: [{ name: 'A' }, { name: 'B' }, { name: 'C' }] })
    expect(split.roles).toEqual([{ role: 'arranger', label: helpers.roleName('arranger'), category: 'arrangement' }])
    expect(row([titled('A', 1, 'Strings Arrangement')]).rows[0]!.maker).toMatchObject({ label: 'Strings Arrangement', roleName: helpers.roleName('arranger') })
  })

  it('leads with the 艺术家, falls back to composers and reads roles by category', () => {
    const row = (credits: CatalogCredit[]) => buildTracklist({ discs: [disc(1, [track(1, { credits })])], bonuses: [], language: null }, helpers).discs[0]!.rows[0]!
    expect(row([credit('vocals', 'A', 1), credit('artist', 'B', 2)]).lead?.role).toBe('artist')
    expect(row([credit('voice_actor', 'C', 3), credit('composer', 'D', 4)])).toMatchObject({ lead: { role: 'voice_actor' }, maker: { role: 'composer' } })
    expect(row([])).toMatchObject({ lead: null, maker: null })
  })

  it('shows artists joined by a word in one tag, in order, each with their 客串', () => {
    const row = (credits: CatalogCredit[]) => buildTracklist({ discs: [disc(1, [track(1, { credits })])], bonuses: [], language: null }, helpers).discs[0]!.rows[0]!
    const first = credit('artist', 'awfuless', 1)
    const second = { ...credit('artist', 'PODA', 2), join_phrase: 'meets' }
    const third = { ...credit('artist', 'TAG', 3), join_phrase: 'vs' }
    const guest = { ...credit('featuring', 'eili', 4), parent_id: second.id }
    const { lead, groups } = row([first, second, third, credit('artist', 'KARUT', 5), guest])
    expect(lead!.people.map(person => person.name)).toEqual(['awfuless', 'KARUT'])
    expect(lead!.people[0]!.joined).toMatchObject([{ name: 'PODA', joinPhrase: 'meets', guests: [{ name: 'eili' }] }, { name: 'TAG', joinPhrase: 'vs' }])
    expect(lead!.people[1]!.joined).toBeUndefined()
    expect(groups.map(group => group.role)).toEqual(['artist'])
  })

  it('puts each 客串 with the credit it belongs to, in 完整 too, and keeps the role only for those it can\'t place', () => {
    const row = (credits: CatalogCredit[]) => buildTracklist({ discs: [disc(1, [track(1, { credits })])], bonuses: [], language: null }, helpers).discs[0]!.rows[0]!
    const xeudo = credit('artist', 'Xeudo Code', 1)
    const xeno = credit('artist', 'Xeno', 2)
    const both = row([xeudo, xeno, { ...credit('featuring', 'eili', 3), parent_id: xeno.id }, credit('composer', 'Xeno', 2)])
    const text = (group: TracklistRoleGroup | null) => group?.people.map(person => [person.name, ...person.guests.map(guest => guest.name)].join(' feat. '))
    expect(text(both.lead)).toEqual(['Xeudo Code', 'Xeno feat. eili'])
    expect(both.lead!.people[1]!.guests).toMatchObject([{ name: 'eili', artistId: 3 }])
    expect(both.groups.map(group => group.role)).toEqual(['artist', 'composer'])
    // Belonging to a singer
    const vocals = credit('vocals', 'A', 4)
    const sung = row([vocals, { ...credit('featuring', 'B', 5), parent_id: vocals.id }])
    expect(text(sung.lead)).toEqual(['A feat. B'])
    expect(sung.groups.map(group => group.role)).toEqual(['vocals'])
    const alone = row([credit('featuring', 'B', 5)])
    expect(alone.lead).toMatchObject({ role: 'featuring', people: [{ name: 'B' }] })
    expect(alone.groups).toEqual([alone.lead])
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
    expect(normalizeTracklistPrefs(undefined, ['list', 'table'])).toEqual({ style: 'list', density: 'comfy', artistCard: true })
    expect(normalizeTracklistPrefs({ style: 'table', density: 'full', trackCard: false, artistCard: 'no' }, ['list', 'table']))
      .toEqual({ style: 'table', density: 'full', artistCard: true })
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
