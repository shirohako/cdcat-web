<template>
  <div class="flex items-start gap-3">
    <div class="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-50" :class="{ 'w-28': wide }">
      <img v-if="model" :src="model" alt="" class="h-full w-full object-cover">
    </div>
    <div class="min-w-0 flex-1 space-y-1.5">
      <div class="flex gap-1.5">
        <input v-model.trim="model" type="url" class="input input-sm min-w-0 flex-1" placeholder="https://">
        <label class="btn btn-sm cursor-pointer gap-1" :class="{ 'btn-disabled': busy }">
          <span v-if="busy" class="loading loading-spinner loading-xs" /><Upload v-else :size="14" />
          <span class="hidden sm:inline">{{ $t('editor.image.upload_file') }}</span>
          <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" class="hidden" @change="pick">
        </label>
      </div>
      <p v-if="message" class="text-xs text-error">{{ message }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Upload } from '@lucide/vue'

/** An image URL column (artists, labels, entries, series): paste a link or upload a file to this site. */
defineProps<{ wide?: boolean }>()
const model = defineModel<string | null>({ required: true })

const { t } = useI18n()
const { localizeError } = useLocalizedApiError()
const { limits, upload } = useImageUpload()
const busy = ref(false)
const message = ref('')

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
</script>
