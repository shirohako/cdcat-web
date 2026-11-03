/** Whether an image counts as square: width and height differ by at most `tolerance` (2 %, as config/catalog.php). */
export const isSquare = (width: number, height: number, tolerance = 0.02) =>
  width > 0 && height > 0 && Math.abs(width - height) / Math.max(width, height) <= tolerance

/** Covers this close to square are cropped to the centred square without asking; further off, the crop dialog opens. */
export const autoCropTolerance = 0.05

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
