/** Whether an image counts as square: width and height differ by at most `tolerance` (2 %, as config/catalog.php). */
export const isSquare = (width: number, height: number, tolerance = 0.02) =>
  width > 0 && height > 0 && Math.abs(width - height) / Math.max(width, height) <= tolerance

/** Covers this close to square are cropped to the centred square without asking; further off, the editor asks. */
export const autoCropTolerance = 0.05

/**
 * What an image would be as the album's main cover (config/catalog.php, docs/catalog/README.md#图片): `square` within
 * the tolerance, used as it is; `near` within autoCropTolerance, cropped to the centre without asking; `off` another
 * shape up to `maxRatio`:1 (plus the tolerance), which the user may keep after a warning or crop; `too_wide` past that,
 * only croppable; `too_small` when the short side is under `minSize`, which cropping can't mend.
 */
export type CoverShape = 'too_small' | 'square' | 'near' | 'off' | 'too_wide'

export const coverShape = (width: number, height: number, { tolerance = 0.02, maxRatio = 2, minSize = 500 } = {}): CoverShape => {
  const short = Math.min(width, height)
  if (!(short >= minSize)) return 'too_small'
  if (isSquare(width, height, tolerance)) return 'square'
  if (isSquare(width, height, autoCropTolerance)) return 'near'
  return Math.max(width, height) <= short * maxRatio * (1 + tolerance) ? 'off' : 'too_wide'
}

/**
 * The shape the album page shows a cover in, as width / height: 1 for a square one (or an unknown size), else its own,
 * kept within 1:2 … 2:1. Everywhere else a cover is cropped to the centred square.
 */
export const coverRatio = (width?: number | null, height?: number | null, tolerance = 0.02) => {
  if (!width || !height || isSquare(width, height, tolerance)) return 1
  return Math.min(2, Math.max(0.5, width / height))
}

/** The largest centred square inside the image, optionally moved by an offset (-1 … 1 of the free space). */
export const squareCrop = (width: number, height: number, offset = 0) => {
  const size = Math.min(width, height)
  const free = Math.max(width, height) - size
  const shift = Math.round((free / 2) * (1 + Math.max(-1, Math.min(1, offset))))
  return width >= height ? { x: shift, y: 0, size } : { x: 0, y: shift, size }
}

/** The output size of a square crop: no larger than `max`, no upscaling. */
export const outputSize = (size: number, max = 3000) => Math.min(size, max)

/** A square crop in image pixels: the top-left corner and the side. */
export interface SquareCrop { x: number, y: number, size: number }

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

/**
 * Keeps a square crop inside the image: the side between `minSize` (or the short side, when that is smaller) and the
 * short side, the corner so the square does not leave the image. Not rounded, so small drags add up.
 */
export const clampCrop = (width: number, height: number, crop: SquareCrop, minSize = 1): SquareCrop => {
  const short = Math.min(width, height)
  const size = clamp(crop.size, Math.min(minSize, short), short)
  return { x: clamp(crop.x, 0, width - size), y: clamp(crop.y, 0, height - size), size }
}

/** The crop resized to `size` around its own centre, then kept inside the image. */
export const resizeCrop = (width: number, height: number, crop: SquareCrop, size: number, minSize = 1): SquareCrop => {
  const centreX = crop.x + crop.size / 2
  const centreY = crop.y + crop.size / 2
  return clampCrop(width, height, { x: centreX - size / 2, y: centreY - size / 2, size }, minSize)
}

/**
 * Draws part of a loaded image to a square in the browser. Resolves to a WebP blob at the server's own quality, which
 * the server stores as uploaded, so the image is compressed once; browsers that can't write WebP get a JPEG.
 */
export const cropToBlob = async (image: HTMLImageElement, { x, y, size }: SquareCrop, max = 3000, quality = 0.95): Promise<Blob> => {
  const output = outputSize(Math.round(size), max)
  const canvas = document.createElement('canvas')
  canvas.width = output
  canvas.height = output
  canvas.getContext('2d')!.drawImage(image, x, y, size, size, 0, 0, output, output)
  const encode = (type: string) => new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('crop failed')), type, quality))
  const webp = await encode('image/webp')
  // A browser without a WebP encoder (Safari) returns a PNG instead.
  return webp.type === 'image/webp' ? webp : encode('image/jpeg')
}

/** Crops a loaded image to its largest square, centred or moved by `offset` (see squareCrop). */
export const cropToSquare = (image: HTMLImageElement, offset = 0, max = 3000, quality = 0.95): Promise<Blob> =>
  cropToBlob(image, squareCrop(image.naturalWidth, image.naturalHeight, offset), max, quality)
