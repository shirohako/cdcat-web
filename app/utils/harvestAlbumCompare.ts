import type { DraftItem } from '~/composables/useRevisionDraft'
import type { CatalogReferences } from '~/types/catalog'
import type { AggregateRef, AlbumDocument, ProductPrice, RowId } from '~/types/document'
import type { HarvestMergedImage } from '~/types/harvest'
import { addCredit, addDisc, addImage, addTrack, coverOf, firstProduct, removeDisc, removeTrack, setCover, setTitleIn } from '~/utils/albumDocument'
import { sameName } from '~/utils/harvestPeople'
import { newKey } from '~/utils/documentKeys'

const PRICE_KINDS: Record<string, string> = { list: '定价', event: '会场价', shop: '通贩价', other: '其他价格' }
/** The same price: kind, amount and currency (notes and tax may differ). */
const samePrice = (a: ProductPrice, b: ProductPrice) => a.kind === b.kind && a.currency === b.currency && Number(a.amount) === Number(b.amount)
/** 会场价 · C107 4000 JPY 含税, for the admin pages. */
export const priceText = (price: ProductPrice) => [
  [PRICE_KINDS[price.kind] ?? price.kind, price.note].filter(Boolean).join(' · '),
  `${Number(price.amount)} ${price.currency}`,
  price.tax_included === true ? '含税' : price.tax_included === false ? '不含税' : '',
].filter(Boolean).join(' ')

/**
 * What the sources of a candidate say against the album as it is now, or against the review draft (the harvest
 * review page, docs/harvest/README.md#审核): the source draft (buildHarvestDraft, of all sources or of one) compared
 * field by field, track by track and role by role. Each row's `apply` writes the source's value into the album
 * document the editor holds, which makes the row go; credits, links and images are only the ones the album lacks.
 */
export type CompareGroup = 'basic' | 'tracks' | 'credits' | 'links' | 'images'

/** What the review page reaches of the album editor (components/editor/album/AlbumEditor.vue, defineExpose). */
export interface AlbumEditorHandle {
  album: AlbumDocument
  /** The album is loaded: `album` is it, not a placeholder. */
  ready: boolean
  references: CatalogReferences
  /** Names of the items the revision creates, by ref without "@" */
  pending: Record<string, string>
  remember: (type: string, id: number, row: object) => void
  createItem: (type: 'artist', document: Record<string, unknown>, prefix?: string) => string
}

export interface CompareRow {
  key: string
  group: CompareGroup
  label: string
  /** What the album has now; empty when it has nothing. */
  album: string
  source: string
  /** The source the value was picked from, when the merge says. */
  from?: string | null
  /** An image of the sources, for its preview. */
  image?: HarvestMergedImage
  apply: () => void | Promise<void>
}

export interface CompareContext {
  /** The editor's album document; rows change it in place. */
  album: AlbumDocument
  source: AlbumDocument
  /** The source draft's other items: the artists it creates. */
  sourceItems: DraftItem[]
  /** Where merged values came from: title, numbers, barcode, price, tracklist, description. */
  picked: { title: string | null, catalog: string | null, barcode: string | null, price: string | null, tracks: string | null, description: string | null }
  images: HarvestMergedImage[]
  /** Images this site has stored, by sha256. */
  catalogImages: Record<string, number>
  /** Name of a credited artist of the album or of the source draft: an id, or "@ref" of an item. */
  artistName: (ref: AggregateRef) => string
  /** Adds one of the source draft's new artists to the editor's revision; returns its "@ref" there. */
  createArtist: (sourceRef: string) => AggregateRef
  /** Stores a source image in this site; returns the image id. */
  storeImage: (url: string) => Promise<number>
  roleName: (role: string) => string
  localeName: (locale: string) => string
  providerName: (id: number | null) => string
  formatDate: (date: string | null, precision: AlbumDocument['release_date_precision']) => string
  formatDuration: (seconds: number | null) => string
  /** Tracks the source lacks are rows too, which remove them (comparing with the draft: the source's tracklist in place of its own). */
  removeExtra?: boolean
}

const TITLE_KINDS: Record<string, string> = { official: '正式名', translation: '译名', transliteration: '读音', alias: '别名', abbreviation: '简称' }
const FORMATS: Record<string, string> = { cd: 'CD', sacd: 'SACD', dvd: 'DVD', bd: 'BD', vinyl: '黑胶', cassette: '磁带', digital: '数字', other: '其他' }
const IMAGE_KINDS: Record<string, string> = { cover: '封面', back: '背面', other: '其他图片' }

const text = (value: string | null | undefined) => (value ?? '').normalize('NFKC').replace(/\s+/g, ' ').trim()
const same = (a: string | null | undefined, b: string | null | undefined) => text(a) === text(b)
const catalogKey = (value: string | null | undefined) => text(value).toUpperCase().replace(/[\s\-‐–—_]/g, '')
const urlKey = (url: string) => url.trim().toLowerCase().replace(/^https?:\/\/(www\.)?/, '').replace(/\/+$/, '')
const short = (value: string | null | undefined, length = 80) => {
  const flat = text(value)
  return flat.length > length ? `${flat.slice(0, length)}…` : flat
}

export function compareWithAlbum(ctx: CompareContext): CompareRow[] {
  return [...basicRows(ctx), ...trackRows(ctx), ...creditRows(ctx), ...linkRows(ctx), ...imageRows(ctx)]
}

function basicRows(ctx: CompareContext): CompareRow[] {
  const { album, source, picked } = ctx
  const rows: CompareRow[] = []
  if (text(source.title) && !same(source.title, album.title)) {
    rows.push({ key: 'title', group: 'basic', label: '标题', album: album.title, source: source.title, from: picked.title, apply: () => { album.title = source.title } })
  }
  for (const title of source.titles) {
    const current = album.titles.find(row => row.locale === title.locale && row.kind === title.kind)
    if (current && same(current.title, title.title)) continue
    rows.push({
      key: `titles:${title.locale}:${title.kind}`, group: 'basic', label: `${TITLE_KINDS[title.kind] ?? title.kind} · ${title.locale ? ctx.localeName(title.locale) : '未定语言'}`,
      album: current?.title ?? '', source: title.title, apply: () => setTitleIn(album, 'titles', null, title.locale ?? '', title.kind, title.title),
    })
  }
  if (source.release_date && (source.release_date !== album.release_date || source.release_date_precision !== album.release_date_precision)) {
    rows.push({
      key: 'release_date', group: 'basic', label: '发售日期',
      album: ctx.formatDate(album.release_date, album.release_date_precision), source: ctx.formatDate(source.release_date, source.release_date_precision),
      apply: () => {
        album.release_date = source.release_date
        album.release_date_precision = source.release_date_precision
      },
    })
  }
  if (text(source.description) && !same(source.description, album.description)) {
    rows.push({
      key: 'description', group: 'basic', label: '介绍', album: short(album.description), source: short(source.description), from: picked.description,
      apply: () => { album.description = source.description },
    })
  }

  const product = source.products[0]
  const current = firstProduct(album)
  if (product?.catalog_number && !album.products.some(row => catalogKey(row.catalog_number) === catalogKey(product.catalog_number))) {
    rows.push({
      key: 'catalog_number', group: 'basic', label: '品番', album: current?.catalog_number ?? '', source: product.catalog_number, from: picked.catalog,
      apply: () => { firstProduct(album, true)!.catalog_number = product.catalog_number },
    })
  }
  if (product?.barcode && !album.products.some(row => catalogKey(row.barcode) === catalogKey(product.barcode))) {
    rows.push({
      key: 'barcode', group: 'basic', label: '条码', album: current?.barcode ?? '', source: product.barcode, from: picked.barcode,
      apply: () => { firstProduct(album, true)!.barcode = product.barcode },
    })
  }
  const missingPrices = (product?.prices ?? []).filter(price => !album.products.some(row => row.prices.some(other => samePrice(other, price))))
  if (product && missingPrices.length) {
    const prices = (list: ProductPrice[] | undefined) => (list ?? []).map(priceText).join(' / ')
    rows.push({
      key: 'price', group: 'basic', label: '价格', album: prices(current?.prices), source: prices(product.prices), from: picked.price,
      apply: () => {
        const target = firstProduct(album, true)!
        target.prices.push(...missingPrices.filter(price => !target.prices.some(other => samePrice(other, price))).map(price => ({ ...price })))
        target.region ??= product.region
      },
    })
  }
  const format = source.discs[0]?.format
  const discs = album.discs.filter(disc => disc.bonus_id === null)
  if (format && discs.length && discs.every(disc => disc.format !== format)) {
    rows.push({
      key: 'format', group: 'basic', label: '介质', album: [...new Set(discs.map(disc => FORMATS[disc.format] ?? disc.format))].join('、'), source: FORMATS[format] ?? format,
      apply: () => { for (const disc of discs) disc.format = format },
    })
  }
  return rows
}

/** Tracks are matched by disc position and track number. */
const positionOf = (doc: AlbumDocument, discId: RowId) => doc.discs.find(disc => String(disc.id) === String(discId))?.position ?? 1
const trackAt = (doc: AlbumDocument, position: number, number: number) => {
  const disc = doc.discs.find(row => row.position === position)
  return disc ? doc.tracks.find(track => String(track.disc_id) === String(disc.id) && track.track_number === number) ?? null : null
}

function trackRows(ctx: CompareContext): CompareRow[] {
  const { album, source } = ctx
  const several = new Set(source.tracks.map(track => positionOf(source, track.disc_id))).size > 1 || album.discs.filter(disc => disc.bonus_id === null).length > 1
  const sorted = [...source.tracks].sort((a, b) => positionOf(source, a.disc_id) - positionOf(source, b.disc_id) || a.track_number - b.track_number)
  const rows: CompareRow[] = []
  for (const track of sorted) {
    const position = positionOf(source, track.disc_id)
    const label = several ? `${position}-${track.track_number}` : String(track.track_number)
    const current = trackAt(album, position, track.track_number)
    const shown = (row: { title: string, duration: number | null }) => [row.title, ctx.formatDuration(row.duration)].filter(Boolean).join(' · ')
    if (!current) {
      rows.push({
        key: `track:${position}:${track.track_number}`, group: 'tracks', label: `曲目 ${label}`, album: '', source: shown(track), from: ctx.picked.tracks,
        apply: () => {
          const disc = album.discs.find(row => row.position === position)
            ?? addDisc(album, { position, format: source.discs.find(row => row.position === position)?.format ?? album.discs[0]?.format ?? 'cd' })
          if (!trackAt(album, position, track.track_number)) {
            addTrack(album, disc.id, { track_number: track.track_number, number_label: track.number_label, title: track.title, duration: track.duration })
          }
        },
      })
      continue
    }
    const title = text(track.title) !== '' && !same(track.title, current.title)
    const duration = track.duration !== null && track.duration !== current.duration
    if (!title && !duration) continue
    rows.push({
      key: `track:${position}:${track.track_number}`, group: 'tracks', label: `曲目 ${label}`, album: shown(current), source: shown(track), from: ctx.picked.tracks,
      apply: () => {
        if (title) current.title = track.title
        if (duration) current.duration = track.duration
      },
    })
  }
  if (!ctx.removeExtra || !source.tracks.length) return rows
  const extra = album.tracks.filter(track => !source.tracks.some(row => positionOf(source, row.disc_id) === positionOf(album, track.disc_id) && row.track_number === track.track_number))
  for (const track of extra) {
    const position = positionOf(album, track.disc_id)
    rows.push({
      key: `track-extra:${track.id}`, group: 'tracks', label: `曲目 ${several ? `${position}-${track.track_number}` : track.track_number}`,
      album: [track.title, ctx.formatDuration(track.duration)].filter(Boolean).join(' · '), source: '来源没有这首（采用就删掉）', from: ctx.picked.tracks,
      apply: () => {
        removeTrack(album, track.id)
        // A disc left empty that the source does not have goes too.
        if (!album.tracks.some(row => String(row.disc_id) === String(track.disc_id)) && album.discs.length > 1 && !source.discs.some(disc => disc.position === position)) {
          removeDisc(album, track.disc_id)
        }
      },
    })
  }
  return rows
}

function creditRows(ctx: CompareContext): CompareRow[] {
  const { album, source } = ctx
  const albumTrackOf = (sourceTrackId: RowId | null): RowId | null | undefined => {
    if (sourceTrackId === null) return null
    const track = source.tracks.find(row => String(row.id) === String(sourceTrackId))
    return track ? trackAt(album, positionOf(source, track.disc_id), track.track_number)?.id : undefined
  }
  const nameOf = (row: { artist_id: AggregateRef | null, credited_as: string | null }) => row.credited_as || (row.artist_id !== null ? ctx.artistName(row.artist_id) : '')
  const trackLabel = (trackId: RowId | null) => {
    if (trackId === null) return ''
    const track = album.tracks.find(row => String(row.id) === String(trackId))
    return track ? String(track.track_number) : ''
  }

  const missing = new Map<string, Array<{ credit: AlbumDocument['credits'][number], trackId: RowId | null }>>()
  for (const credit of source.credits) {
    const trackId = albumTrackOf(credit.track_id)
    if (trackId === undefined) continue // the album lacks the track: its row comes first
    const name = nameOf(credit)
    const present = album.credits.some(row => row.role === credit.role && String(row.track_id) === String(trackId)
      && ((typeof credit.artist_id === 'number' && row.artist_id === credit.artist_id) || (name !== '' && sameName(nameOf(row), name))))
    if (present) continue
    missing.set(credit.role, [...missing.get(credit.role) ?? [], { credit, trackId }])
  }

  return [...missing].map(([role, rows]) => {
    const names = new Map<string, string[]>()
    for (const { credit, trackId } of rows) names.set(nameOf(credit), [...names.get(nameOf(credit)) ?? [], trackLabel(trackId)].filter(Boolean))
    const sourceText = [...names].map(([name, tracks]) => tracks.length ? `${name}（曲目 ${tracks.slice(0, 6).join('、')}${tracks.length > 6 ? ' …' : ''}）` : name).join('、')
    const albumNames = [...new Set(album.credits.filter(row => row.role === role).map(nameOf).filter(Boolean))]
    return {
      key: `credits:${role}`, group: 'credits' as const, label: ctx.roleName(role),
      album: albumNames.slice(0, 8).join('、') + (albumNames.length > 8 ? ' …' : ''), source: `补上 ${sourceText}`,
      apply: () => {
        for (const { credit, trackId } of rows) {
          const artist = typeof credit.artist_id === 'string' && credit.artist_id.startsWith('@') ? ctx.createArtist(credit.artist_id) : credit.artist_id
          addCredit(album, { artist_id: artist, credited_as: credit.credited_as, role: credit.role, detail: credit.detail }, trackId === null ? null : [trackId])
        }
      },
    }
  })
}

function linkRows(ctx: CompareContext): CompareRow[] {
  const { album, source } = ctx
  return source.links.filter(link => !album.links.some(row => urlKey(row.url) === urlKey(link.url))).map(link => ({
    key: `link:${link.url}`, group: 'links' as const, label: ctx.providerName(link.link_provider_id), album: '', source: link.url,
    apply: () => {
      if (!album.links.some(row => urlKey(row.url) === urlKey(link.url))) album.links.push({ id: newKey('l'), link_provider_id: link.link_provider_id, url: link.url })
    },
  }))
}

/** Images the album does not use; an image this site never stored counts as one it lacks. */
function imageRows(ctx: CompareContext): CompareRow[] {
  const { album } = ctx
  const inAlbum = (image: HarvestMergedImage) => {
    const id = image.sha256 ? ctx.catalogImages[image.sha256] : undefined
    return id !== undefined && album.images.some(row => row.image_id === id)
  }
  return ctx.images.filter(image => !inAlbum(image)).map(image => ({
    key: `image:${image.url}`, group: 'images' as const, label: IMAGE_KINDS[image.kind] ?? image.kind, album: '',
    source: [image.width && image.height ? `${image.width}×${image.height}` : '', image.local ? '本站有副本' : '要从来源取'].filter(Boolean).join(' · '),
    from: image.source, image,
    apply: async () => {
      const id = await ctx.storeImage(image.url)
      if (album.images.some(row => row.image_id === id)) return
      if (image.kind === 'cover' && !coverOf(album)) setCover(album, id)
      else addImage(album, id, { kind: image.kind })
    },
  }))
}
