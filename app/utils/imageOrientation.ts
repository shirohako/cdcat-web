export type ImageOrientation = 'portrait' | 'landscape' | 'square'

/** Orientation from a stored pixel size; null while the size is unknown. */
export const imageOrientation = (width?: number | null, height?: number | null): ImageOrientation | null => {
  if (!width || !height) return null
  const ratio = width / height
  if (ratio > 1.05) return 'landscape'
  if (ratio < 0.95) return 'portrait'
  return 'square'
}

/** CSS aspect-ratio for a stored pixel size, so the box is sized before the image loads. */
export const imageAspectRatio = (width?: number | null, height?: number | null, fallback = '3 / 4') =>
  width && height ? `${width} / ${height}` : fallback
