// The album page's 导出: the album as a CSV, Markdown or JSON file, made from the data the page already has. People and
// roles come from buildTracklist, so a file lists them as the tracklist does. DATA_LICENSE asks reusers to credit CDCat
// and link the page, so every format carries both.
//
// The Markdown is also the album's page for language models (docs/seo in the API repo): /albums/{id}.md answers with
// it and LLM 副本 copies it, so it has to hold everything the page shows.

import type { Album, AlbumProduct } from '~/types/album'
import type { ProductPrice } from '~/types/document'
import type { TracklistDisc, TracklistHelpers, TracklistPerson, TracklistRow } from './tracklistView'
import { buildTracklist, defaultLanguageKey, groupCredits, parseLanguageKey } from './tracklistView'
import { joinText } from './artistLine'

export type AlbumExportFormat = 'csv' | 'markdown' | 'json'

export const ALBUM_EXPORT_FILES: Record<AlbumExportFormat, { extension: string, type: string }> = {
  csv: { extension: 'csv', type: 'text/csv;charset=utf-8' },
  markdown: { extension: 'md', type: 'text/markdown;charset=utf-8' },
  json: { extension: 'json', type: 'application/json;charset=utf-8' },
}

export interface AlbumExportSource {
  /** The album page's address */
  url: string
  license: { name: string, url: string }
  /** A path on the site as a full address, for the Markdown's links to artists, tracks, events and works. */
  site?: (path: string) => string
}

export interface AlbumExportHelpers extends TracklistHelpers {
  uiLocale: string
  /** A message under album.export */
  label: (key: string, params?: Record<string, string>) => string
  discLabel: (position: number) => string
  formatDate: (date: string | null | undefined, precision?: Album['release_date_precision'] | null) => string
  productName: (product: AlbumProduct) => string
  priceLines: (prices: ProductPrice[]) => string[]
  separator: string
  aside: (text: string) => string
}

/** The album's discs as the tracklist shows them, titles in the UI language where it has them. */
const tracklistOf = (album: Album, helpers: AlbumExportHelpers) => buildTracklist({
  discs: album.discs,
  bonuses: album.bonuses,
  credits: album.credits,
  language: parseLanguageKey(defaultLanguageKey(album.tracklist_languages, helpers.uiLocale)),
}, helpers).discs

/** With a language chosen a row leads with the translation and keeps the original as its subtitle. */
const originalTitle = (row: TracklistRow) => row.subtitle || row.title
const translatedTitle = (row: TracklistRow) => row.subtitle ? row.title : ''

/** The printed number; the zero padding is only for lining up the page's rows. */
const numberOf = (row: TracklistRow) => row.number.replace(/^0+(?=\d)/, '')

const personText = (person: TracklistPerson, helpers: AlbumExportHelpers): string => {
  const own = `${person.name}${person.detail ? helpers.aside(person.detail) : ''}`
  const guests = person.guests.length ? `${own} feat. ${person.guests.map(guest => personText(guest, helpers)).join(helpers.separator)}` : own
  return [guests, ...(person.joined ?? []).map(next => `${joinText(next.joinPhrase ?? '')}${personText(next, helpers)}`)].join('')
}

const peopleText = (people: TracklistPerson[], helpers: AlbumExportHelpers) => people.map(person => personText(person, helpers)).join(helpers.separator)

/** One column per printed name of a role, so two roles that read the same share one. */
interface RoleColumn {
  label: string
  order: number
  /** Tracks with someone in it */
  tracks: number
}

const roleColumns = (discs: TracklistDisc[], helpers: AlbumExportHelpers) => {
  const columns = new Map<string, RoleColumn>()
  for (const row of discs.flatMap(disc => disc.rows)) {
    for (const label of new Set(row.groups.map(group => group.label))) {
      const role = row.groups.find(group => group.label === label)!.role
      const column = columns.get(label) ?? { label, order: helpers.roleOrder(role), tracks: 0 }
      column.tracks += 1
      columns.set(label, column)
    }
  }
  return [...columns.values()].sort((a, b) => a.order - b.order)
}

const roleCell = (row: TracklistRow, label: string, helpers: AlbumExportHelpers) =>
  peopleText(row.groups.filter(group => group.label === label).flatMap(group => group.people), helpers)

const originalsCell = (row: TracklistRow) => row.originals.map(original => original.title).join(' / ')

// ---- CSV ---------------------------------------------------------------------------------------

/** The start of a cell Excel would read as a formula; albums are user-contributed, so such a cell could run on opening. */
const FORMULA_START = /^(?:[\t\r\n]|\s*[=+\-@＝＋－＠])/

export const csvCell = (value: string | number | null | undefined) => {
  const text = String(value ?? '')
  const safe = FORMULA_START.test(text) ? `'${text}` : text
  return /[",\r\n]/.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe
}

/** The release date cut to its precision: sorts well and doesn't invent a day. */
const isoDate = (album: Album) => album.release_date?.slice(0, { year: 4, month: 7, day: 10 }[album.release_date_precision]) ?? ''

/**
 * One row per track, for filtering and sorting in a spreadsheet. Starts with a byte order mark, without which Excel
 * reads UTF-8 as the system's old encoding. The duration comes twice as Excel reads 1:23 as a time of day, so only
 * the seconds add up.
 */
export const albumCsv = (album: Album, source: AlbumExportSource, helpers: AlbumExportHelpers) => {
  const discs = tracklistOf(album, helpers)
  const roles = roleColumns(discs, helpers)
  const seconds = new Map(album.discs.flatMap(disc => disc.tracks).map(track => [track.id, track.duration]))
  const header = [
    ...['album', 'catalog_number', 'release_date', 'disc', 'track', 'title', 'translation', 'duration', 'seconds'].map(key => helpers.label(`csv_columns.${key}`)),
    ...roles.map(role => role.label),
    ...['originals', 'isrc', 'bonus', 'source', 'license'].map(key => helpers.label(`csv_columns.${key}`)),
  ]
  const rows = discs.flatMap(disc => disc.rows.map(row => [
    album.title,
    album.catalog_number,
    isoDate(album),
    disc.position,
    numberOf(row),
    originalTitle(row),
    translatedTitle(row),
    row.duration,
    seconds.get(row.id),
    ...roles.map(role => roleCell(row, role.label, helpers)),
    originalsCell(row),
    row.isrc,
    disc.bonus?.name,
    source.url,
    source.license.name,
  ]))
  return `\uFEFF${[header, ...rows].map(row => `${row.map(csvCell).join(',')}\r\n`).join('')}`
}

// ---- Markdown ----------------------------------------------------------------------------------

/**
 * Plain text in Markdown, escaping only what would change it, as people read these files in a text editor too: an _
 * inside a word ("Signal_404") stays, and so does a lone ~ ("ANST-0001~4"); a pair strikes through ("~Prologue~").
 */
const mdText = (value: string) => {
  const text = value.replace(/\s*\n\s*/g, ' ').replace(/[\\`*[\]<|]/g, '\\$&').replace(/(?<![\p{L}\p{N}])_|_(?![\p{L}\p{N}])/gu, '\\_')
  return text.indexOf('~') === text.lastIndexOf('~') ? text : text.replaceAll('~', '\\~')
}

const mdLink = (text: string, url: string) => /^https?:\/\//i.test(url)
  ? `[${mdText(text)}](${url.replace(/[()\s]/g, mark => encodeURIComponent(mark).replace('(', '%28').replace(')', '%29'))})`
  : mdText(text)

const mdRow = (cells: string[]) => `| ${cells.join(' | ')} |`

const hostOf = (url: string) => {
  try {
    return new URL(url).hostname
  }
  catch {
    return url
  }
}

/** How many role columns a track table takes before it is too wide to read; the rest go under it. */
const TABLE_ROLES = 3

const discTable = (disc: TracklistDisc, tableRoles: string[], source: AlbumExportSource, helpers: AlbumExportHelpers) => {
  const { rows } = disc
  const tracked = (cell: (row: TracklistRow) => string) => rows.some(row => cell(row))
  const lyrics = helpers.label('md.lyrics')
  // `markdown` cells are written as they are (a link); the others are plain text and get escaped.
  const columns: Array<{ header: string, cell: (row: TracklistRow) => string, markdown?: boolean }> = [
    { header: '#', cell: numberOf },
    { header: helpers.label('csv_columns.title'), cell: originalTitle },
    { header: helpers.label('csv_columns.translation'), cell: translatedTitle },
    { header: helpers.label('csv_columns.duration'), cell: (row: TracklistRow) => row.duration },
    ...tableRoles.map(label => ({ header: label, cell: (row: TracklistRow) => roleCell(row, label, helpers) })),
    { header: helpers.label('csv_columns.originals'), cell: originalsCell },
    // A track with lyrics links to its page, where they are.
    { header: lyrics, cell: (row: TracklistRow) => (row.lyrics || row.translations ? (source.site ? mdLink(lyrics, source.site(`/tracks/${row.id}`)) : mdText(lyrics)) : ''), markdown: true },
  ].filter(column => tracked(column.cell))
  return [
    mdRow(columns.map(column => mdText(column.header))),
    mdRow(columns.map(() => '---')),
    ...rows.map(row => mdRow(columns.map(column => (column.markdown ? column.cell(row) : mdText(column.cell(row)))))),
  ].join('\n')
}

/** What a track says about itself beyond its credits (BPM, key …), under the table: one line per track that has any. */
const discAttributes = (disc: TracklistDisc, helpers: AlbumExportHelpers) => disc.rows
  .filter(row => row.attributes.length)
  .map(row => `- **${mdText(numberOf(row))}**：${row.attributes.map(attribute => mdText(`${attribute.label} ${attribute.value}`)).join(helpers.separator)}`)

/** The roles left out of the table: the whole disc's people as they are, the others with their tracks. */
const discRest = (disc: TracklistDisc, rest: string[], helpers: AlbumExportHelpers) => rest.flatMap((label) => {
  const people = new Map<string, string[]>()
  for (const row of disc.rows) {
    for (const person of row.groups.filter(group => group.label === label).flatMap(group => group.people)) {
      const text = personText(person, helpers)
      people.set(text, [...(people.get(text) ?? []), numberOf(row)])
    }
  }
  if (!people.size) return []
  const names = [...people].map(([text, tracks]) => mdText(tracks.length === disc.rows.length ? text : `${text}${helpers.aside(tracks.join(helpers.separator))}`))
  return [`- **${mdText(label)}**：${names.join(helpers.separator)}`]
})

const tracksSection = (album: Album, source: AlbumExportSource, helpers: AlbumExportHelpers) => {
  const discs = tracklistOf(album, helpers).filter(disc => disc.rows.length)
  if (!discs.length) return []
  const columns = roleColumns(discs, helpers)
  const widest = new Set([...columns].sort((a, b) => b.tracks - a.tracks).slice(0, TABLE_ROLES).map(column => column.label))
  const tableRoles = columns.filter(column => widest.has(column.label)).map(column => column.label)
  const rest = columns.filter(column => !widest.has(column.label)).map(column => column.label)
  return [
    `## ${mdText(helpers.label('md.tracklist'))}`,
    ...discs.flatMap((disc) => {
      const heading = [helpers.discLabel(disc.position), disc.title, disc.format, disc.bonus?.name].filter(Boolean).join(' · ')
      const lines = [...discRest(disc, rest, helpers), ...discAttributes(disc, helpers)]
      return [
        ...(disc.showHeader ? [`### ${mdText(heading)}`] : []),
        discTable(disc, tableRoles, source, helpers),
        ...(lines.length ? [lines.join('\n')] : []),
      ]
    }),
  ]
}

const section = (title: string, lines: string[]) => lines.length ? [`## ${mdText(title)}`, lines.join('\n')] : []

/**
 * A readable fact sheet of the album, complete enough to stand in for the page; sections with nothing in them are left
 * out. With `source.site`, the album's artists, release event, related works and tracks with lyrics link to their pages.
 */
export const albumMarkdown = (album: Album, source: AlbumExportSource, helpers: AlbumExportHelpers) => {
  const { label, separator, aside } = helpers
  /** A fact whose value is already Markdown (a link) */
  const line = (key: string, value: string) => value ? [`- **${mdText(label(`md.${key}`))}**：${value}`] : []
  const fact = (key: string, value: string | number | null | undefined) => line(key, value ? mdText(String(value)) : '')
  /** A name linked to its page on the site, or plain where the file has no site to point at */
  const onSite = (text: string, path: string) => (source.site ? mdLink(text, source.site(path)) : mdText(text))
  /** The locale's brackets around text that is Markdown already */
  const [asideOpen = '', asideClose = ''] = aside('\n').split('\n')
  const asideOf = (markdown: string) => `${asideOpen}${markdown}${asideClose}`
  const released = helpers.formatDate(album.release_date, album.release_date_precision)
  const event = album.release_event
  const cover = album.cover?.url || album.image_url
  const facts = [
    ...line('page', mdLink(source.url, source.url)),
    ...fact('other_names', [...new Set(album.titles.map(title => title.title))].join(separator)),
    ...fact('catalog_number', album.catalog_number),
    ...line('release_date', released ? `${mdText(released)}${event ? asideOf(onSite(event.name, `/events/${event.id}`)) : ''}` : ''),
    ...fact('type', [helpers.enumLabel('album_type', album.type), ...album.categories.map(category => helpers.enumLabel('album_category', category))].join(' / ')),
    ...(album.byline ? [`- **${mdText(helpers.roleName(album.byline.role))}**：${album.byline.artists.map(artist => onSite(artist.name, `/artists/${artist.id}`)).join(mdText(separator))}`] : []),
    ...fact('disc_count', album.disc_count),
    ...fact('track_count', album.track_count),
    ...fact('duration', album.duration ? helpers.formatDuration(album.duration) : ''),
    ...fact('rating', album.rating != null && album.rating_count ? label('md.rating_value', { rating: String(album.rating), count: String(album.rating_count) }) : ''),
    ...line('cover', cover ? mdLink(cover, cover) : ''),
    ...fact('updated', helpers.formatDate((album.edited_at || album.updated_at)?.slice(0, 10))),
  ]
  const works = [
    ...(album.entries ?? []).map(entry => `- ${[
      onSite(entry.name, `/entries/${entry.id}`),
      ...[helpers.enumLabel('entry_type', entry.type), helpers.enumLabel('entry_album_relation', entry.relation_type), entry.note].filter(Boolean).map(text => mdText(text!)),
    ].join(' · ')}`),
    ...(album.franchises ?? []).map(franchise => `- ${onSite(franchise.name, `/franchises/${franchise.id}`)}`),
  ]
  const attributes = (album.attributes ?? []).map(helpers.attribute).filter(attribute => attribute.value)
    .map(attribute => `- **${mdText(attribute.label)}**：${mdText(attribute.value)}`)
  const images = (album.images ?? []).filter(item => item.image).map((item) => {
    const name = [helpers.enumLabel('image_kind', item.kind), item.label, item.caption].filter(Boolean).join(' · ')
    return `- ${mdLink(name || item.image!.url, item.image!.url)}`
  })
  const credits = groupCredits(album.credits, helpers).map(group => `- **${mdText(group.label)}**：${mdText(peopleText(group.people, helpers))}`)
  const products = album.products.map((product) => {
    // An edition's own date only when it isn't the album's: a reissue, a later pressing.
    const dated = product.release_date && product.release_date !== album.release_date ? helpers.formatDate(product.release_date, product.release_date_precision) : ''
    const details = [product.catalog_number, product.format_label, dated, product.barcode, ...helpers.priceLines(product.prices), product.note]
    return `- ${[`**${mdText(helpers.productName(product))}**`, ...details.filter(Boolean).map(detail => mdText(detail!))].join(' · ')}`
  })
  const bonuses = album.bonuses.map(bonus => `- ${[`**${mdText(bonus.name)}**`, ...(bonus.description ? [mdText(bonus.description)] : [])].join(' · ')}`)
  const links = [...new Map([...album.links, ...album.streaming].map(link => [link.url, link])).values()]
    .map(link => `- ${mdLink([link.provider?.name || hostOf(link.url), link.label].filter(Boolean).join(' · '), link.url)}`)
  return `${[
    `# ${mdText(album.title)}`,
    ...(facts.length ? [facts.join('\n')] : []),
    ...(album.description?.trim() ? [`## ${mdText(label('md.description'))}`, album.description.trim()] : []),
    ...section(label('md.related'), works),
    ...section(label('md.credits'), credits),
    ...tracksSection(album, source, helpers),
    ...section(label('md.products'), products),
    ...section(label('md.bonuses'), bonuses),
    ...section(label('md.attributes'), attributes),
    ...section(label('md.images'), images),
    ...section(label('md.links'), links),
    '---',
    label('md.footer', { source: mdLink('CDCat', source.url), license: mdLink(source.license.name, source.license.url) }),
  ].join('\n\n')}\n`
}

// ---- JSON --------------------------------------------------------------------------------------

/** What the API says about the person viewing, not about the album. */
const VIEWER_FIELDS = new Set(['is_favorited', 'user_tracking', 'favorite_track_ids', 'pending_revision'])

/** The API's album (docs/api/albums.md), without the viewer's own fields, in an envelope naming where it came from. */
export const albumJson = (album: Album, source: AlbumExportSource, exportedAt: Date) => `${JSON.stringify({
  source: source.url,
  license: source.license.name,
  license_url: source.license.url,
  exported_at: exportedAt.toISOString(),
  album,
}, (key, value) => VIEWER_FIELDS.has(key) ? undefined : value, 2)}\n`

// ---- File name ---------------------------------------------------------------------------------

const FILE_NAME_LENGTH = 100

/** "ABCD-001 - Title.csv", without what file systems refuse; falls back to the id when nothing of the title is left. */
export const albumExportFilename = (album: Pick<Album, 'id' | 'title' | 'catalog_number'>, format: AlbumExportFormat) => {
  // eslint-disable-next-line no-control-regex
  const clean = (value: string) => value.replace(/[\\/:*?"<>|\u0000-\u001F]/g, ' ').replace(/\s+/g, ' ').trim()
  const name = [album.catalog_number, album.title].map(value => clean(value ?? '')).filter(Boolean).join(' - ')
  const short = Array.from(name).slice(0, FILE_NAME_LENGTH).join('').replace(/[\s.]+$/, '').replace(/^\.+/, '')
  return `${short || `album-${album.id}`}.${ALBUM_EXPORT_FILES[format].extension}`
}
