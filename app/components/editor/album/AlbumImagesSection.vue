<template>
  <CatalogSection :title="$t('editor.album.section.images')" :icon="Images" tone="sky" :description="$t('editor.image.gallery_hint')">
    <div class="space-y-5 p-3 sm:p-5">
      <div class="grid gap-5 sm:grid-cols-[13rem_1fr]">
        <div>
          <p class="mb-1.5 text-sm font-medium text-gray-700">{{ $t('editor.album.cover') }} <span class="text-error">*</span></p>
          <EditorAlbumCoverSlot />
        </div>
        <div class="space-y-3 text-sm text-gray-600 sm:pt-6">
          <div class="flex flex-wrap items-center gap-2">
            <label class="btn btn-add btn-sm cursor-pointer gap-1" :class="{ 'btn-disabled': uploading > 0 }">
              <Upload :size="14" />{{ $t('editor.image.upload_many') }}
              <input type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif" class="hidden" @change="pick">
            </label>
            <button type="button" class="btn btn-add btn-sm gap-1" @click="openUrl"><Link2 :size="14" />{{ $t('editor.image.from_url') }}</button>
            <span v-if="uploading" class="flex items-center gap-1.5 text-xs text-gray-500"><span class="loading loading-spinner loading-xs" />{{ $t('editor.image.uploading', { count: uploading }) }}</span>
          </div>
          <ul v-if="failures.length" class="space-y-0.5 text-xs text-error">
            <li v-for="failure in failures" :key="failure">{{ failure }}</li>
          </ul>
        </div>
      </div>

      <ul v-if="gallery.length" class="grid gap-3 lg:grid-cols-2">
        <EditorAlbumImageCard
          v-for="(image, index) in gallery"
          :key="image.id"
          :image-id="image.id"
          :first="index === 0"
          :last="index === gallery.length - 1"
          @move="moveRow(album.images, image, $event)"
        />
      </ul>
      <p v-else class="text-sm text-gray-400">{{ $t('editor.image.none') }}</p>

      <EditorImageImportDialog v-model="urlOpen" :busy="importing" :error="urlError" @import="fromUrl">
        <label class="block">
          <span class="mb-1 block text-sm font-medium text-gray-700">{{ $t('catalog.field.kind') }}</span>
          <select v-model="urlKind" class="select select-sm w-full">
            <option value="">{{ $t('editor.dialog.image_kind_guess') }}</option>
            <option v-for="value in kinds" :key="value" :value="value" :disabled="value === 'cover'">{{ enumLabel('image_kind', value) }}</option>
          </select>
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
import { Images, Link2, Upload } from '@lucide/vue'
import { addImage, coverOf } from '~/utils/albumDocument'
import { byOrder, moveRow, sameId } from '~/utils/documentRows'

/** Common labels by kind, as VGMdb writes them. */
const LABEL_PRESETS: Record<string, string[]> = {
  booklet: ['p. 01-02', 'p. 03-04', 'p. 05-06', 'p. 07-08', 'p. 09-10', 'p. 11-12'],
  disc: ['Disc 1', 'Disc 2', 'Disc 3'],
  disc_back: ['Disc 1', 'Disc 2'],
  box: ['Front', 'Back', 'Side', 'Inside'],
}

const editor = useAlbumEditor()
const { t } = useI18n()
const { localizeError } = useLocalizedApiError()
const { limits, upload, importUrl } = useImageUpload()
const { schema } = useCatalogSchema()
const { enumLabel } = useCatalogDisplay()
const kinds = computed(() => schema.value?.enums?.image_kind ?? [])

const album = computed(() => editor.album.value)
/** Every image but the album cover, which has its own slot. */
const gallery = computed(() => byOrder(album.value.images).filter(image => !sameId(image.id, coverOf(album.value)?.id)))

const uploading = ref(0)
const importing = ref(false)
const failures = ref<string[]>([])
const urlOpen = ref(false)
const urlError = ref('')
/** The kind for an imported image; blank guesses it from the address. */
const urlKind = ref('')

const guessKind = (name: string) => {
  const lower = name.toLowerCase()
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

const pick = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const files = [...(input.files ?? [])]
  input.value = ''
  failures.value = []
  for (const file of files) {
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
