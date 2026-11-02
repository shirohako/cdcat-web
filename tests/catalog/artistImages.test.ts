import type { ArtistDocument } from '../../app/types/document'
import { describe, expect, it } from 'vitest'
import { addArtistImage, artistGallery, artistImageOf, setArtistImage } from '../../app/utils/artistImages'
import { makeMainImage } from '../../app/utils/mainImages'

const artist = (): ArtistDocument => ({
  name: 'FELT', slug: null, type: 'circle', is_active: true, bio: null, catalog_prefixes: [], titles: [], links: [], attributes: [], relations: [], images: [],
})

describe('artist images', () => {
  it('keeps one main avatar and banner and shows the rest in the gallery', () => {
    const doc = artist()
    setArtistImage(doc, 'avatar', 1)
    const photo = addArtistImage(doc, 2, 'photo')
    const other = addArtistImage(doc, 3, 'avatar')
    expect(artistImageOf(doc, 'avatar')?.image_id).toBe(1)
    expect(artistGallery(doc)).toEqual([photo, other])

    // A slot upload or 用作头像 makes another one main; the old one moves to the gallery.
    makeMainImage(doc.images, other)
    expect(artistImageOf(doc, 'avatar')?.image_id).toBe(3)
    expect(artistGallery(doc).map(image => image.image_id)).toEqual([1, 2])
    setArtistImage(doc, 'banner', 4)
    setArtistImage(doc, 'banner', 5)
    expect(artistImageOf(doc, 'banner')?.image_id).toBe(5)
    expect(artistGallery(doc).map(image => [image.image_id, image.kind, image.is_primary])).toEqual([[1, 'avatar', false], [2, 'photo', false], [4, 'banner', false]])
  })
})
