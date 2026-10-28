<template>
  <div class="space-y-2">
    <div
      class="relative aspect-square w-full overflow-hidden rounded-xl border-2"
      :class="coverImage ? 'border-transparent bg-sunken' : error ? 'border-dashed border-danger/40 bg-danger/10' : 'border-dashed border-line bg-sunken'"
    >
      <img v-if="coverImage" :src="coverImage.medium_url" alt="" class="h-full w-full object-cover">
      <div v-else class="flex h-full flex-col items-center justify-center gap-2 p-4 text-center text-meta">
        <ImagePlus :size="28" />
        <!-- The cover row points at an upload that images:prune or an admin removed. -->
        <span class="text-xs" :class="{ 'text-danger': cover?.image_id }">{{ $t(cover?.image_id ? 'editor.image.missing' : 'editor.image.cover_needed') }}</span>
      </div>
      <div v-if="busy" class="absolute inset-0 flex items-center justify-center bg-card/70 text-meta"><span class="loading loading-spinner" /></div>
    </div>
    <div class="flex gap-1.5">
      <label class="btn btn-sm min-w-0 flex-1 cursor-pointer ring-1 ring-inset ring-line shadow-xs transition active:translate-y-px" :class="{ 'btn-disabled': busy }">
        <Upload :size="14" class="shrink-0" /><span class="truncate">{{ $t(coverImage ? 'editor.image.replace' : 'editor.image.upload') }}</span>
        <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" class="hidden" @change="pick">
      </label>
      <UiButton :icon="ClipboardPaste" :label="$t('editor.image.from_clipboard')" icon-class="size-3.5" size="sm" class="ring-1 ring-inset ring-line shadow-xs active:translate-y-px" :disabled="busy" @click="fromClipboard" />
      <UiButton :icon="Link2" :label="$t('editor.image.from_url')" icon-class="size-3.5" size="sm" class="ring-1 ring-inset ring-line shadow-xs active:translate-y-px" @click="openUrl" />
    </div>
    <p v-if="(message && !showUrl) || error" class="text-xs text-danger">{{ message || error }}</p>
    <p class="text-[11px] leading-snug text-meta">{{ $t('editor.image.cover_rules', { size: limits.coverMinSize }) }} {{ $t('editor.image.paste_hint', { keys: pasteKeys }) }}</p>
    <EditorImageImportDialog v-model="showUrl" :busy="busy" :error="message" :description="$t('editor.image.cover_rules', { size: limits.coverMinSize })" @import="fromUrl" />
    <EditorImageCropDialog :file="cropFile" @cropped="uploadCropped" @cancel="cropFile = null" />
  </div>
</template>

<script setup lang="ts">
import type { CatalogImage } from '~/types/catalog'
import { ClipboardPaste, ImagePlus, Link2, Upload } from '@lucide/vue'
import { coverOf, setCover } from '~/utils/albumDocument'

/** The album's cover: upload, paste from the clipboard (the button, or Ctrl+V / ⌘V on the page), crop to a square, or import from a link. */
const editor = useAlbumEditor()
const { t } = useI18n()
const { localizeError } = useLocalizedApiError()
const { limits, upload, importUrl, coverProblem } = useImageUpload()

const cover = computed(() => coverOf(editor.album.value))
const coverImage = computed(() => cover.value ? editor.references.images?.[String(cover.value.image_id)] as CatalogImage | undefined : undefined)
const error = computed(() => editor.errorAt('images'))

const busy = ref(false)
const message = ref('')
const showUrl = ref(false)
const cropFile = ref<File | null>(null)

const problemText = (problem: 'too_small' | 'not_square', fromLink = false) => problem === 'too_small'
  ? t('editor.image.too_small', { size: limits.value.coverMinSize })
  : t(fromLink ? 'editor.image.url_not_square' : 'editor.image.not_square')

const use = (image: CatalogImage) => {
  editor.remember('images', image.id, image)
  setCover(editor.album.value, image.id)
}

const send = async (file: Blob, name: string) => {
  busy.value = true
  try {
    use(await upload(file, name))
  } catch (failure) {
    message.value = localizeError(failure)
  } finally {
    busy.value = false
  }
}

const pick = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  message.value = ''
  if (file) void take(file)
}

/** A chosen or pasted file: too large or too small is refused, a square one is uploaded, any other shape goes to the crop dialog. */
const take = async (file: File) => {
  message.value = ''
  if (file.size > limits.value.maxBytes) {
    message.value = t('editor.image.too_large')
    return
  }
  try {
    const image = await loadImageFile(file)
    URL.revokeObjectURL(image.src)
    const problem = coverProblem(image.naturalWidth, image.naturalHeight)
    if (problem === 'not_square') cropFile.value = file
    else if (problem) message.value = problemText(problem)
    else await send(file, file.name)
  } catch {
    message.value = t('editor.image.unreadable')
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

/** Ctrl+V / ⌘V anywhere on the section takes a pasted image, unless it goes into a text field or an open dialog. */
const onPaste = (event: ClipboardEvent) => {
  const target = event.target as HTMLElement | null
  if (busy.value || target?.closest('input, textarea, [contenteditable="true"], [role="dialog"]')) return
  const file = [...(event.clipboardData?.files ?? [])].find(entry => entry.type.startsWith('image/'))
  if (!file) return
  event.preventDefault()
  void take(file)
}
onMounted(() => document.addEventListener('paste', onPaste))
onBeforeUnmount(() => document.removeEventListener('paste', onPaste))

const uploadCropped = async (blob: Blob) => {
  cropFile.value = null
  await send(blob, blob.type === 'image/webp' ? 'cover.webp' : 'cover.jpg')
}

const openUrl = () => {
  message.value = ''
  showUrl.value = true
}

const fromUrl = async (url: string) => {
  busy.value = true
  message.value = ''
  try {
    const image = await importUrl(url)
    const problem = coverProblem(image.width, image.height)
    if (problem) {
      message.value = problemText(problem, true)
      return
    }
    use(image)
    showUrl.value = false
  } catch (failure) {
    message.value = localizeError(failure)
  } finally {
    busy.value = false
  }
}
</script>
