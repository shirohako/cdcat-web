/** Whether an image counts as square: width and height differ by at most `tolerance` (1 %). */
export const isSquare = (width: number, height: number, tolerance = 0.01) =>
  width > 0 && height > 0 && Math.abs(width - height) / Math.max(width, height) <= tolerance

/** The largest centred square inside the image, optionally moved by an offset (-1 … 1 of the free space). */
export const squareCrop = (width: number, height: number, offset = 0) => {
  const size = Math.min(width, height)
  const free = Math.max(width, height) - size
  const shift = Math.round((free / 2) * (1 + Math.max(-1, Math.min(1, offset))))
  return width >= height ? { x: shift, y: 0, size } : { x: 0, y: shift, size }
}

/** The output size of a square crop: no larger than `max`, no upscaling. */
export const outputSize = (size: number, max = 3000) => Math.min(size, max)

/**
 * Crops a loaded image to a square in the browser. Resolves to a WebP blob at the server's own quality, which the
 * server stores as uploaded, so the cover is compressed once; browsers that can't write WebP get a JPEG.
 */
export const cropToSquare = async (image: HTMLImageElement, offset = 0, max = 3000, quality = 0.95): Promise<Blob> => {
  const { x, y, size } = squareCrop(image.naturalWidth, image.naturalHeight, offset)
  const output = outputSize(size, max)
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
