import type { ArtistDocument, ArtistImageRow, RowId } from '~/types/document'
import { newKey } from '~/utils/documentKeys'
import { byOrder, nextOrder, sameId } from '~/utils/documentRows'
import { mainImageOf, makeMainImage } from '~/utils/mainImages'

/** The kinds with a main image, each in a slot of its own in the editor (App\Enums\ArtistImageKind). */
export type ArtistImageSlotKind = 'avatar' | 'banner'
export const ARTIST_IMAGE_SLOTS: ArtistImageSlotKind[] = ['avatar', 'banner']

/** The main avatar or banner, if one is marked. */
export const artistImageOf = (doc: ArtistDocument, kind: ArtistImageSlotKind) => mainImageOf(doc.images, kind)

/** Every image but the main avatar and banner, in order: other avatars and banners too. */
export const artistGallery = (doc: ArtistDocument) => {
  const slots = ARTIST_IMAGE_SLOTS.map(kind => artistImageOf(doc, kind))
  return byOrder(doc.images).filter(image => !slots.includes(image))
}

/** An upload in the avatar or banner slot becomes the main one; the old main one stays in the gallery. */
export function setArtistImage(doc: ArtistDocument, kind: ArtistImageSlotKind, imageId: number) {
  const image = doc.images.find(row => row.image_id === imageId && row.kind === kind) ?? addArtistImage(doc, imageId, kind)
  makeMainImage(doc.images, image)
  return image
}

export function addArtistImage(doc: ArtistDocument, imageId: number, kind: string): ArtistImageRow {
  doc.images.push({ id: newKey('i'), image_id: imageId, kind, label: null, caption: null, is_primary: false, sort_order: nextOrder(doc.images) })
  return doc.images[doc.images.length - 1]!
}

export function removeArtistImage(doc: ArtistDocument, rowId: RowId) {
  doc.images = doc.images.filter(image => !sameId(image.id, rowId))
}
