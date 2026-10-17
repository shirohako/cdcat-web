<template>
  <EditorModal :model-value="!!file" :title="$t('editor.crop.title')" wide @update:model-value="value => !value && emit('cancel')">
    <div v-if="image" class="space-y-4">
      <p class="text-sm text-gray-600">{{ $t('editor.crop.hint') }}</p>
      <div class="relative mx-auto w-fit max-w-full select-none overflow-hidden rounded-lg bg-gray-900">
        <img :src="image.src" alt="" class="block max-h-[55vh] max-w-full">
        <div class="pointer-events-none absolute border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]" :style="box" />
      </div>
      <label class="block">
        <span class="mb-1 block text-xs text-gray-500">{{ $t('editor.crop.position') }}</span>
        <input v-model.number="offset" type="range" min="-1" max="1" step="0.01" class="w-full">
      </label>
      <p class="text-xs text-gray-500">{{ $t('editor.crop.result', { size: output }) }}</p>
    </div>
    <div v-else class="flex justify-center py-10"><span class="loading loading-spinner" /></div>
    <template #footer>
      <button type="button" class="btn btn-ghost btn-sm" @click="emit('cancel')">{{ $t('common.cancel') }}</button>
      <button type="button" class="btn btn-primary btn-sm" :disabled="!image || busy" @click="apply">
        <span v-if="busy" class="loading loading-spinner loading-xs" />{{ $t('editor.crop.apply') }}
      </button>
    </template>
  </EditorModal>
</template>

<script setup lang="ts">
import { cropToSquare, outputSize, squareCrop } from '~/utils/imageCrop'

/** Crops a picked file to the largest square; the slider moves the square along the long side. */
const props = defineProps<{ file: File | null }>()
const emit = defineEmits<{ cropped: [Blob], cancel: [] }>()

const image = shallowRef<HTMLImageElement | null>(null)
const offset = ref(0)
const busy = ref(false)

watch(() => props.file, async (file) => {
  if (image.value) URL.revokeObjectURL(image.value.src)
  image.value = null
  offset.value = 0
  if (file) image.value = await loadImageFile(file).catch(() => null)
}, { immediate: true })
onBeforeUnmount(() => { if (image.value) URL.revokeObjectURL(image.value.src) })

const crop = computed(() => image.value ? squareCrop(image.value.naturalWidth, image.value.naturalHeight, offset.value) : null)
const output = computed(() => crop.value ? outputSize(crop.value.size) : 0)
const box = computed(() => {
  if (!image.value || !crop.value) return {}
  const { naturalWidth: width, naturalHeight: height } = image.value
  return {
    left: `${(crop.value.x / width) * 100}%`,
    top: `${(crop.value.y / height) * 100}%`,
    width: `${(crop.value.size / width) * 100}%`,
    height: `${(crop.value.size / height) * 100}%`,
  }
})

const apply = async () => {
  if (!image.value) return
  busy.value = true
  try {
    emit('cropped', await cropToSquare(image.value, offset.value))
  } finally {
    busy.value = false
  }
}
</script>
