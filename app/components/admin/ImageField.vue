<template>
  <div class="space-y-2">
    <!-- Drop a file here, or focus it and paste. -->
    <div
      tabindex="0"
      class="relative flex min-h-36 items-center justify-center overflow-hidden rounded-lg border-2 bg-slate-50 outline-none transition focus-visible:border-slate-500"
      :class="[dragging ? 'border-slate-500 bg-slate-100' : url ? 'border-transparent' : 'border-dashed border-slate-300', previewClass]"
      @dragover.prevent="dragging = true"
      @dragleave="dragging = false"
      @drop.prevent="drop"
      @paste="pasteHere"
    >
      <img v-if="url && !broken" :src="url" alt="" class="block max-h-56 w-auto max-w-full object-contain" @load="loaded" @error="failed">
      <div v-else class="flex flex-col items-center gap-1.5 p-4 text-center text-slate-500">
        <ImageOff v-if="url" :size="22" />
        <ImagePlus v-else :size="22" />
        <span class="text-xs">{{ url ? '图片加载失败' : `拖入图片或按 ${pasteKeys} 粘贴` }}</span>
      </div>
      <div v-if="busy" class="absolute inset-0 flex items-center justify-center bg-white/70 text-slate-500"><span class="loading loading-spinner" /></div>
    </div>

    <div class="flex flex-wrap gap-1.5">
      <UiButton size="sm" :icon="Upload" :disabled="busy || disabled" @click="picker?.click()">{{ url ? '换一张' : '上传图片' }}</UiButton>
      <input ref="picker" type="file" accept="image/jpeg,image/png,image/webp,image/avif" class="hidden" @change="pick">
      <UiButton size="sm" :icon="ClipboardPaste" :disabled="busy || disabled" @click="fromClipboard">从剪贴板粘贴</UiButton>
      <UiButton size="sm" :icon="Link2" :pressed="linkOpen" :disabled="busy || disabled" @click="toggleLink">从链接获取</UiButton>
      <UiButton v-if="url" size="sm" variant="danger-soft" :icon="Trash2" :disabled="busy || disabled" @click="clear">清除</UiButton>
    </div>

    <!-- Not a <form>: the field sits inside the page's own form, so Enter is caught here instead. -->
    <div v-if="linkOpen" class="flex gap-2">
      <input ref="linkInput" v-model="link" type="url" maxlength="2048" placeholder="https://" aria-label="图片链接" class="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm" @keydown.enter.prevent="fromLink">
      <UiButton size="sm" variant="primary" :loading="busy" :disabled="!linkValid" @click="fromLink">转存</UiButton>
    </div>

    <p v-if="external" class="text-xs text-amber-700">
      这张图是外部地址，对方网站换图或下线后就会失效。
      <button type="button" class="font-medium underline underline-offset-2 disabled:opacity-50" :disabled="busy || disabled" @click="importAddress(url)">转存到本站</button>
    </p>
    <p v-if="error" role="alert" class="text-xs text-red-700">{{ error }}</p>
    <p v-else-if="hint" class="text-xs text-slate-500">{{ hint }}</p>
  </div>
</template>

<script setup lang="ts">
import type { CatalogImage } from '~/types/catalog'
import { ClipboardPaste, ImageOff, ImagePlus, Link2, Trash2, Upload } from '@lucide/vue'

/**
 * An admin image picked by address: upload, drop, paste (on the box, or anywhere on the page outside text fields) or a
 * link, which the server downloads and stores (POST /v1/images), so every new picture lives on this site. `url` is the
 * stored address; `size` reports the picture's pixels whenever the preview loads (null, null when it can't). An address
 * that is not this site's (older rows) shows a note with a button that stores it here. `previewClass` shapes the box.
 */
const props = withDefaults(defineProps<{ hint?: string, previewClass?: string, disabled?: boolean }>(), { hint: undefined, previewClass: undefined })
const url = defineModel<string>('url', { required: true })
const emit = defineEmits<{ size: [width: number | null, height: number | null] }>()
const busy = defineModel<boolean>('busy', { default: false })

const { limits, upload, importUrl } = useImageUpload()
const picker = useTemplateRef<HTMLInputElement>('picker')
const linkInput = useTemplateRef<HTMLInputElement>('linkInput')
const error = ref('')
const broken = ref(false)
const dragging = ref(false)
const linkOpen = ref(false)
const link = ref('')
const pasteKeys = import.meta.client && /Mac|iPhone|iPad/.test(navigator.userAgent) ? '⌘V' : 'Ctrl+V'

watch(url, () => { broken.value = false })

/** Uploads end up under {media}/images/ab/cd/{sha256}; anything else was typed in before uploads. */
const external = computed(() => Boolean(url.value) && !/\/images\/[0-9a-f]{2}\/[0-9a-f]{2}\/[0-9a-f]{64}/.test(url.value))

const use = (image: CatalogImage) => {
  url.value = image.url
  emit('size', image.width, image.height)
}

const send = async (file: Blob, name: string) => {
  error.value = ''
  if (!file.type.startsWith('image/')) {
    error.value = '这不是图片文件。'
    return
  }
  if (file.size > limits.value.maxBytes) {
    error.value = `图片太大，最多 ${Math.floor(limits.value.maxBytes / 1024 / 1024)} MB。`
    return
  }
  busy.value = true
  try {
    use(await upload(file, name))
  } catch (failure) {
    error.value = adminError(failure)
  } finally {
    busy.value = false
  }
}

const importAddress = async (address: string) => {
  error.value = ''
  busy.value = true
  try {
    use(await importUrl(address))
    linkOpen.value = false
    link.value = ''
  } catch (failure) {
    error.value = adminError(failure)
  } finally {
    busy.value = false
  }
}
const linkValid = computed(() => /^https?:\/\/\S+$/i.test(link.value.trim()))
const fromLink = () => {
  if (linkValid.value && !busy.value) void importAddress(link.value.trim())
}
const toggleLink = async () => {
  linkOpen.value = !linkOpen.value
  if (linkOpen.value) {
    await nextTick()
    linkInput.value?.focus()
  }
}

const pick = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (file) void send(file, file.name)
}

const drop = (event: DragEvent) => {
  dragging.value = false
  const file = [...(event.dataTransfer?.files ?? [])].find(entry => entry.type.startsWith('image/'))
  if (file && !busy.value && !props.disabled) void send(file, file.name)
}

const named = (blob: Blob) => `pasted.${blob.type.split('/')[1] ?? 'png'}`
const pastedFile = (event: ClipboardEvent) => [...(event.clipboardData?.files ?? [])].find(entry => entry.type.startsWith('image/'))

const pasteHere = (event: ClipboardEvent) => {
  const file = pastedFile(event)
  if (!file || busy.value || props.disabled) return
  event.preventDefault()
  event.stopPropagation()
  void send(file, named(file))
}

/** Ctrl+V / ⌘V anywhere on the page takes a pasted image, unless it goes into a text field or a dialog. */
const pasteOnPage = (event: ClipboardEvent) => {
  const target = event.target as HTMLElement | null
  if (busy.value || props.disabled || target?.closest('input, textarea, select, [contenteditable="true"], [role="dialog"]')) return
  const file = pastedFile(event)
  if (!file) return
  event.preventDefault()
  void send(file, named(file))
}
onMounted(() => document.addEventListener('paste', pasteOnPage))
onBeforeUnmount(() => document.removeEventListener('paste', pasteOnPage))

const fromClipboard = async () => {
  error.value = ''
  if (!navigator.clipboard?.read) {
    error.value = `浏览器不让读取剪贴板，请按 ${pasteKeys} 粘贴。`
    return
  }
  try {
    for (const item of await navigator.clipboard.read()) {
      const type = item.types.find(value => value.startsWith('image/'))
      if (type) {
        const blob = await item.getType(type)
        return await send(blob, named(blob))
      }
    }
    error.value = '剪贴板里没有图片。'
  } catch {
    error.value = `浏览器不让读取剪贴板，请按 ${pasteKeys} 粘贴。`
  }
}

const loaded = (event: Event) => {
  const image = event.target as HTMLImageElement
  emit('size', image.naturalWidth || null, image.naturalHeight || null)
}
const failed = () => {
  broken.value = true
  emit('size', null, null)
}

const clear = () => {
  url.value = ''
  error.value = ''
  emit('size', null, null)
}
</script>
