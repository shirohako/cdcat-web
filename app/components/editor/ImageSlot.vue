<template>
  <div class="min-w-0 space-y-2">
    <!-- The cover square, the avatar round as on the artist page, the banner wide as the top of a page. The whole box
         picks a file, as the upload button does. -->
    <label
      :for="inputId"
      class="group relative block w-full cursor-pointer overflow-hidden border-2 transition-colors"
      :class="[
        variant === 'avatar' ? 'aspect-square rounded-full' : variant === 'banner' ? 'aspect-[3/1] rounded-xl' : 'aspect-square rounded-xl',
        file || previewUrl ? 'border-transparent bg-sunken hover:border-primary/40' : error ? 'border-dashed border-danger/40 bg-danger/10 hover:border-danger/70' : 'border-dashed border-line bg-sunken hover:border-primary/50',
        busy && 'pointer-events-none',
      ]"
    >
      <CommonBannerImage v-if="file && variant === 'banner'" :image="file" sizes="(min-width: 768px) 50vw, 100vw" />
      <img v-else-if="file" :src="file.thumbnail_url" alt="" class="h-full w-full" :class="otherShape ? 'object-contain' : 'object-cover'">
      <img v-else-if="previewUrl" :src="previewUrl" alt="" class="h-full w-full object-cover">
      <span v-else class="flex h-full flex-col items-center justify-center gap-1.5 p-3 text-center text-meta transition-colors group-hover:text-primary">
        <ImagePlus :size="variant === 'cover' ? 28 : 22" />
        <!-- The row points at an upload that images:prune or an admin removed. -->
        <span class="text-xs" :class="{ 'text-danger': missing }">{{ missing ? $t('editor.image.missing') : texts.empty }}</span>
      </span>
      <span v-if="busy" class="absolute inset-0 flex items-center justify-center bg-card/70 text-meta"><span class="loading loading-spinner" /></span>
    </label>
    <div class="flex gap-1.5">
      <label class="btn btn-sm min-w-0 flex-1 cursor-pointer ring-1 ring-inset ring-line shadow-xs transition active:translate-y-px" :class="{ 'btn-disabled': busy }">
        <Upload :size="14" class="shrink-0" /><span class="truncate">{{ file || previewUrl ? $t('editor.image.replace') : texts.upload }}</span>
        <input :id="inputId" type="file" accept="image/jpeg,image/png,image/webp,image/avif" class="hidden" :disabled="busy" @change="pick">
      </label>
      <UiButton :icon="ClipboardPaste" :label="$t('editor.image.from_clipboard')" icon-class="size-3.5" size="sm" class="ring-1 ring-inset ring-line shadow-xs active:translate-y-px" :disabled="busy" @click="fromClipboard" />
      <UiButton v-if="purpose !== 'profile'" :icon="Link2" :label="$t('editor.image.from_url')" icon-class="size-3.5" size="sm" class="ring-1 ring-inset ring-line shadow-xs active:translate-y-px" :disabled="busy" @click="openUrl" />
      <UiButton v-if="removable && (file || missing || previewUrl)" variant="danger-soft" :icon="Trash2" :label="$t('editor.image.remove')" icon-class="size-3.5" size="sm" class="ring-1 ring-inset ring-danger/20 shadow-xs active:translate-y-px" :disabled="busy" @click="remove" />
    </div>
    <p v-if="(message && !showUrl) || error" class="text-xs text-danger">{{ message || error }}</p>
    <p v-else-if="note" class="text-xs text-meta">{{ note }}</p>
    <!-- A cover kept at its own shape: what that means, and the way back to a square. -->
    <p v-if="otherShape && file" class="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-meta">
      <span>{{ $t('editor.cover_shape.slot_note', { size: `${file.width} × ${file.height}` }) }}</span>
      <UiButton size="xs" class="ring-1 ring-inset ring-line shadow-xs active:translate-y-px" :disabled="busy" @click="recrop">{{ $t('editor.cover_shape.crop') }}</UiButton>
    </p>
    <p class="text-11 leading-snug text-meta">{{ texts.rules }}<template v-if="pasteOnPage"> {{ $t('editor.image.paste_hint', { keys: pasteKeys }) }}</template></p>
    <EditorImageImportDialog v-if="purpose !== 'profile'" v-model="showUrl" :busy="busy" :error="message" :description="texts.rules" @import="fromUrl" />
    <EditorImageCropDialog v-if="variant === 'avatar'" :file="cropFile" :hint="texts.cropHint" round :min-size="minSize" :tolerance="limits.tolerance" @cropped="uploadCropped" @cancel="cropFile = null" />
  </div>
</template>

<script setup lang="ts">
import type { CatalogImage } from '~/types/catalog'
import type { CoverFit } from '~/composables/useCoverShape'
import { ClipboardPaste, ImagePlus, Link2, Trash2, Upload } from '@lucide/vue'
import { isSquare } from '~/utils/imageCrop'

/**
 * The slot of a main image: an album's cover or banner, an artist's avatar or banner. Upload, paste from the clipboard
 * (the button, or Ctrl+V / ⌘V on the page with `paste-on-page`) or import from a link; what fits is handed on with
 * `use`, whoever owns the slot decides what becomes of the old one. An avatar is square and always goes to the crop
 * dialog (to pick the part to keep, even of a square one). A cover goes through useCoverShape: square is used, nearly
 * square cropped to the centre, any other shape asks (crop it, or keep its shape); one kept at its own shape is shown
 * whole here, with a note and a button to crop it after all. A banner is taken as it is, when it is big enough.
 * The account settings use it too, for the user's own avatar and banner (`purpose="profile"`: upload or paste, no link).
 */
const props = defineProps<{
  variant: 'cover' | 'avatar' | 'banner'
  /** The main image now, if any */
  file?: CatalogImage | null
  /** Shown when there is no `file`: a picture that is not an upload (a default avatar, an address from before uploads) */
  previewUrl?: string | null
  /** There is a main image, but its upload is gone */
  missing?: boolean
  error?: string | null
  /** Shows a button that hands on `remove` */
  removable?: boolean
  pasteOnPage?: boolean
  /** Uploads for the account's own pictures, which need no content.submit and cannot come from a link */
  purpose?: 'profile'
}>()
const emit = defineEmits<{ use: [image: CatalogImage], remove: [] }>()

const { t } = useI18n()
const { localizeError } = useLocalizedApiError()
const { limits, upload, importUrl, bannerFits } = useImageUpload()
const { fitCover } = useCoverShape()

const square = computed(() => props.variant !== 'banner')
const minSize = computed(() => props.variant === 'avatar' ? limits.value.avatarMinSize : limits.value.coverMinSize)
const texts = computed(() => {
  const banner = { width: limits.value.bannerMinWidth, height: limits.value.bannerMinHeight }
  switch (props.variant) {
    case 'avatar':
      return { empty: t('editor.artist_image.avatar_empty'), upload: t('editor.artist_image.upload_avatar'), rules: t('editor.artist_image.avatar_rules', { size: minSize.value }), notSquare: t('editor.artist_image.avatar_not_square'), cropHint: t('editor.artist_image.crop_hint') }
    case 'banner':
      return { empty: t('editor.image.banner_empty'), upload: t('editor.image.upload_banner'), rules: `${t('editor.image.banner_rules', banner)} ${t('editor.image.banner_recommended', { width: limits.value.bannerRecommendedWidth, height: limits.value.bannerRecommendedHeight })}`, notSquare: '', cropHint: undefined }
    default:
      return { empty: t('editor.image.cover_needed'), upload: t('editor.image.upload'), rules: t('editor.image.cover_rules', { size: minSize.value, ratio: `${limits.value.coverMaxRatio}:1` }), notSquare: '', cropHint: undefined }
  }
})

const inputId = useId()
const busy = ref(false)
const message = ref('')
const note = ref('')
const showUrl = ref(false)
const cropFile = ref<File | null>(null)
/** The cover in the slot was kept at a shape other than square. */
const otherShape = computed(() => props.variant === 'cover' && !!props.file && !isSquare(props.file.width, props.file.height, limits.value.tolerance))

/** Why an avatar or banner of this size cannot go in the slot, or '' when it can (covers: useCoverShape). */
const problem = (width: number, height: number, fromLink = false) => {
  if (!square.value) return bannerFits(width, height) ? '' : t('editor.image.banner_too_small', { width: limits.value.bannerMinWidth, height: limits.value.bannerMinHeight })
  if (Math.min(width, height) < minSize.value) return t('editor.image.too_small', { size: minSize.value })
  if (!isSquare(width, height, limits.value.tolerance)) return fromLink ? t('editor.image.url_not_square') : texts.value.notSquare
  return ''
}

const send = async (blob: Blob, name: string) => {
  busy.value = true
  try {
    emit('use', await upload(blob, name, props.purpose))
  } catch (failure) {
    message.value = localizeError(failure)
  } finally {
    busy.value = false
  }
}

const remove = () => {
  message.value = ''
  note.value = ''
  emit('remove')
}

const pick = (event: Event) => {
  const input = event.target as HTMLInputElement
  const picked = input.files?.[0]
  input.value = ''
  if (picked) void take(picked)
}

const onBusy = (value: boolean) => { busy.value = value }
/** What useCoverShape made of a cover: used (with a note when it was cropped without asking), refused, or cancelled. */
const useFit = (fit: CoverFit | { error: string } | null) => {
  if (!fit) return
  if ('error' in fit) {
    message.value = fit.error
    return
  }
  emit('use', fit.image)
  if (fit.note) note.value = fit.note
}

/**
 * A chosen or pasted file: too large is refused; a cover goes to useCoverShape; an avatar big enough goes to the crop
 * dialog; anything else too small or (a banner) too narrow is refused.
 */
const take = async (picked: File) => {
  message.value = ''
  note.value = ''
  if (picked.size > limits.value.maxBytes) {
    message.value = t('editor.image.too_large')
    return
  }
  if (props.variant === 'cover') {
    useFit(await fitCover(picked, { onBusy }))
    return
  }
  let image: HTMLImageElement
  try {
    image = await loadImageFile(picked)
  } catch {
    message.value = t('editor.image.unreadable')
    return
  }
  try {
    const { naturalWidth: width, naturalHeight: height } = image
    if (props.variant === 'avatar' && Math.min(width, height) >= minSize.value) {
      cropFile.value = picked
      return
    }
    message.value = problem(width, height)
    if (!message.value) await send(picked, picked.name)
  } catch {
    message.value = t('editor.image.unreadable')
  } finally {
    URL.revokeObjectURL(image.src)
  }
}

const pasteKeys = import.meta.client && /Mac|iPhone|iPad/.test(navigator.userAgent) ? '⌘V' : 'Ctrl+V'
const named = (blob: Blob) => new File([blob], `pasted.${blob.type.split('/')[1] ?? 'png'}`, { type: blob.type })

/** The clipboard button. Browsers that refuse to read it (or ask and are told no) are pointed at the paste keys. */
const fromClipboard = async () => {
  message.value = ''
  if (!navigator.clipboard?.read) {
    message.value = t('editor.image.clipboard_denied', { keys: pasteKeys })
    return
  }
  try {
    for (const item of await navigator.clipboard.read()) {
      const type = item.types.find(value => value.startsWith('image/'))
      if (type) return await take(named(await item.getType(type)))
    }
    message.value = t('editor.image.clipboard_empty')
  } catch {
    message.value = t('editor.image.clipboard_denied', { keys: pasteKeys })
  }
}

/** With `paste-on-page`, Ctrl+V / ⌘V anywhere takes a pasted image, unless it goes into a text field or an open dialog. */
const onPaste = (event: ClipboardEvent) => {
  const target = event.target as HTMLElement | null
  if (busy.value || target?.closest('input, textarea, [contenteditable="true"], [role="dialog"]')) return
  const pasted = [...(event.clipboardData?.files ?? [])].find(entry => entry.type.startsWith('image/'))
  if (!pasted) return
  event.preventDefault()
  void take(pasted)
}
onMounted(() => { if (props.pasteOnPage) document.addEventListener('paste', onPaste) })
onBeforeUnmount(() => document.removeEventListener('paste', onPaste))

const uploadCropped = async (blob: Blob) => {
  cropFile.value = null
  // The dialog hands back the picked file itself when it was left whole and square enough.
  await send(blob, blob instanceof File ? blob.name : `${props.variant}.${blob.type === 'image/webp' ? 'webp' : 'jpg'}`)
}

const openUrl = () => {
  message.value = ''
  note.value = ''
  showUrl.value = true
}

/** The slot's 裁成正方形 under a cover kept at its own shape: the crop dialog, its square uploaded as the new cover. */
const recrop = async () => {
  if (!props.file || busy.value) return
  message.value = ''
  note.value = ''
  useFit(await fitCover(props.file, { crop: true, onBusy }))
}

const fromUrl = async (url: string) => {
  busy.value = true
  message.value = ''
  try {
    const image = await importUrl(url)
    if (props.variant === 'cover') {
      // Too small is said in the link dialog; any other shape is for useCoverShape, once the link dialog is closed.
      if (Math.min(image.width, image.height) < minSize.value) {
        message.value = t('editor.image.too_small', { size: minSize.value })
        return
      }
      showUrl.value = false
      busy.value = false
      useFit(await fitCover(image, { onBusy }))
      return
    }
    message.value = problem(image.width, image.height, true)
    if (message.value) return
    emit('use', image)
    showUrl.value = false
  } catch (failure) {
    message.value = localizeError(failure)
  } finally {
    busy.value = false
  }
}
</script>
