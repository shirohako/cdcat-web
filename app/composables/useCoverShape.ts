import type { CatalogImage } from '~/types/catalog'
import { coverShape, cropToSquare } from '~/utils/imageCrop'

/** How the warning was answered: keep the picture's own shape, the crop dialog's square, or nothing (cancelled). */
export type CoverShapeAnswer = { keep: true } | { cropped: Blob } | null

/** The warning about a cover that is not square, which AppCoverShape shows. */
export interface CoverShapeQuestion {
  /** The picture: an upload's object URL, or the stored image's address */
  src: string
  width: number
  height: number
  /** Longer than `maxRatio`:1, so it can only be cropped */
  tooWide: boolean
  /** Straight to the crop dialog, no warning: the cover slot's 裁成正方形 on a cover already in place */
  cropOnly: boolean
  /** The picture as a file for the crop dialog: an upload's own, a stored image's fetched from the site */
  file: () => Promise<File>
  /** The catalog's limits, passed along so the dialog needs no schema of its own */
  minSize: number
  tolerance: number
  maxRatio: number
}

interface CoverShapeRequest extends CoverShapeQuestion {
  resolve: (answer: CoverShapeAnswer) => void
}

/** The question on screen. Only set in the browser, so it is never shared between requests. */
const request = shallowRef<CoverShapeRequest | null>(null)

/** The open question, for AppCoverShape. */
export const useCoverShapeQuestion = () => readonly(request)

/** Settles the open question; used by AppCoverShape. */
export function answerCoverShape(answer: CoverShapeAnswer) {
  const open = request.value
  request.value = null
  open?.resolve(answer)
}

export interface CoverFit {
  image: CatalogImage
  /** Said under the slot when the picture was cropped without asking */
  note?: string
}

const croppedName = (blob: Blob) => `cover.${blob.type === 'image/webp' ? 'webp' : 'jpg'}`

/**
 * Makes a picture fit as the album's main cover, the same way wherever it comes from: a picked or pasted file, a link,
 * the gallery, a harvested image (docs/catalog/README.md#图片). Square (within the tolerance), it is used as it is;
 * nearly square, cropped to the centre without asking; any other shape asks first (AppCoverShape): cancel, crop it to a
 * square, or keep its shape (确定使用非标准比例封面) when it is at most `maxRatio`:1. Too small is refused, as no crop
 * mends it. A file is uploaded, cropped or not; a stored image is used as it is, or its crop uploaded.
 * `crop` goes straight to the crop dialog (a cover already in place); `onBusy` is told while files move.
 * Resolves to the image to use, `{ error }` when there is none, or null when the user cancelled.
 */
export function useCoverShape() {
  const { t } = useI18n()
  const { localizeError } = useLocalizedApiError()
  const { limits, upload, fetchFile } = useImageUpload()

  /** A new question answers an open one with no. */
  const ask = (question: CoverShapeQuestion) => new Promise<CoverShapeAnswer>((resolve) => {
    request.value?.resolve(null)
    request.value = { ...question, resolve }
  })

  const fitCover = async (source: File | CatalogImage, { crop = false, onBusy }: { crop?: boolean, onBusy?: (busy: boolean) => void } = {}): Promise<CoverFit | { error: string } | null> => {
    const stored = source instanceof File ? null : source
    let file = source instanceof File ? source : null
    let picture: HTMLImageElement | null = null
    const busy = async <T>(work: () => Promise<T>) => {
      onBusy?.(true)
      try {
        return await work()
      } finally {
        onBusy?.(false)
      }
    }
    /** The picture's file, fetched from the site once for a stored image */
    const fileOf = async () => file ??= await fetchFile(stored!)
    const send = async (blob: Blob, name: string): Promise<CoverFit | { error: string }> => {
      try {
        return { image: await busy(() => upload(blob, name)) }
      } catch (failure) {
        return { error: localizeError(failure) }
      }
    }
    const kept = () => stored ? { image: stored } : send(file!, file!.name)

    try {
      if (file) {
        try {
          picture = await loadImageFile(file)
        } catch {
          return { error: t('editor.image.unreadable') }
        }
      }
      const width = stored ? stored.width : picture!.naturalWidth
      const height = stored ? stored.height : picture!.naturalHeight
      const rules = { tolerance: limits.value.tolerance, maxRatio: limits.value.coverMaxRatio, minSize: limits.value.coverMinSize }
      const shape = coverShape(width, height, rules)
      if (shape === 'too_small') return { error: t('editor.image.too_small', { size: rules.minSize }) }
      if (!crop && shape === 'square') return await kept()

      if (!crop && shape === 'near') {
        let cropped: Blob
        try {
          cropped = await busy(async () => {
            picture ??= await loadImageFile(await fileOf())
            return cropToSquare(picture)
          })
        } catch {
          return { error: t(stored ? 'editor.cover_shape.fetch_failed' : 'editor.image.unreadable') }
        }
        const fit = await send(cropped, croppedName(cropped))
        const size = Math.min(width, height)
        return 'image' in fit ? { ...fit, note: t('editor.image.auto_cropped', { from: `${width}×${height}`, to: `${size}×${size}` }) } : fit
      }

      // Straight to the crop dialog: the file first, so a failure is said by the slot rather than an empty dialog.
      if (crop) {
        try {
          await busy(fileOf)
        } catch {
          return { error: t('editor.cover_shape.fetch_failed') }
        }
      }
      const answer = await ask({
        src: picture?.src ?? (stored!.medium_url || stored!.url),
        width,
        height,
        tooWide: shape === 'too_wide',
        cropOnly: crop,
        file: fileOf,
        minSize: rules.minSize,
        tolerance: rules.tolerance,
        maxRatio: rules.maxRatio,
      })
      if (!answer) return null
      if ('keep' in answer) return shape === 'too_wide' ? null : await kept()
      return await send(answer.cropped, croppedName(answer.cropped))
    } finally {
      if (picture) URL.revokeObjectURL(picture.src)
    }
  }

  return { fitCover }
}
