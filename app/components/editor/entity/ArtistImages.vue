<template>
  <CatalogSection :title="$t('editor.album.section.images')" :icon="Images">
    <div class="space-y-5 p-3 sm:p-5">
      <ul v-if="collectionErrors.length" class="space-y-0.5 rounded-lg border border-danger/25 bg-danger/10 px-3 py-2 text-xs text-danger">
        <li v-for="error in collectionErrors" :key="error.path">{{ error.message }}</li>
      </ul>

      <!-- The main avatar, round as on the artist page, beside the main banner; the gallery below has every other image,
           other avatars and banners too, and makes one of them the main one only with 用作头像 / 用作横幅. -->
      <div class="grid gap-5 sm:grid-cols-[12rem_minmax(0,1fr)]">
        <div v-for="slot in slots" :key="slot.kind" :class="slot.kind === 'avatar' && 'max-w-48'">
          <p class="mb-1.5 text-sm font-medium text-body">{{ $t(`editor.artist_image.${slot.kind}`) }}</p>
          <EditorImageSlot
            :variant="slot.kind"
            :file="slot.file"
            :missing="!!slot.row && !slot.file"
            :error="slot.row ? editor.errorAt('images', slot.row.id, 'image_id') : null"
            removable
            @use="image => useSlot(slot.kind, image)"
            @remove="slot.row && removeArtistImage(doc, slot.row.id)"
          />
        </div>
      </div>

      <div>
        <p class="mb-1.5 flex items-baseline gap-1.5 text-sm font-medium text-body">
          {{ $t('editor.image.gallery') }}<span v-if="gallery.length" class="text-xs tabular-nums text-meta">{{ gallery.length }}</span>
        </p>
        <div
          class="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors"
          :class="dropping ? 'border-primary bg-primary/5' : 'border-line bg-sunken'"
          @dragenter="filesOver"
          @dragover="filesOver"
          @dragleave="filesLeave"
          @drop="dropFiles"
        >
          <ImageUp :size="26" class="text-meta" />
          <div class="space-y-1">
            <p class="text-sm font-medium text-title">{{ $t('editor.image.drop_hint') }}</p>
            <p class="text-xs text-meta">{{ $t('editor.artist_image.gallery_hint') }}</p>
            <p class="text-xs text-meta">{{ $t('editor.artist_image.main_hint') }}</p>
          </div>
          <div class="flex flex-wrap justify-center gap-2">
            <label class="btn btn-add btn-sm cursor-pointer gap-1.5" :class="{ 'btn-disabled': uploading > 0 }">
              <Upload :size="14" />{{ $t('editor.image.upload_many') }}
              <input type="file" multiple :accept="ACCEPTED.join(',')" class="hidden" @change="pick">
            </label>
            <UiButton variant="add" :icon="Link2" icon-class="size-3.5" size="sm" class="gap-1.5" @click="openUrl">{{ $t('editor.image.from_url') }}</UiButton>
          </div>
          <p v-if="uploading" class="flex items-center gap-1.5 text-xs text-meta"><span class="loading loading-spinner loading-xs" />{{ $t('editor.image.uploading', { count: uploading }) }}</p>
        </div>
        <ul v-if="failures.length" class="mt-2 space-y-0.5 text-xs text-danger">
          <li v-for="failure in failures" :key="failure">{{ failure }}</li>
        </ul>
      </div>

      <ul v-if="gallery.length" class="space-y-2">
        <EditorEntityArtistImageCard
          v-for="(image, index) in gallery"
          :key="image.id"
          :image-id="image.id"
          :first="index === 0"
          :last="index === gallery.length - 1"
          :draggable="grabbed !== null && sameId(grabbed, image.id)"
          :dragging="dragged !== null && sameId(dragged, image.id)"
          :drop-edge="dropEdge(image)"
          @grab="grab(image)"
          @move="move(image, $event)"
          @dragstart="startDrag(image, $event)"
          @dragover="overRow(image, $event)"
          @drop.prevent="dropOn(image)"
          @dragend="endDrag"
        />
      </ul>
      <p v-else class="text-sm text-meta">{{ $t('editor.image.none') }}</p>

      <EditorImageImportDialog v-model="urlOpen" :busy="importing" :error="urlError" @import="fromUrl">
        <label class="block">
          <span class="mb-1 block text-sm font-medium text-body">{{ $t('catalog.field.kind') }}</span>
          <UiSelect v-model="urlKind" :options="kindOptions()" size="sm" class="w-full" />
        </label>
      </EditorImageImportDialog>
    </div>
  </CatalogSection>
</template>

<script setup lang="ts">
import type { CatalogImage } from '~/types/catalog'
import type { ArtistDocument, ArtistImageRow } from '~/types/document'
import type { ArtistImageSlotKind } from '~/utils/artistImages'
import { ImageUp, Images, Link2, Upload } from '@lucide/vue'
import { ARTIST_IMAGE_SLOTS, addArtistImage, artistGallery, artistImageOf, removeArtistImage, setArtistImage } from '~/utils/artistImages'
import { placeRow, sameId } from '~/utils/documentRows'

/**
 * 图片 of the artist editor: the main avatar and banner in slots of their own, then the gallery (photos, other avatars …),
 * each with a kind, a label and a caption, in the order shown on the artist page.
 */
const editor = useEntityEditor()
const { t } = useI18n()
const { localizeError } = useLocalizedApiError()
const { limits, upload, importUrl } = useImageUpload()
const kindOptions = useArtistImageKindOptions()

const doc = computed(() => editor.doc.value as unknown as ArtistDocument)
const gallery = computed(() => artistGallery(doc.value))
const slots = computed(() => ARTIST_IMAGE_SLOTS.map((kind) => {
  const row = artistImageOf(doc.value, kind)
  return { kind, row, file: row ? editor.references.images?.[String(row.image_id)] as CatalogImage | undefined : undefined }
}))
/** An upload in a slot becomes the main one; the one before stays in the gallery. */
const useSlot = (kind: ArtistImageSlotKind, image: CatalogImage) => {
  editor.remember('images', image.id, image)
  setArtistImage(doc.value, kind, image.id)
}
// "At most one avatar" and the like; the rows' own errors show on them.
const collectionErrors = computed(() => editor.errorsIn('images').filter(error => error.path.split('.').length === 3))

/** Puts the row before the gallery row at `index` (last when there is none); the slots' places among the rows don't count. */
const placeAt = (image: ArtistImageRow, index: number) => placeRow(doc.value.images, image, gallery.value[index] ?? null)
const { grabbed, dragged, grab, move, startDrag, overRow, dropOn, endDrag, dropEdge } = useRowDrag(() => gallery.value, placeAt)

/** New images are illustrations for virtual singers and characters, photos for everyone else. */
const defaultKind = computed(() => doc.value.type === 'virtual' || doc.value.type === 'character' ? 'illustration' : 'photo')

const place = (image: CatalogImage, kind: string) => {
  editor.remember('images', image.id, image)
  if (doc.value.images.some(row => row.image_id === image.id && row.kind === kind)) editor.notify(t('editor.image.already_added'), 'info')
  else addArtistImage(doc.value, image.id, kind)
}

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']
const uploading = ref(0)
const failures = ref<string[]>([])

/** Uploads into the gallery, one after another. */
const uploadFiles = async (files: File[]) => {
  failures.value = []
  for (const file of files) {
    if (!ACCEPTED.includes(file.type)) {
      failures.value.push(`${file.name}: ${t('editor.image.unreadable')}`)
      continue
    }
    if (file.size > limits.value.maxBytes) {
      failures.value.push(`${file.name}: ${t('editor.image.too_large')}`)
      continue
    }
    uploading.value++
    try {
      place(await upload(file, file.name), defaultKind.value)
    } catch (error) {
      failures.value.push(`${file.name}: ${localizeError(error)}`)
    } finally {
      uploading.value--
    }
  }
}

const pick = (event: Event) => {
  const input = event.target as HTMLInputElement
  const files = [...(input.files ?? [])]
  input.value = ''
  return uploadFiles(files)
}

// Files dropped on the drop area; a row being reordered is no file, so it isn't taken.
const dropping = ref(false)
const carriesFiles = (event: DragEvent) => !!event.dataTransfer?.types.includes('Files')
const filesOver = (event: DragEvent) => {
  if (!carriesFiles(event)) return
  event.preventDefault()
  dropping.value = true
}
const filesLeave = (event: DragEvent) => {
  if (!(event.currentTarget as Node).contains(event.relatedTarget as Node | null)) dropping.value = false
}
const dropFiles = (event: DragEvent) => {
  if (!carriesFiles(event)) return
  event.preventDefault()
  dropping.value = false
  void uploadFiles([...(event.dataTransfer?.files ?? [])])
}

const importing = ref(false)
const urlOpen = ref(false)
const urlError = ref('')
const urlKind = ref('photo')

const openUrl = () => {
  urlError.value = ''
  urlKind.value = defaultKind.value
  urlOpen.value = true
}

const fromUrl = async (url: string) => {
  importing.value = true
  urlError.value = ''
  try {
    place(await importUrl(url), urlKind.value)
    urlOpen.value = false
  } catch (error) {
    urlError.value = localizeError(error)
  } finally {
    importing.value = false
  }
}
</script>
