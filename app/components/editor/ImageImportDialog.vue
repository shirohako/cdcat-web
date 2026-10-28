<template>
  <EditorModal v-model="open" :title="title ?? $t('editor.image.from_url')" :description="description ?? $t('editor.dialog.image_url_hint')" :icon="Link2" @submit="submit">
    <div class="space-y-3">
      <label class="block">
        <span class="mb-1 block text-sm font-medium text-body">{{ $t('editor.dialog.image_url') }}</span>
        <input v-model.trim="url" data-autofocus type="url" inputmode="url" class="input w-full" :class="{ 'input-error': error }" placeholder="https://" :disabled="busy">
      </label>
      <div class="flex h-40 items-center justify-center overflow-hidden rounded-xl border border-dashed border-line bg-sunken">
        <img v-if="previewable && !broken" :src="url" alt="" class="max-h-full max-w-full object-contain" referrerpolicy="no-referrer" @error="broken = true">
        <span v-else class="flex flex-col items-center gap-1.5 px-4 text-center text-xs text-meta">
          <ImageOff v-if="broken" :size="22" /><ImageIcon v-else :size="22" />
          {{ $t(broken ? 'editor.dialog.image_no_preview' : 'editor.dialog.image_preview') }}
        </span>
      </div>
      <p v-if="error" class="text-xs text-danger">{{ error }}</p>
      <slot />
    </div>
    <template #footer>
      <button type="button" class="btn btn-sm ring-1 ring-inset ring-line shadow-xs transition active:translate-y-px" @click="open = false">{{ $t('common.cancel') }}</button>
      <button type="submit" class="btn btn-primary btn-sm shadow-xs transition active:translate-y-px" :disabled="!previewable || busy">
        <span v-if="busy" class="loading loading-spinner loading-xs" />{{ $t('editor.image.import') }}
      </button>
    </template>
  </EditorModal>
</template>

<script setup lang="ts">
import { Image as ImageIcon, ImageOff, Link2 } from '@lucide/vue'

/**
 * Asks for an image's address and shows it before the server fetches it. The parent imports on
 * `import`, shows failures through `error` and closes the dialog when it worked.
 */
withDefaults(defineProps<{ busy?: boolean, error?: string, title?: string, description?: string }>(), { error: '', title: undefined, description: undefined })
const open = defineModel<boolean>({ required: true })
const emit = defineEmits<{ import: [url: string] }>()

const url = ref('')
const broken = ref(false)
const previewable = computed(() => /^https?:\/\/\S+$/i.test(url.value))
watch(url, () => { broken.value = false })
watch(open, (value) => {
  if (value) url.value = ''
})

const submit = () => {
  if (previewable.value) emit('import', url.value)
}
</script>
