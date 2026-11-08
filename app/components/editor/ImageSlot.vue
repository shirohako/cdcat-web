<template>
  <div class="min-w-0 space-y-2">
    <!-- The cover square, the avatar round as on the artist page, the banner wide as the top of a page. -->
    <div
      class="relative w-full overflow-hidden border-2"
      :class="[
        variant === 'avatar' ? 'aspect-square rounded-full' : variant === 'banner' ? 'aspect-[3/1] rounded-xl' : 'aspect-square rounded-xl',
        file || previewUrl ? 'border-transparent bg-sunken' : error ? 'border-dashed border-danger/40 bg-danger/10' : 'border-dashed border-line bg-sunken',
      ]"
    >
      <CommonBannerImage v-if="file && variant === 'banner'" :image="file" sizes="(min-width: 768px) 50vw, 100vw" />
      <img v-else-if="file" :src="file.medium_url" alt="" class="h-full w-full object-cover">
      <img v-else-if="previewUrl" :src="previewUrl" alt="" class="h-full w-full object-cover">
      <div v-else class="flex h-full flex-col items-center justify-center gap-1.5 p-3 text-center text-meta">
        <ImagePlus :size="variant === 'cover' ? 28 : 22" />
        <!-- The row points at an upload that images:prune or an admin removed. -->
        <span class="text-xs" :class="{ 'text-danger': missing }">{{ missing ? $t('editor.image.missing') : texts.empty }}</span>
      </div>
      <div v-if="busy" class="absolute inset-0 flex items-center justify-center bg-card/70 text-meta"><span class="loading loading-spinner" /></div>
    </div>
    <div class="flex gap-1.5">
      <label class="btn btn-sm min-w-0 flex-1 cursor-pointer ring-1 ring-inset ring-line shadow-xs transition active:translate-y-px" :class="{ 'btn-disabled': busy }">
        <Upload :size="14" class="shrink-0" /><span class="truncate">{{ file || previewUrl ? $t('editor.image.replace') : texts.upload }}</span>
        <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" class="hidden" @change="pick">
      </label>
      <UiButton :icon="ClipboardPaste" :label="$t('editor.image.from_clipboard')" icon-class="size-3.5" size="sm" class="ring-1 ring-inset ring-line shadow-xs active:translate-y-px" :disabled="busy" @click="fromClipboard" />
      <UiButton v-if="purpose !== 'profile'" :icon="Link2" :label="$t('editor.image.from_url')" icon-class="size-3.5" size="sm" class="ring-1 ring-inset ring-line shadow-xs active:translate-y-px" :disabled="busy" @click="openUrl" />
      <UiButton v-if="removable && (file || missing || previewUrl)" variant="danger-soft" :icon="Trash2" :label="$t('editor.image.remove')" icon-class="size-3.5" size="sm" class="ring-1 ring-inset ring-danger/20 shadow-xs active:translate-y-px" :disabled="busy" @click="remove" />
    </div>
    <p v-if="(message && !showUrl) || error" class="text-xs text-danger">{{ message || error }}</p>
    <p v-else-if="note" class="text-xs text-meta">{{ note }}</p>
    <p class="text-11 leading-snug text-meta">{{ texts.rules }}<template v-if="pasteOnPage"> {{ $t('editor.image.paste_hint', { keys: pasteKeys }) }}</template></p>
    <EditorImageImportDialog v-if="purpose !== 'profile'" v-model="showUrl" :busy="busy" :error="message" :description="texts.rules" @import="fromUrl" />
    <EditorImageCropDialog v-if="variant !== 'banner'" :file="cropFile" :hint="texts.cropHint" :round="variant === 'avatar'" :min-size="minSize" :tolerance="limits.tolerance" @cropped="uploadCropped" @cancel="cropFile = null" />
  </div>
</template>

<script setup lang="ts">
import type { CatalogImage } from '~/types/catalog'
import { ClipboardPaste, ImagePlus, Link2, Trash2, Upload } from '@lucide/vue'
import { autoCropTolerance, cropToSquare, isSquare } from '~/utils/imageCrop'

/**
 * The slot of a main image: an album's cover or banner, an artist's avatar or banner. Upload, paste from the clipboard
 * (the button, or Ctrl+V / ⌘V on the page with `paste-on-page`) or import from a link; what fits is handed on with
 * `use`, whoever owns the slot decides what becomes of the old one. A cover or avatar is square: an avatar always goes
 * to the crop dialog (to pick the part to keep, even of a square one); a nearly square cover is cropped to the centre,
 * any other shape goes to the crop dialog. A banner is taken as it is, when it is big enough.
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
      return { empty: t('editor.image.cover_needed'), upload: t('editor.image.upload'), rules: t('editor.image.cover_rules', { size: minSize.value }), notSquare: t('editor.image.not_square'), cropHint: undefined }
  }
})

const busy = ref(false)
const message = ref('')
const note = ref('')
const showUrl = ref(false)
const cropFile = ref<File | null>(null)

/** Why an image of this size cannot go in the slot, or '' when it can; a square one that is too far off can be cropped. */
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

/**
 * A chosen or pasted file: too large, too small or (a banner) too narrow is refused; an avatar goes to the crop dialog;
 * a square cover is uploaded, a nearly square one is cropped to the centred square and uploaded, any other shape goes
 * to the crop dialog.
 */
const take = async (picked: File) => {
  message.value = ''
  note.value = ''
  if (picked.size > limits.value.maxBytes) {
    message.value = t('editor.image.too_large')
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
    if (square.value && Math.min(width, height) >= minSize.value && (props.variant === 'avatar' || !isSquare(width, height, limits.value.tolerance))) {
      if (props.variant === 'avatar' || !isSquare(width, height, autoCropTolerance)) {
        cropFile.value = picked
        return
      }
      const size = Math.min(width, height)
      await uploadCropped(await cropToSquare(image))
      // The upload's own error, if any, shows instead.
      if (!message.value) note.value = t('editor.image.auto_cropped', { from: `${width}×${height}`, to: `${size}×${size}` })
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

const fromUrl = async (url: string) => {
  busy.value = true
  message.value = ''
  try {
    const image = await importUrl(url)
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
