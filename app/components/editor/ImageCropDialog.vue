<template>
  <EditorModal :model-value="!!file" :title="$t('editor.crop.title')" wide :topmost="topmost" @update:model-value="value => !value && emit('cancel')">
    <div v-if="image && crop" class="space-y-4">
      <p class="text-sm text-body">{{ hint ?? $t('editor.crop.hint') }}</p>
      <!-- The whole picture with the square on it: drag anywhere to move the square, wheel or pinch to resize it. -->
      <div
        class="relative mx-auto w-fit max-w-full cursor-grab touch-none select-none overflow-hidden rounded-lg bg-hero active:cursor-grabbing"
        @pointerdown="press"
        @pointermove="drag"
        @pointerup="release"
        @pointercancel="release"
        @wheel.prevent="wheel"
      >
        <img ref="picture" :src="image.src" alt="" draggable="false" class="pointer-events-none block max-h-[55vh] max-w-full">
        <div
          tabindex="0"
          :aria-label="$t('editor.crop.frame')"
          class="absolute border-2 border-white shadow-[0_0_0_9999px_var(--scrim)] outline-none focus-visible:border-primary"
          :class="{ 'rounded-full': round }"
          :style="box"
          @keydown="key"
        />
      </div>
      <div class="flex items-center gap-2">
        <UiButton :icon="ZoomOut" :label="$t('editor.crop.zoom_out')" size="sm" class="ring-1 ring-inset ring-line shadow-xs active:translate-y-px" :disabled="zoom <= 1" @click="zoomBy(1 / 1.2)" />
        <input v-model.number="zoom" type="range" min="1" :max="maxZoom" step="0.01" :aria-label="$t('editor.crop.zoom')" class="min-w-0 flex-1 accent-primary" :disabled="maxZoom <= 1">
        <UiButton :icon="ZoomIn" :label="$t('editor.crop.zoom_in')" size="sm" class="ring-1 ring-inset ring-line shadow-xs active:translate-y-px" :disabled="zoom >= maxZoom" @click="zoomBy(1.2)" />
        <UiButton :icon="RotateCcw" :label="$t('editor.crop.reset')" size="sm" class="ring-1 ring-inset ring-line shadow-xs active:translate-y-px" @click="reset" />
      </div>
      <p class="text-xs text-meta">{{ $t('editor.crop.result', { size: output }) }}</p>
    </div>
    <div v-else class="flex justify-center py-10"><span class="loading loading-spinner" /></div>
    <template #footer>
      <UiButton size="sm" class="ring-1 ring-inset ring-line shadow-xs active:translate-y-px" @click="emit('cancel')">{{ $t('common.cancel') }}</UiButton>
      <UiButton variant="primary" size="sm" class="shadow-xs active:translate-y-px" :disabled="!crop" :loading="busy" @click="apply">{{ $t('editor.crop.apply') }}</UiButton>
    </template>
  </EditorModal>
</template>

<script setup lang="ts">
import type { SquareCrop } from '~/utils/imageCrop'
import { RotateCcw, ZoomIn, ZoomOut } from '@lucide/vue'
import { clampCrop, cropToBlob, isSquare, outputSize, resizeCrop, squareCrop } from '~/utils/imageCrop'

/**
 * Crops a picked file to a square. It starts on the largest centred square; dragging (mouse or finger, anywhere on the
 * picture) moves it both ways, the slider, its buttons, the wheel or a pinch make it smaller or larger, the arrow keys
 * and + / − do the same on the focused square. It never gets smaller than `minSize` (the slot's smallest allowed
 * image). `round` shows the square as the circle an avatar is shown in. Left whole, an image within `tolerance` of
 * square is handed back as it was picked, so it is not compressed again. `hint` says why (an album cover by default).
 * `topmost` lifts it above other dialogs (AppCoverShape opens it from anywhere).
 */
const props = defineProps<{ file: File | null, hint?: string, round?: boolean, minSize?: number, tolerance?: number, topmost?: boolean }>()
const emit = defineEmits<{ cropped: [Blob], cancel: [] }>()

const image = shallowRef<HTMLImageElement | null>(null)
const picture = ref<HTMLImageElement | null>(null)
const crop = ref<SquareCrop | null>(null)
const busy = ref(false)

const width = computed(() => image.value?.naturalWidth ?? 0)
const height = computed(() => image.value?.naturalHeight ?? 0)
const short = computed(() => Math.min(width.value, height.value))
/** The smallest square: the slot's minimum, and never under a tenth of the short side. */
const smallest = computed(() => Math.min(short.value, Math.max(props.minSize ?? 0, short.value / 10)))
const maxZoom = computed(() => smallest.value ? short.value / smallest.value : 1)

const reset = () => {
  crop.value = image.value ? squareCrop(width.value, height.value) : null
}

watch(() => props.file, async (file) => {
  if (image.value) URL.revokeObjectURL(image.value.src)
  image.value = null
  crop.value = null
  if (file) image.value = await loadImageFile(file).catch(() => null)
  reset()
}, { immediate: true })
onBeforeUnmount(() => { if (image.value) URL.revokeObjectURL(image.value.src) })

const place = (next: SquareCrop) => {
  crop.value = clampCrop(width.value, height.value, next, smallest.value)
}
const resize = (size: number) => {
  if (crop.value) crop.value = resizeCrop(width.value, height.value, crop.value, size, smallest.value)
}
const zoom = computed({
  get: () => crop.value ? short.value / crop.value.size : 1,
  set: (value: number) => resize(short.value / value),
})
const zoomBy = (factor: number) => resize((crop.value?.size ?? short.value) / factor)

/** Image pixels per screen pixel of the shown picture. */
const scale = () => width.value / (picture.value?.getBoundingClientRect().width || width.value || 1)

// Pointers down on the picture: one drags the square, two pinch it.
const pointers = new Map<number, { x: number, y: number }>()
let spread = 0
const distance = () => {
  const [a, b] = [...pointers.values()]
  return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0
}

const press = (event: PointerEvent) => {
  if (event.pointerType === 'mouse' && event.button !== 0) return
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
  pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
  spread = distance()
}

const drag = (event: PointerEvent) => {
  const last = pointers.get(event.pointerId)
  if (!last || !crop.value) return
  pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
  if (pointers.size === 1) {
    const k = scale()
    place({ ...crop.value, x: crop.value.x + (event.clientX - last.x) * k, y: crop.value.y + (event.clientY - last.y) * k })
  } else if (pointers.size === 2) {
    const now = distance()
    if (spread && now) resize(crop.value.size * spread / now)
    spread = now
  }
}

const release = (event: PointerEvent) => {
  pointers.delete(event.pointerId)
  spread = distance()
}

const wheel = (event: WheelEvent) => {
  if (crop.value) resize(crop.value.size * Math.exp(event.deltaY * 0.0015))
}

const key = (event: KeyboardEvent) => {
  if (!crop.value) return
  const step = crop.value.size * (event.shiftKey ? 0.1 : 0.02)
  const moves: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }
  const move = moves[event.key]
  if (move) place({ ...crop.value, x: crop.value.x + move[0], y: crop.value.y + move[1] })
  else if (event.key === '+' || event.key === '=') zoomBy(1.1)
  else if (event.key === '-') zoomBy(1 / 1.1)
  else return
  event.preventDefault()
}

const output = computed(() => crop.value ? outputSize(Math.round(crop.value.size)) : 0)
const box = computed(() => {
  if (!crop.value || !width.value) return {}
  return {
    left: `${(crop.value.x / width.value) * 100}%`,
    top: `${(crop.value.y / height.value) * 100}%`,
    width: `${(crop.value.size / width.value) * 100}%`,
    height: `${(crop.value.size / height.value) * 100}%`,
  }
})

const apply = async () => {
  if (!image.value || !crop.value || !props.file) return
  const whole = Math.round(crop.value.size) >= short.value
  if (whole && props.tolerance !== undefined && isSquare(width.value, height.value, props.tolerance)) {
    emit('cropped', props.file)
    return
  }
  busy.value = true
  try {
    emit('cropped', await cropToBlob(image.value, crop.value))
  } finally {
    busy.value = false
  }
}
</script>
