import type { CatalogImage } from '~/types/catalog'
import { isSquare } from '~/utils/imageCrop'

/** Loads a local file into an <img> to read its size before uploading. */
export const loadImageFile = (file: Blob) => new Promise<HTMLImageElement>((resolve, reject) => {
  const url = URL.createObjectURL(file)
  const image = new Image()
  image.onload = () => resolve(image)
  image.onerror = () => {
    URL.revokeObjectURL(url)
    reject(new Error('not an image'))
  }
  image.src = url
})

/** POST /v1/images: uploads a file or imports a public URL (docs/api/images.md). */
export const useImageUpload = () => {
  const { $api } = useNuxtApp()
  const { schema } = useCatalogSchema()

  const limits = computed(() => ({
    coverMinSize: schema.value?.limits?.cover_min_size ?? 500,
    tolerance: schema.value?.limits?.cover_square_tolerance ?? 0.01,
    maxBytes: schema.value?.limits?.image_max_bytes ?? 25 * 1024 * 1024,
  }))

  const upload = (file: Blob, name = 'image.jpg') => {
    const body = new FormData()
    body.append('file', file, name)
    return $api<CatalogImage>('/v1/images', { method: 'POST', body })
  }

  const importUrl = (url: string) => {
    const body = new FormData()
    body.append('url', url)
    return $api<CatalogImage>('/v1/images', { method: 'POST', body })
  }

  /** Whether an image may be the album cover: square within the tolerance and large enough. */
  const coverProblem = (width: number, height: number): 'too_small' | 'not_square' | null => {
    if (Math.min(width, height) < limits.value.coverMinSize) return 'too_small'
    if (!isSquare(width, height, limits.value.tolerance)) return 'not_square'
    return null
  }

  return { limits, upload, importUrl, coverProblem }
}
