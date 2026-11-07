import { describe, expect, it } from 'vitest'
import type { AlbumDocument } from '../../app/types/document'
import { addCredit, addDisc, addProduct, addTrack, emptyAlbumDocument } from '../../app/utils/albumDocument'
import { compareWithAlbum, type CompareContext } from '../../app/utils/harvestAlbumCompare'

/** A one-disc album with these tracks (title, seconds). */
const albumWith = (title: string, tracks: Array<[string, number | null]>) => {
  const doc: AlbumDocument = emptyAlbumDocument()
  doc.title = title
  for (const [name, duration] of tracks) addTrack(doc, doc.discs[0]!.id, { title: name, duration })
  return doc
}

const context = (album: AlbumDocument, source: AlbumDocument, extra: Partial<CompareContext> = {}): CompareContext => ({
  album, source, sourceItems: [{ ref: 'hv1', resource_type: 'artist', action: 'create', document: { name: 'New Person' } }],
  picked: { title: 'booth', catalog: null, barcode: null, price: null, tracks: 'vgmdb', description: null },
  images: [], catalogImages: {},
  // The editor names the artists its revision creates (pending), so the one added from the sources reads the same.
  artistName: ref => (ref === 7 ? 'Known Person' : ref === '@hv1' || ref === '@ar1' ? 'New Person' : String(ref)),
  createArtist: () => '@ar1',
  storeImage: async () => 99,
  roleName: role => role, localeName: locale => locale, providerName: () => 'BOOTH',
  formatDate: date => date ?? '', formatDuration: seconds => (seconds === null ? '' : `${seconds}s`),
  ...extra,
})

describe('compareWithAlbum', () => {
  it('lists the fields and tracks the sources say otherwise, and nothing once they are taken', () => {
    const album = albumWith('Stillwater', [['Opening', 60], ['Tide', null]])
    const source = albumWith('Stillwater (Remaster)', [['Opening', 60], ['Tide', 200], ['Ending', 90]])
    addProduct(source, { catalog_number: 'SWR-0001' })
    addProduct(album, { catalog_number: 'SWR 0001' })

    const ctx = context(album, source)
    const rows = compareWithAlbum(ctx)
    expect(rows.map(row => row.key)).toEqual(['title', 'track:1:2', 'track:1:3'])
    expect(rows[0]).toMatchObject({ album: 'Stillwater', source: 'Stillwater (Remaster)', from: 'booth' })
    expect(rows[1]).toMatchObject({ album: 'Tide', source: 'Tide · 200s' })

    for (const row of rows) void row.apply()
    expect(compareWithAlbum(ctx)).toEqual([])
    expect(album.tracks.map(track => [track.title, track.duration])).toEqual([['Opening', 60], ['Tide', 200], ['Ending', 90]])
  })

  it('adds the prices the album lacks to its first edition', () => {
    const album = albumWith('Stillwater', [['Opening', 60]])
    const source = albumWith('Stillwater', [['Opening', 60]])
    const event = { kind: 'event' as const, note: 'M3', amount: '1000.00', currency: 'JPY', tax_included: true }
    const shop = { kind: 'shop' as const, note: null, amount: '1320.00', currency: 'JPY', tax_included: true }
    addProduct(album, { prices: [{ ...event, amount: '1000', note: null }] })
    addProduct(source, { prices: [event, shop] })

    const ctx = context(album, source)
    const rows = compareWithAlbum(ctx)
    expect(rows.map(row => row.key)).toEqual(['price'])
    expect(rows[0]).toMatchObject({ album: '会场价 1000 JPY 含税', source: '会场价 · M3 1000 JPY 含税 / 通贩价 1320 JPY 含税' })

    void rows[0]!.apply()
    expect(album.products[0]!.prices.map(price => [price.kind, price.amount])).toEqual([['event', '1000'], ['shop', '1320.00']])
    expect(compareWithAlbum(ctx)).toEqual([])
  })

  it('adds the credits, links and images the album lacks, creating the new artists once', async () => {
    const album = albumWith('Stillwater', [['Opening', 60]])
    const source = albumWith('Stillwater', [['Opening', 60]])
    addCredit(album, { artist_id: 7, credited_as: null, role: 'composer', detail: null }, [album.tracks[0]!.id])
    addCredit(source, { artist_id: null, credited_as: 'known person', role: 'composer', detail: null }, [source.tracks[0]!.id])
    addCredit(source, { artist_id: '@hv1', credited_as: null, role: 'arranger', detail: null }, [source.tracks[0]!.id])
    source.links.push({ id: 'l1', link_provider_id: 3, url: 'https://booth.pm/ja/items/71/' })
    album.links.push({ id: 'l2', link_provider_id: 3, url: 'http://booth.pm/ja/items/71' })
    source.links.push({ id: 'l3', link_provider_id: 3, url: 'https://example.com/stillwater' })
    const images = [
      { url: 'https://img/1.png', kind: 'cover', width: 600, height: 600, sha256: 'a'.repeat(64), local: true, source: 'booth', referer: '' },
      { url: 'https://img/2.png', kind: 'back', width: 600, height: 600, sha256: 'b'.repeat(64), local: true, source: 'booth', referer: '' },
    ]
    album.images.push({ id: 'i1', image_id: 5, kind: 'cover', label: null, caption: null, product_id: null, bonus_id: null, disc_id: null, is_primary: true })
    const ctx = context(album, source, { images, catalogImages: { ['a'.repeat(64)]: 5 } })

    const rows = compareWithAlbum(ctx)
    expect(rows.map(row => row.key)).toEqual(['credits:arranger', 'link:https://example.com/stillwater', 'image:https://img/2.png'])
    for (const row of rows) await row.apply()
    expect(album.credits.find(credit => credit.role === 'arranger')).toMatchObject({ artist_id: '@ar1', track_id: album.tracks[0]!.id })
    expect(album.images.map(image => [image.image_id, image.kind])).toEqual([[5, 'cover'], [99, 'back']])
    expect(compareWithAlbum({ ...ctx, catalogImages: { ['a'.repeat(64)]: 5, ['b'.repeat(64)]: 99 } })).toEqual([])
  })

  it('tells instruments apart, all 演奏, by the instrument', () => {
    const album = albumWith('Stillwater', [['Opening', 60]])
    const source = albumWith('Stillwater', [['Opening', 60]])
    const [track, sourceTrack] = [album.tracks[0]!.id, source.tracks[0]!.id]
    addCredit(album, { artist_id: 7, credited_as: null, role: 'performer', role_label: 'Guitar', detail: null }, [track])
    addCredit(source, { artist_id: 7, credited_as: null, role: 'performer', role_label: 'Guitar', detail: null }, [sourceTrack])
    addCredit(source, { artist_id: 7, credited_as: null, role: 'performer', role_label: 'Piano', detail: null }, [sourceTrack])

    const rows = compareWithAlbum(context(album, source))
    expect(rows.map(row => row.key)).toEqual(['credits:performer'])
    void rows[0]!.apply()
    expect(album.credits.map(credit => credit.role_label)).toEqual(['Guitar', 'Piano'])
  })

  it('compared with the draft, removes the tracks and discs the source lacks, so its tracklist takes over', () => {
    const album = albumWith('Stillwater', [['Opening', 60], ['Tide', 200], ['Bonus', 30]])
    const second = addDisc(album, { position: 2 })
    addTrack(album, second.id, { title: 'Live', duration: 300 })
    addCredit(album, { artist_id: 7, credited_as: null, role: 'composer', detail: null }, [album.tracks[2]!.id])
    const source = albumWith('Stillwater', [['Opening', 60], ['Tide', 210]])

    expect(compareWithAlbum(context(album, source)).map(row => row.key)).toEqual(['track:1:2'])
    const ctx = context(album, source, { removeExtra: true })
    const rows = compareWithAlbum(ctx)
    expect(rows.map(row => row.key)).toEqual(['track:1:2', `track-extra:${album.tracks[2]!.id}`, `track-extra:${album.tracks[3]!.id}`])
    for (const row of rows) void row.apply()
    expect(album.tracks.map(track => [track.title, track.duration])).toEqual([['Opening', 60], ['Tide', 210]])
    expect(album.discs).toHaveLength(1)
    expect(album.credits).toEqual([])
    expect(compareWithAlbum(ctx)).toEqual([])
  })
})
