<template>
  <div class="space-y-2">
    <div
      class="relative aspect-square w-full overflow-hidden rounded-xl border-2"
      :class="coverImage ? 'border-transparent bg-gray-100' : error ? 'border-dashed border-rose-300 bg-rose-50/60' : 'border-dashed border-gray-300 bg-gray-50'"
    >
      <img v-if="coverImage" :src="coverImage.medium_url" alt="" class="h-full w-full object-cover">
      <div v-else class="flex h-full flex-col items-center justify-center gap-2 p-4 text-center text-gray-400">
        <ImagePlus :size="28" />
        <span class="text-xs">{{ $t('editor.image.cover_needed') }}</span>
      </div>
      <div v-if="busy" class="absolute inset-0 flex items-center justify-center bg-white/70"><span class="loading loading-spinner" /></div>
    </div>
    <div class="flex gap-1.5">
      <label class="btn btn-sm min-w-0 flex-1 cursor-pointer" :class="{ 'btn-disabled': busy }">
        <Upload :size="14" class="shrink-0" /><span class="truncate">{{ $t(coverImage ? 'editor.image.replace' : 'editor.image.upload') }}</span>
        <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" class="hidden" @change="pick">
      </label>
      <button type="button" class="btn btn-ghost btn-sm px-2" :title="$t('editor.image.from_url')" @click="showUrl = !showUrl"><Link2 :size="14" /></button>
    </div>
    <div v-if="showUrl" class="flex gap-1.5">
      <input v-model.trim="url" type="url" class="input input-sm min-w-0 flex-1" placeholder="https://" @keydown.enter.prevent="fromUrl">
      <button type="button" class="btn btn-sm" :disabled="!url || busy" @click="fromUrl">{{ $t('editor.image.import') }}</button>
    </div>
    <p v-if="message || error" class="text-xs text-error">{{ message || error }}</p>
    <p class="text-[11px] leading-snug text-gray-400">{{ $t('editor.image.cover_rules', { size: limits.coverMinSize }) }}</p>
    <EditorImageCropDialog :file="cropFile" @cropped="uploadCropped" @cancel="cropFile = null" />
  </div>
</template>

<script setup lang="ts">
import type { CatalogImage } from '~/types/catalog'
import { ImagePlus, Link2, Upload } from '@lucide/vue'
import { coverOf, setCover } from '~/utils/albumDocument'

/** The album's cover: upload, crop to a square, or import from a link. */
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
const url = ref('')
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

const pick = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  message.value = ''
  if (!file) return
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

const uploadCropped = async (blob: Blob) => {
  cropFile.value = null
  await send(blob, 'cover.jpg')
}

const fromUrl = async () => {
  if (!url.value) return
  busy.value = true
  message.value = ''
  try {
    const image = await importUrl(url.value)
    const problem = coverProblem(image.width, image.height)
    if (problem) {
      message.value = problemText(problem, true)
      return
    }
    use(image)
    url.value = ''
    showUrl.value = false
  } catch (failure) {
    message.value = localizeError(failure)
  } finally {
    busy.value = false
  }
}
</script>
