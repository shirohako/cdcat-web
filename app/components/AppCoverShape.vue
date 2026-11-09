<template>
  <UiDialog v-model="asking" :title="$t('editor.cover_shape.title')" icon="lucide:triangle-alert" tone="warning" topmost>
    <div v-if="shown" class="space-y-4">
      <!-- A line at a time: the size, then what keeping the shape means (or why it can't be kept). -->
      <div class="space-y-1.5 text-sm leading-relaxed text-body">
        <i18n-t keypath="editor.cover_shape.size" tag="p" scope="global">
          <template #size><span class="font-medium tabular-nums text-title">{{ size }}</span></template>
        </i18n-t>
        <p>{{ shown.tooWide ? $t('editor.cover_shape.too_wide', { ratio: maxRatio }) : $t('editor.cover_shape.keep_effect') }}</p>
      </div>
      <!-- What keeping it means: the centred square everywhere else, its own shape on the album page (as AlbumHero
           shows it, width kept, at most 1.5 times as tall). -->
      <div class="flex flex-wrap items-end justify-center gap-x-8 gap-y-4 rounded-lg bg-sunken px-4 py-5">
        <figure class="flex flex-col items-center gap-2">
          <img :src="shown.src" alt="" class="size-28 rounded-md bg-card object-cover shadow-sm ring-1 ring-line">
          <figcaption class="text-xs text-meta">{{ $t('editor.cover_shape.elsewhere') }}</figcaption>
        </figure>
        <figure v-if="!shown.tooWide" class="flex flex-col items-center gap-2">
          <img :src="shown.src" alt="" class="rounded-md bg-card object-cover shadow-sm ring-1 ring-line" :style="ownShape">
          <figcaption class="text-xs text-meta">{{ $t('editor.cover_shape.on_album_page') }}</figcaption>
        </figure>
      </div>
      <!-- Just above the buttons, a light tip (the icon says it is one): square is recommended, the word picked out;
           when keeping the shape is worth it, unless it can't be kept. -->
      <UiAlert tone="info" icon="lucide:lightbulb" compact>
        <i18n-t keypath="editor.cover_shape.recommend" tag="p" scope="global">
          <template #square><span class="font-semibold text-info">{{ $t('editor.cover_shape.square') }}</span></template>
        </i18n-t>
        <p v-if="!shown.tooWide">{{ $t('editor.cover_shape.tip') }}</p>
      </UiAlert>
      <p v-if="error" class="text-xs text-danger">{{ error }}</p>
    </div>
    <template #footer>
      <UiButton size="sm" class="ring-1 ring-inset ring-line shadow-xs active:translate-y-px" @click="answerCoverShape(null)">{{ $t('common.cancel') }}</UiButton>
      <UiButton
        :variant="shown?.tooWide ? 'primary' : undefined"
        size="sm"
        :class="shown?.tooWide ? 'shadow-xs active:translate-y-px' : 'ring-1 ring-inset ring-line shadow-xs active:translate-y-px'"
        :loading="loading"
        @click="crop"
      >
        {{ $t('editor.cover_shape.crop') }}
      </UiButton>
      <UiButton v-if="!shown?.tooWide" variant="primary" size="sm" class="shadow-xs active:translate-y-px" :disabled="loading" @click="answerCoverShape({ keep: true })">
        {{ $t('editor.cover_shape.keep') }}
      </UiButton>
    </template>
  </UiDialog>
  <LazyEditorImageCropDialog
    v-if="cropFile && shown"
    :file="cropFile"
    :min-size="shown.minSize"
    :tolerance="shown.tolerance"
    topmost
    @cropped="cropped"
    @cancel="cancelCrop"
  />
</template>

<script setup lang="ts">
import type { CoverShapeQuestion } from '~/composables/useCoverShape'
import { coverRatio } from '~/utils/imageCrop'

/**
 * The dialogs behind useCoverShape(), mounted once in app.vue: the warning about a cover that is not square, and the
 * crop dialog it leads to. Cancelling the crop goes back to the warning (or ends, when the slot asked for the crop).
 * Needs no catalog schema: the question brings its limits.
 */
const { t } = useI18n()
const request = useCoverShapeQuestion()
// Kept after the question is answered, so the text doesn't vanish while the dialog fades out.
const shown = ref<CoverShapeQuestion | null>(null)
const cropFile = ref<File | null>(null)
const loading = ref(false)
const error = ref('')

const crop = async () => {
  const question = request.value
  if (!question || loading.value) return
  error.value = ''
  loading.value = true
  try {
    const file = await question.file()
    if (request.value === question) cropFile.value = file
  } catch {
    error.value = t('editor.cover_shape.fetch_failed')
    // With no warning on screen there is nowhere to say it; useCoverShape fetches that file beforehand anyway.
    if (question.cropOnly) answerCoverShape(null)
  } finally {
    loading.value = false
  }
}

watch(request, (value) => {
  if (!value) return
  shown.value = { ...value }
  cropFile.value = null
  error.value = ''
  if (value.cropOnly) void crop()
})

/** The warning is up while a question is open and the crop dialog isn't; closing it (×, Escape, outside) cancels. */
const asking = computed({
  get: () => !!request.value && !request.value.cropOnly && !cropFile.value,
  set: (value: boolean) => { if (!value) answerCoverShape(null) },
})

const cropped = (blob: Blob) => {
  cropFile.value = null
  answerCoverShape({ cropped: blob })
}
const cancelCrop = () => {
  cropFile.value = null
  if (request.value?.cropOnly) answerCoverShape(null)
}

const size = computed(() => shown.value ? `${shown.value.width} × ${shown.value.height}` : '')
const maxRatio = computed(() => `${shown.value?.maxRatio ?? 2}:1`)
const ownShape = computed(() => {
  const ratio = coverRatio(shown.value?.width, shown.value?.height, shown.value?.tolerance)
  return { width: `min(7rem, calc(7rem * 1.5 * ${ratio}))`, aspectRatio: String(ratio) }
})
</script>
