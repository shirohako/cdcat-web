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
    tolerance: schema.value?.limits?.cover_square_tolerance ?? 0.02,
    // A cover of another shape may be at most this many times as long as it is wide, either way (plus the tolerance).
    coverMaxRatio: schema.value?.limits?.cover_max_ratio ?? 2,
    avatarMinSize: schema.value?.limits?.avatar_min_size ?? 200,
    bannerMinWidth: schema.value?.limits?.banner_min_width ?? 1000,
    bannerMinHeight: schema.value?.limits?.banner_min_height ?? 300,
    // Only advice, not checked: 4:1 sits between the album page's strip (about 7.5:1 on a wide screen) and the artist
    // page's (about 4.7:1), so it is stretched and cropped least on both (CommonBannerImage).
    bannerRecommendedWidth: 2400,
    bannerRecommendedHeight: 600,
    maxBytes: schema.value?.limits?.image_max_bytes ?? 25 * 1024 * 1024,
  }))

  /** `purpose: 'profile'` is for the account's own avatar and banner, which needs no content.submit. */
  const upload = (file: Blob, name = 'image.jpg', purpose?: 'profile') => {
    const body = new FormData()
    body.append('file', file, name)
    if (purpose) body.append('purpose', purpose)
    return $api<CatalogImage>('/v1/images', { method: 'POST', body })
  }

  const importUrl = (url: string) => {
    const body = new FormData()
    body.append('url', url)
    return $api<CatalogImage>('/v1/images', { method: 'POST', body })
  }

  /**
   * GET /v1/images/{id}/file: a stored image's file, for cropping it in the browser (the image host sends no CORS
   * headers, so the picture at its address can be shown but not read).
   */
  const fetchFile = async (image: CatalogImage) => {
    const blob = await $api<Blob>(`/v1/images/${image.id}/file`, { responseType: 'blob' })
    const type = blob.type || image.mime
    return new File([blob], `image-${image.id}.${type.split('/')[1] ?? 'webp'}`, { type })
  }

  /** Whether an image can become the album cover: large enough. Any other shape is cropped or kept (useCoverShape). */
  const coverProblem = (width: number, height: number): 'too_small' | null =>
    Math.min(width, height) < limits.value.coverMinSize ? 'too_small' : null

  /** Whether an image may be an artist's avatar: square within the tolerance and large enough. */
  const avatarProblem = (width: number, height: number): 'too_small' | 'not_square' | null => {
    if (Math.min(width, height) < limits.value.avatarMinSize) return 'too_small'
    if (!isSquare(width, height, limits.value.tolerance)) return 'not_square'
    return null
  }

  /** Whether an image may be a main banner: at least banner_min_width wide and banner_min_height tall, of any shape. */
  const bannerFits = (width: number, height: number) => width >= limits.value.bannerMinWidth && height >= limits.value.bannerMinHeight

  return { limits, upload, importUrl, fetchFile, coverProblem, avatarProblem, bannerFits }
}
