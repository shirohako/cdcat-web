<template>
  <div class="flex items-start gap-3">
    <div class="relative flex h-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-sunken text-faint" :class="wide ? 'w-36' : 'w-20'">
      <img v-if="model" :src="model" alt="" class="h-full w-full object-cover">
      <ImagePlus v-else :size="22" />
      <div v-if="busy" class="absolute inset-0 flex items-center justify-center bg-card/70 text-meta"><span class="loading loading-spinner loading-sm" /></div>
    </div>
    <div class="min-w-0 flex-1 space-y-1.5">
      <div class="flex flex-wrap gap-1.5">
        <label class="btn btn-sm cursor-pointer gap-1" :class="{ 'btn-disabled': busy }">
          <Upload :size="14" />{{ $t(model ? 'editor.image.replace' : 'editor.image.upload_file') }}
          <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" class="hidden" :disabled="busy" @change="pick">
        </label>
        <UiButton :icon="Link2" icon-class="size-3.5" size="sm" class="gap-1" :disabled="busy" @click="openUrl">{{ $t('editor.image.from_url') }}</UiButton>
        <UiButton v-if="model" variant="danger-soft" :icon="Trash2" icon-class="size-3.5" size="sm" class="gap-1" :disabled="busy" @click="model = null">{{ $t('editor.image.remove') }}</UiButton>
      </div>
      <p v-if="message" class="text-xs text-danger">{{ message }}</p>
    </div>
    <EditorImageImportDialog v-model="urlOpen" :busy="busy" :error="urlError" @import="fromUrl" />
  </div>
</template>

<script setup lang="ts">
import { ImagePlus, Link2, Trash2, Upload } from '@lucide/vue'

/**
 * An image URL column (artists, labels, entries, series). The image always comes through this
 * site: uploaded, or imported from a link by the server; there is no field to type a URL into.
 */
defineProps<{ wide?: boolean }>()
const model = defineModel<string | null>({ required: true })

const { t } = useI18n()
const { localizeError } = useLocalizedApiError()
const { limits, upload, importUrl } = useImageUpload()
const busy = ref(false)
const message = ref('')
const urlOpen = ref(false)
const urlError = ref('')

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
  busy.value = true
  try {
    model.value = (await upload(file, file.name)).medium_url
  } catch (error) {
    message.value = localizeError(error)
  } finally {
    busy.value = false
  }
}

const openUrl = () => {
  urlError.value = ''
  urlOpen.value = true
}

const fromUrl = async (url: string) => {
  busy.value = true
  urlError.value = ''
  try {
    model.value = (await importUrl(url)).medium_url
    message.value = ''
    urlOpen.value = false
  } catch (error) {
    urlError.value = localizeError(error)
  } finally {
    busy.value = false
  }
}
</script>
