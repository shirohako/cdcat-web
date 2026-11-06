<template>
  <CatalogSection :title="$t('editor.album.section.images')" :icon="Images">
    <div class="space-y-5 p-3 sm:p-5">
      <ul v-if="cover && collectionErrors.length" class="space-y-0.5 rounded-lg border border-danger/25 bg-danger/10 px-3 py-2 text-xs text-danger">
        <li v-for="error in collectionErrors" :key="error.path">{{ error.message }}</li>
      </ul>

      <!-- The main cover and the main banner, each in its slot; the gallery below has every other image, other covers
           and banners too, and makes one of them the main one only with 用作封面 / 用作横幅. -->
      <div class="grid gap-5 sm:grid-cols-[14rem_minmax(0,1fr)]">
        <div class="mx-auto w-full max-w-52 sm:mx-0 sm:max-w-none">
          <p class="mb-1.5 text-sm font-medium text-body">{{ $t('editor.album.cover') }} <span class="text-danger">*</span><EditorHelp id="album.cover" /></p>
          <EditorAlbumCoverSlot />
        </div>
        <div class="min-w-0">
          <p class="mb-1.5 text-sm font-medium text-body">{{ $t('editor.image.banner') }}<EditorHelp id="image.banner" /></p>
          <EditorImageSlot
            variant="banner"
            :file="bannerFile"
            :missing="!!banner && !bannerFile"
            :error="banner ? editor.errorAt('images', banner.id, 'image_id') : null"
            removable
            @use="useBanner"
            @remove="banner && removeImage(album, banner.id)"
          />
        </div>
      </div>

      <div>
        <p class="mb-1.5 flex items-baseline gap-1.5 text-sm font-medium text-body">
          {{ $t('editor.image.gallery') }}<span v-if="gallery.length" class="text-xs tabular-nums text-meta">{{ gallery.length }}</span><EditorHelp id="image.gallery" />
        </p>
        <div
          class="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors"
          :class="dropping ? 'border-primary bg-primary/5' : 'border-line bg-sunken'"
          @dragenter="filesOver"
          @dragover="filesOver"
          @dragleave="filesLeave"
          @drop="dropFiles"
        >
          <ImageUp :size="28" class="text-meta" />
          <div class="space-y-1">
            <p class="text-sm font-medium text-title">{{ $t('editor.image.drop_hint') }}</p>
            <p class="text-xs text-meta">{{ $t('editor.image.gallery_hint') }}</p>
            <p class="text-xs text-meta">{{ $t('editor.image.main_hint') }}</p>
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
        <EditorAlbumImageCard
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
          <UiSelect v-model="urlKind" :options="urlKindOptions" size="sm" class="w-full" />
        </label>
      </EditorImageImportDialog>

      <datalist v-for="(presets, kind) in LABEL_PRESETS" :id="`editor-image-labels-${kind}`" :key="kind">
        <option v-for="preset in presets" :key="preset" :value="preset" />
      </datalist>
    </div>
  </CatalogSection>
</template>

<script setup lang="ts">
import type { CatalogImage } from '~/types/catalog'
import type { UiSelectOption } from '~/components/ui/Select.vue'
import { ImageUp, Images, Link2, Upload } from '@lucide/vue'
import { addImage, addMainImage, bannerOf, coverOf, removeImage } from '~/utils/albumDocument'
import type { AlbumDocument } from '~/types/document'
import { byOrder, placeRow, sameId } from '~/utils/documentRows'

/** Common labels by kind, as VGMdb writes them. */
const LABEL_PRESETS: Record<string, string[]> = {
  booklet: ['p. 01-02', 'p. 03-04', 'p. 05-06', 'p. 07-08', 'p. 09-10', 'p. 11-12'],
  disc: ['Disc 1', 'Disc 2', 'Disc 3'],
  disc_back: ['Disc 1', 'Disc 2'],
  box: ['Front', 'Back', 'Side', 'Inside'],
}

const editor = useAlbumEditor()
const { t } = useI18n()
const imageKindOptions = useImageKindOptions()
const { localizeError } = useLocalizedApiError()
const { limits, upload, importUrl } = useImageUpload()

const album = computed(() => editor.album.value)
const cover = computed(() => coverOf(album.value))
const banner = computed(() => bannerOf(album.value))
const bannerFile = computed(() => banner.value ? editor.references.images?.[String(banner.value.image_id)] as CatalogImage | undefined : undefined)
/** Every image but the main cover and banner, which have their slots. */
const gallery = computed(() => byOrder(album.value.images).filter(image => image !== cover.value && image !== banner.value))
// "At most one main banner" and the like; without a cover, its slot shows "needs exactly one main cover".
const collectionErrors = computed(() => editor.errorsIn('images').filter(error => error.path.split('.').length === 3))

const useBanner = (image: CatalogImage) => {
  editor.remember('images', image.id, image)
  addMainImage(album.value, 'banner', image.id)
}

type ImageRow = AlbumDocument['images'][number]

// ---- order: drag a row by its handle, or move it one step; the cover's place among the rows doesn't count ----

/** Puts the row before the gallery row at `index` (last when there is none). */
const placeAt = (image: ImageRow, index: number) => placeRow(album.value.images, image, gallery.value[index] ?? null)
const { grabbed, dragged, grab, move, startDrag, overRow, dropOn, endDrag, dropEdge } = useRowDrag(() => gallery.value, placeAt)

const uploading = ref(0)
const importing = ref(false)
const failures = ref<string[]>([])
const urlOpen = ref(false)
const urlError = ref('')
/** The kind for an imported image; blank guesses it from the address. */
const urlKind = ref('')
const urlKindOptions = computed<UiSelectOption<string>[]>(() => [
  { value: '', label: t('editor.dialog.image_kind_guess') },
  ...imageKindOptions(),
])

const guessKind = (name: string) => {
  const lower = name.toLowerCase()
  if (/oshinagaki|品書|品书|menu/.test(lower)) return 'oshinagaki'
  if (/obi/.test(lower)) return 'obi_front'
  if (/back|rear|裏/.test(lower)) return 'back'
  if (/booklet|book|bk|p\d|歌詞/.test(lower)) return 'booklet'
  if (/disc|disk|cd\d|label|盤面/.test(lower)) return 'disc'
  if (/front|cover|表/.test(lower)) return 'front'
  return 'other'
}

const place = (image: CatalogImage, kind: string) => {
  editor.remember('images', image.id, image)
  const exists = album.value.images.some(row => row.image_id === image.id && row.kind === kind && row.product_id === null && row.bonus_id === null && row.disc_id === null)
  if (exists) editor.notify(t('editor.image.already_added'), 'info')
  else addImage(album.value, image.id, { kind })
}

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']

/** Uploads into the gallery, one after another, each with the kind its file name suggests. */
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
      place(await upload(file, file.name), guessKind(file.name))
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

const openUrl = () => {
  urlError.value = ''
  urlKind.value = ''
  urlOpen.value = true
}

const fromUrl = async (url: string) => {
  importing.value = true
  urlError.value = ''
  try {
    place(await importUrl(url), urlKind.value || guessKind(url))
    urlOpen.value = false
  } catch (error) {
    urlError.value = localizeError(error)
  } finally {
    importing.value = false
  }
}
</script>
