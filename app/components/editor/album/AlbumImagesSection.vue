<template>
  <CatalogSection :title="$t('editor.album.section.images')" :icon="Images">
    <div class="space-y-5 p-3 sm:p-5">
      <!-- The cover on the left; on the right the gallery's drop area, as tall as the cover's square. -->
      <div class="grid gap-5 sm:grid-cols-[14rem_minmax(0,1fr)]">
        <div>
          <p class="mb-1.5 text-sm font-medium text-body">{{ $t('editor.album.cover') }} <span class="text-danger">*</span></p>
          <EditorAlbumCoverSlot />
        </div>
        <div class="min-w-0">
          <p class="mb-1.5 flex items-baseline gap-1.5 text-sm font-medium text-body">
            {{ $t('editor.image.gallery') }}<span v-if="gallery.length" class="text-xs tabular-nums text-meta">{{ gallery.length }}</span>
          </p>
          <div
            class="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors sm:h-56"
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
          @grab="grabbed = image.id"
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
import { addImage, coverOf } from '~/utils/albumDocument'
import type { AlbumDocument, RowId } from '~/types/document'
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
/** Every image but the album cover, which has its own slot. */
const gallery = computed(() => byOrder(album.value.images).filter(image => !sameId(image.id, coverOf(album.value)?.id)))

type ImageRow = AlbumDocument['images'][number]

// ---- order: drag a row by its handle, or move it one step; the cover's place among the rows doesn't count ----

/** The row whose handle is held down: only that row can be dragged, so its fields stay selectable. */
const grabbed = ref<RowId | null>(null)
const dragged = ref<RowId | null>(null)
/** Where the dragged row would land: before or after this row. */
const target = ref<{ id: RowId, after: boolean } | null>(null)

/** Puts the row before the gallery row at `index` (last when there is none). */
const placeAt = (image: ImageRow, index: number) => placeRow(album.value.images, image, gallery.value[index] ?? null)
const move = (image: ImageRow, delta: number) => {
  const index = gallery.value.indexOf(image)
  if (index < 0 || index + delta < 0) return
  placeAt(image, delta < 0 ? index - 1 : index + 2)
}

const startDrag = (image: ImageRow, event: DragEvent) => {
  dragged.value = image.id
  if (!event.dataTransfer) return
  event.dataTransfer.effectAllowed = 'move'
  // Firefox starts a drag only with some data.
  event.dataTransfer.setData('text/plain', String(image.id))
}
const overRow = (image: ImageRow, event: DragEvent) => {
  if (dragged.value === null) return
  event.preventDefault()
  const box = (event.currentTarget as HTMLElement).getBoundingClientRect()
  target.value = { id: image.id, after: event.clientY > box.top + box.height / 2 }
}
const dropOn = (image: ImageRow) => {
  const moving = gallery.value.find(row => sameId(row.id, dragged.value))
  if (moving && target.value && sameId(target.value.id, image.id)) placeAt(moving, gallery.value.indexOf(image) + (target.value.after ? 1 : 0))
  endDrag()
}
const endDrag = () => {
  grabbed.value = null
  dragged.value = null
  target.value = null
}
/** The edge of this row the drop line shows on; none over the dragged row itself. */
const dropEdge = (image: ImageRow) => target.value && dragged.value !== null && !sameId(dragged.value, image.id) && sameId(target.value.id, image.id)
  ? (target.value.after ? 'after' : 'before')
  : null

// A handle pressed and let go without dragging lets go of the row.
const release = () => { if (dragged.value === null) grabbed.value = null }
onMounted(() => document.addEventListener('pointerup', release))
onBeforeUnmount(() => document.removeEventListener('pointerup', release))

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
