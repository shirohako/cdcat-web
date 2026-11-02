<template>
  <EditorImageSlot variant="cover" :file="file" :missing="!!cover && !file" :error="error" paste-on-page @use="use" />
</template>

<script setup lang="ts">
import type { CatalogImage } from '~/types/catalog'
import { addMainImage, coverOf } from '~/utils/albumDocument'

/**
 * The album's main cover, in 基本信息 and in 图片: an upload here becomes the main cover, the one before stays in the
 * gallery as another cover. Ctrl+V / ⌘V on the page pastes into it.
 */
const editor = useAlbumEditor()

const cover = computed(() => coverOf(editor.album.value))
const file = computed(() => cover.value ? editor.references.images?.[String(cover.value.image_id)] as CatalogImage | undefined : undefined)
// Its own problem (not square …), or, while there is no cover, the album's "needs exactly one main cover".
const error = computed(() => cover.value ? editor.errorAt('images', cover.value.id, 'image_id') : editor.errorAt('images'))

const use = (image: CatalogImage) => {
  editor.remember('images', image.id, image)
  addMainImage(editor.album.value, 'cover', image.id)
}
</script>
