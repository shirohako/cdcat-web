<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 translate-y-2"
      leave-active-class="transition duration-150 ease-in"
      leave-to-class="opacity-0 translate-y-2"
    >
      <!-- Teleported after the navbar, at its z-index, so it covers it; dialogs opened inside come later still. -->
      <div
        v-if="open"
        ref="layer"
        class="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-page"
        role="dialog"
        aria-modal="true"
        :aria-label="$t('editor.album.preview.title')"
        tabindex="-1"
        @click.capture="blockLinks"
      >
        <!-- As tall as the navbar, so the tracklist's sticky disc headers (top-14) sit right under it. -->
        <header class="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-line bg-card/95 px-4 backdrop-blur md:px-6">
          <span class="flex shrink-0 items-center gap-1.5 rounded-md bg-warning/15 px-2 py-1 text-xs font-bold text-warning">
            <Eye :size="14" />{{ $t('editor.album.preview.title') }}
          </span>
          <p class="min-w-0 flex-1 truncate text-sm text-meta">{{ $t('editor.album.preview.note') }}</p>
          <UiButton variant="ghost" icon="lucide:x" :label="$t('common.close')" size="sm" class="-mr-1.5 shrink-0" @click="open = false" />
        </header>
        <AlbumDetail v-if="album" :album="album" />
        <SkeletonCatalogDetail v-else hero="album" />
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import type { Album } from '~/types/album'
import { Eye } from '@lucide/vue'
import { dialogStack } from '~/utils/dialogStack'

/**
 * The album editor's 预览: the album page of the draft as it would be once published (POST /albums/preview),
 * over the whole screen. `album` is null while it loads. Nothing in it fetches, saves or navigates, as its ids
 * aren't real (useContentPreview); dialogs it opens itself, such as the tracklist settings, still work.
 */
defineProps<{ album: Album | null }>()
const open = defineModel<boolean>({ required: true })

provideContentPreview()

const layer = ref<HTMLElement | null>(null)
const token = Symbol('album-preview')

/** Links lead out of the editor; inside the preview they stay put. */
const blockLinks = (event: MouseEvent) => {
  if ((event.target as Element | null)?.closest('a[href]')) event.preventDefault()
}

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && !event.isComposing && dialogStack.at(-1) === token) {
    event.preventDefault()
    open.value = false
  }
}

const release = () => {
  const index = dialogStack.indexOf(token)
  if (index < 0) return
  dialogStack.splice(index, 1)
  window.removeEventListener('keydown', onKeydown)
  if (!dialogStack.length) document.body.style.overflow = ''
}

watch(open, async (value) => {
  if (!import.meta.client) return
  if (!value) return release()
  if (dialogStack.includes(token)) return
  dialogStack.push(token)
  window.addEventListener('keydown', onKeydown)
  document.body.style.overflow = 'hidden'
  await nextTick()
  layer.value?.focus({ preventScroll: true })
}, { immediate: true })

onBeforeUnmount(release)
</script>
