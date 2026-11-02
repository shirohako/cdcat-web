import { describe, expect, it } from 'vitest'
import type { AlbumDocument } from '../../app/types/document'
import { addCredit, addProduct, addTrack, emptyAlbumDocument } from '../../app/utils/albumDocument'
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
})
