import type { Album, AlbumDisc, AlbumTrack } from '../../app/types/album'
import type { CatalogCredit } from '../../app/types/catalog'
import { describe, expect, it } from 'vitest'
import type { AlbumExportHelpers, AlbumExportSource } from '../../app/utils/albumExport'
import { albumCsv, albumExportFilename, albumJson, albumMarkdown, csvCell } from '../../app/utils/albumExport'

const ORDER = ['artist', 'composer', 'arranger', 'lyricist', 'mixing', 'featuring', 'illustrator', 'publisher']
const NAMES: Record<string, string> = { artist: 'Artist', composer: 'Composer', arranger: 'Arranger', lyricist: 'Lyricist', mixing: 'Mixing', featuring: 'Featuring', illustrator: 'Illustrator', publisher: 'Publisher' }

const helpers: AlbumExportHelpers = {
  uiLocale: 'en',
  titleIn: (titles, wanted) => wanted ? titles?.find(title => title.locale === wanted.locale && title.kind === wanted.kind)?.title ?? null : null,
  roleName: role => NAMES[role] ?? role,
  roleTip: () => '',
  roleCategory: () => 'other',
  roleOrder: role => ORDER.indexOf(role),
  enumLabel: (_group, value) => value ?? '',
  localeName: code => code,
  formatDuration: seconds => seconds == null ? '' : `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`,
  attribute: attribute => ({ label: attribute.key, value: String(attribute.value) }),
  label: (key, params) => params ? `${key} ${params.source} ${params.license}` : key.split('.').at(-1)!,
  discLabel: position => `Disc ${position}`,
  formatDate: date => date ?? '',
  productName: product => product.name ?? product.edition_type,
  priceLines: prices => prices.map(price => `${price.currency} ${price.amount}`),
  separator: ', ',
  aside: text => ` (${text})`,
}
const source: AlbumExportSource = { url: 'https://cdcat.net/albums/1', license: { name: 'CC BY-SA 4.0', url: 'https://creativecommons.org/licenses/by-sa/4.0/' } }

let nextId = 1
const credit = (role: string, name: string, extra: Partial<CatalogCredit> = {}): CatalogCredit => ({
  id: nextId++, role, category: null, artist: { id: nextId, name }, credited_as: null, detail: null, ...extra,
})
const track = (number: number, title: string, credits: CatalogCredit[], extra: Partial<AlbumTrack> = {}): AlbumTrack => ({
  id: nextId++, disc_number: 1, track_number: number, number_label: null, title, titles: [], duration: 83, is_instrumental: false, isrc: null,
  favorites_count: 0, is_favorited: true, has_lyrics: false, lyrics_count: 0, translations_count: 0, originals: [], credits, attributes: [], ...extra,
})
const disc = (position: number, tracks: AlbumTrack[], extra: Partial<AlbumDisc> = {}): AlbumDisc => ({ id: position, position, title: null, titles: [], format: 'cd', bonus_id: null, tocs: [], tracks, ...extra })
const album = (extra: Partial<Album> = {}): Album => ({
  id: 1, title: 'Album', titles: [], catalog_number: 'ABCD-001', release_date: '2024-08-12', release_date_precision: 'day', type: 'album', categories: ['doujin'],
  release_event: null, description: null, byline: null, disc_count: 1, track_count: 1, duration: 83, discs: [], tracklist_languages: [], credits: [], products: [],
  bonuses: [], links: [], streaming: [], is_favorited: true, user_tracking: { status: 'owned' }, ...extra,
} as Album)

const rows = (csv: string) => csv.replace(/^\uFEFF/, '').trimEnd().split('\r\n').map(line => line.split(','))

describe('csvCell', () => {
  it('quotes what would break the row', () => {
    expect(csvCell('a,b')).toBe('"a,b"')
    expect(csvCell('say "hi"')).toBe('"say ""hi"""')
    expect(csvCell('two\nlines')).toBe('"two\nlines"')
    expect(csvCell(null)).toBe('')
    expect(csvCell(83)).toBe('83')
  })

  it('keeps Excel from running a cell as a formula', () => {
    for (const text of ['=1+1', '+1', '-Prologue-', '@SUM(A1)', '\t=1', '  =1', '＝1']) expect(csvCell(text).replace(/^"/, '')).toMatch(/^'/)
    expect(csvCell('=HYPERLINK("x","y")')).toBe('"\'=HYPERLINK(""x"",""y"")"')
    expect(csvCell('A-1')).toBe('A-1')
  })
})

describe('albumCsv', () => {
  it('starts with a byte order mark and ends lines for Excel', () => {
    const csv = albumCsv(album({ discs: [disc(1, [track(1, 'T', [])])] }), source, helpers)
    expect(csv.charCodeAt(0)).toBe(0xFEFF)
    expect(csv.endsWith('\r\n')).toBe(true)
  })

  it('has one row per track, on all discs, and the roles in use as columns in dictionary order', () => {
    const csv = albumCsv(album({ discs: [
      disc(1, [track(1, 'One', [credit('arranger', 'Xeno'), credit('composer', 'ZUN')]), track(2, 'Two', [credit('composer', 'ZUN'), credit('composer', 'Other')])]),
      disc(2, [track(1, 'Three', [])], { bonus_id: 9 }),
    ], bonuses: [{ id: 9, name: 'Extra' } as Album['bonuses'][number]] }), source, helpers)
    const [header, ...body] = rows(csv)
    expect(header).toEqual(['album', 'catalog_number', 'release_date', 'disc', 'track', 'title', 'translation', 'duration', 'seconds', 'Composer', 'Arranger', 'originals', 'isrc', 'bonus', 'source', 'license'])
    expect(body).toHaveLength(3)
    expect(body[0]!.slice(3, 11)).toEqual(['1', '1', 'One', '', '1:23', '83', 'ZUN', 'Xeno'])
    expect(csv).toContain('"ZUN, Other"')
    expect(body[2]!.slice(-3)).toEqual(['Extra', source.url, 'CC BY-SA 4.0'])
  })

  it('gives each printed job title its own column and spells the note', () => {
    const csv = albumCsv(album({ discs: [disc(1, [track(1, 'T', [credit('mixing', 'A', { role_label: 'Sound Director', detail: 'vocals' })])])] }), source, helpers)
    expect(rows(csv)[0]).toContain('Sound Director')
    expect(csv).toContain('A (vocals)')
  })

  it('prints the word between artists joined by one', () => {
    const lead = credit('artist', 'awfuless')
    const csv = albumCsv(album({ discs: [disc(1, [track(1, 'T', [lead, credit('artist', 'PODA', { join_phrase: 'meets' })])])] }), source, helpers)
    expect(csv).toContain('awfuless meets PODA')
  })

  it('puts a comma joiner right after the name before it', () => {
    const lead = credit('artist', 'Asatsumei')
    const csv = albumCsv(album({ discs: [disc(1, [track(1, 'T', [lead, credit('artist', 'Asayami', { join_phrase: ',' }), credit('artist', 'Mei Naganowa', { join_phrase: '&' })])])] }), source, helpers)
    expect(csv).toContain('Asatsumei, Asayami & Mei Naganowa')
  })

  it('puts a 客串 with the credit it belongs to', () => {
    const lead = credit('artist', 'Xeno')
    const csv = albumCsv(album({ discs: [disc(1, [track(1, 'T', [lead, credit('featuring', 'eili', { parent_id: lead.id })])])] }), source, helpers)
    expect(csv).toContain('Xeno feat. eili')
    expect(rows(csv)[0]).not.toContain('Featuring')
  })

  it('splits a translated title from the original', () => {
    const csv = albumCsv(album({
      tracklist_languages: [{ locale: 'en', kind: 'translation', count: 1, total: 1 }],
      discs: [disc(1, [track(1, '星の歌', [], { titles: [{ title: 'Star Song', locale: 'en', kind: 'translation' }] })])],
    }), source, helpers)
    expect(rows(csv)[1]!.slice(5, 7)).toEqual(['星の歌', 'Star Song'])
  })

  it('cuts the date to its precision, leaves a track of unknown length empty and gives an empty album its header', () => {
    const csv = albumCsv(album({ release_date_precision: 'month', discs: [disc(1, [track(1, 'T', [], { duration: null })])] }), source, helpers)
    expect(rows(csv)[1]!.slice(2, 3)).toEqual(['2024-08'])
    expect(rows(csv)[1]!.slice(7, 9)).toEqual(['', ''])
    expect(rows(albumCsv(album(), source, helpers))).toHaveLength(1)
  })
})

describe('albumMarkdown', () => {
  it('leaves out empty sections and always names the source', () => {
    const md = albumMarkdown(album(), source, helpers)
    expect(md).toMatch(/^# Album\n/)
    expect(md).not.toMatch(/^## /m)
    expect(md).toContain('footer [CDCat](https://cdcat.net/albums/1) [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)')
  })

  it('escapes what would break a table or restyle a title', () => {
    const md = albumMarkdown(album({ title: '~Title~', discs: [disc(1, [track(1, 'A|B\nC *x*', [])])] }), source, helpers)
    expect(md).toContain('# \\~Title\\~')
    expect(md).toContain('| 1 | A\\|B C \\*x\\* | 1:23 |')
  })

  it('leaves marks that change nothing alone', () => {
    const md = albumMarkdown(album({ title: 'Signal_404 ANST-0001~4', discs: [disc(1, [track(1, '_x_', [])])] }), source, helpers)
    expect(md).toContain('# Signal_404 ANST-0001~4')
    expect(md).toContain('| 1 | \\_x\\_ | 1:23 |')
  })

  it('keeps a table to its widest roles and lists the rest under it, with tracks when not all', () => {
    const everyone = () => [credit('composer', 'C'), credit('arranger', 'A'), credit('lyricist', 'L')]
    const md = albumMarkdown(album({ discs: [disc(1, [
      track(1, 'One', [...everyone(), credit('mixing', 'M'), credit('illustrator', 'I')]),
      track(2, 'Two', [...everyone(), credit('mixing', 'M')]),
    ])] }), source, helpers)
    expect(md).toContain('| # | title | duration | Composer | Arranger | Lyricist |')
    expect(md).toContain('- **Mixing**：M')
    expect(md).not.toContain('**Mixing**：M (')
    expect(md).toContain('- **Illustrator**：I (1)')
  })

  it('heads discs only when there are several, and lists editions and links', () => {
    const one = album({ discs: [disc(1, [track(1, 'T', [])])] })
    expect(albumMarkdown(one, source, helpers)).not.toContain('### ')
    const md = albumMarkdown(album({
      discs: [disc(1, [track(1, 'T', [])]), disc(2, [track(1, 'U', [])], { title: 'Extra' })],
      products: [{ name: 'Regular', edition_type: 'regular', catalog_number: 'ABCD-001', format_label: '2CD', barcode: null, prices: [{ kind: 'list', note: null, amount: '2000', currency: 'JPY', tax_included: true }], note: null } as unknown as Album['products'][number]],
      links: [{ id: 1, url: 'https://example.com/a_(b)', label: 'MV', external_id: null, is_verified: true, provider: null }],
    }), source, helpers)
    expect(md).toContain('### Disc 2 · Extra')
    expect(md).toContain('- **Regular** · ABCD-001 · 2CD · JPY 2000')
    expect(md).toContain('- [example.com · MV](https://example.com/a_%28b%29)')
  })

  it('does not link an address that is not on the web', () => {
    const md = albumMarkdown(album({ links: [{ id: 1, url: 'javascript:alert(1)', label: 'x', external_id: null, is_verified: true, provider: null }] }), source, helpers)
    expect(md).not.toContain('](javascript:')
  })
})

describe('albumJson', () => {
  it('keeps the album in an envelope and drops the viewer\'s own fields, on tracks too', () => {
    const viewer = album({ discs: [disc(1, [track(1, 'T', [])])], pending_revision: { id: 1, status: 'pending' } } as Partial<Album>)
    const text = albumJson({ ...viewer, favorite_track_ids: [1] } as Album, source, new Date('2026-11-06T00:00:00Z'))
    const parsed = JSON.parse(text)
    expect(parsed).toMatchObject({ source: source.url, license: 'CC BY-SA 4.0', exported_at: '2026-11-06T00:00:00.000Z' })
    expect(parsed.album.title).toBe('Album')
    expect(parsed.album.discs[0].tracks[0].title).toBe('T')
    for (const field of ['is_favorited', 'user_tracking', 'favorite_track_ids', 'pending_revision']) expect(text).not.toContain(field)
  })
})

describe('albumExportFilename', () => {
  it('puts the catalog number first and takes out what file systems refuse', () => {
    expect(albumExportFilename({ id: 1, title: 'A/B: "C"?', catalog_number: 'ABCD-001' }, 'csv')).toBe('ABCD-001 - A B C.csv')
    expect(albumExportFilename({ id: 1, title: 'Title', catalog_number: null }, 'markdown')).toBe('Title.md')
  })

  it('cuts long names by character and falls back to the id', () => {
    const name = albumExportFilename({ id: 1, title: '星'.repeat(200), catalog_number: null }, 'json')
    expect(Array.from(name.replace('.json', ''))).toHaveLength(100)
    expect(albumExportFilename({ id: 7, title: '???', catalog_number: null }, 'json')).toBe('album-7.json')
  })
})

describe('albumMarkdown, as the page a language model reads', () => {
  it('leads with the page it came from, and links nothing without a site to point at', () => {
    const md = albumMarkdown(album({ byline: { role: 'artist', artists: [{ id: 5, name: 'Xeno' }] } as Album['byline'] }), source, helpers)
    expect(md).toContain('- **page**：[https://cdcat.net/albums/1](https://cdcat.net/albums/1)')
    expect(md).toContain('- **Artist**：Xeno')
  })

  it('links the artists, the release event, related works and tracks with lyrics to their pages', () => {
    const site = (path: string) => `https://cdcat.net${path}`
    const md = albumMarkdown(album({
      byline: { role: 'artist', artists: [{ id: 5, name: 'Xeno' }, { id: 6, name: 'eili' }] } as Album['byline'],
      release_event: { id: 58, name: 'M3-2026 Autumn', slug: null, main_visual_url: null, start_date: null },
      entries: [{ id: 3, name: 'Touhou', slug: null, type: 'game', format: null, image_url: null, release_date: null, relation_type: 'arrange', note: 'tracks 1-4', franchises: [] }] as Album['entries'],
      franchises: [{ id: 2, name: 'Touhou Project', slug: null, image_url: null }],
      discs: [disc(1, [track(1, 'Sung', [], { lyrics_count: 1, has_lyrics: true }), track(2, 'Played', [])])],
    }), { ...source, site }, helpers)
    expect(md).toContain('- **Artist**：[Xeno](https://cdcat.net/artists/5), [eili](https://cdcat.net/artists/6)')
    expect(md).toContain('- **release_date**：2024-08-12 ([M3-2026 Autumn](https://cdcat.net/events/58))')
    expect(md).toContain('## related\n\n- [Touhou](https://cdcat.net/entries/3) · game · arrange · tracks 1-4\n- [Touhou Project](https://cdcat.net/franchises/2)')
    expect(md).toContain('| # | title | duration | lyrics |')
    expect(md).toContain('| 1 | Sung | 1:23 | [lyrics](https://cdcat.net/tracks/' )
    expect(md).toContain('| 2 | Played | 1:23 |  |')
  })

  it('gives the rating, the cover, when it last changed, attributes and every image', () => {
    const md = albumMarkdown(album({
      rating: 4.5, rating_count: 12,
      image_url: 'https://img.cdcat.net/cover_600.webp',
      cover: { id: 1, url: 'https://img.cdcat.net/cover.webp', thumbnail_url: '', medium_url: '', width: 1, height: 1, mime: 'image/webp' },
      edited_at: '2026-11-08T10:00:00Z',
      attributes: [{ id: 1, key: 'bpm', value: 174, label: null, sort_order: 0 }],
      images: [
        { id: 1, kind: 'booklet', label: 'p. 01-02', caption: 'Lyrics spread', product_id: null, bonus_id: null, disc_id: null, is_primary: false, sort_order: 0, image: { id: 2, url: 'https://img.cdcat.net/b.webp', thumbnail_url: '', medium_url: '', width: 1, height: 1, mime: 'image/webp' }, attributes: [] },
        { id: 2, kind: 'cover', label: null, caption: null, product_id: null, bonus_id: null, disc_id: null, is_primary: true, sort_order: 1, image: null, attributes: [] },
      ] as Album['images'],
    }), source, helpers)
    expect(md).toContain('- **rating**：md.rating_value')
    expect(md).toContain('- **cover**：[https://img.cdcat.net/cover.webp](https://img.cdcat.net/cover.webp)')
    expect(md).toContain('- **updated**：2026-11-08')
    expect(md).toContain('## attributes\n\n- **bpm**：174')
    expect(md).toContain('## images\n\n- [booklet · p. 01-02 · Lyrics spread](https://img.cdcat.net/b.webp)\n\n')
  })

  it('dates an edition only when it came out on another day than the album', () => {
    const edition = (extra: object) => ({ name: 'Reissue', edition_type: 'regular', catalog_number: null, format_label: 'CD', barcode: null, prices: [], note: null, release_date: '2024-08-12', release_date_precision: 'day', ...extra })
    const same = albumMarkdown(album({ products: [edition({})] as unknown as Album['products'] }), source, helpers)
    expect(same).toContain('- **Reissue** · CD\n')
    const later = albumMarkdown(album({ products: [edition({ release_date: '2025-01-01' })] as unknown as Album['products'] }), source, helpers)
    expect(later).toContain('- **Reissue** · CD · 2025-01-01')
  })
})

