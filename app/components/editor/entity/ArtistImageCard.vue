<template>
  <li v-if="image" class="relative flex gap-3 rounded-xl border p-3 transition-opacity sm:gap-4" :class="[errors.length ? 'border-danger/25 bg-danger/10' : 'border-line', dragging && 'opacity-40']">
    <!-- Where the row being dragged would land, in the middle of the gap between two rows. -->
    <span v-if="dropEdge" class="pointer-events-none absolute inset-x-2 h-0.5 rounded-full bg-primary" :class="dropEdge === 'before' ? '-top-1.25' : '-bottom-1.25'" />
    <!-- Dragging starts from the handle only, so text in the fields can still be selected; the buttons move rows by keyboard and touch. -->
    <span class="-ml-1 flex w-4 shrink-0 cursor-grab touch-none items-center justify-center self-stretch text-faint transition-colors hover:text-body active:cursor-grabbing" aria-hidden="true" @pointerdown="emit('grab')">
      <GripVertical :size="16" />
    </span>
    <!-- The whole image at its own shape, its size underneath. -->
    <figure class="w-24 shrink-0 sm:w-28">
      <a :href="file?.url" target="_blank" rel="noopener" class="block" draggable="false">
        <img v-if="file" :src="file.thumbnail_url" alt="" class="mx-auto max-h-40 max-w-full rounded-lg bg-sunken object-contain ring-1 ring-line" loading="lazy">
        <span v-else class="flex aspect-square w-full items-center justify-center rounded-lg bg-sunken p-2 text-center text-11 text-danger">{{ $t('editor.image.missing') }}</span>
      </a>
      <figcaption v-if="file" class="mt-1.5 text-center text-11 tabular-nums text-meta">{{ file.width }} × {{ file.height }}</figcaption>
    </figure>
    <div class="@container min-w-0 flex-1 space-y-2">
      <!-- Kind and label share one line when the form is wide enough, the row's buttons at its end. -->
      <div class="grid gap-2 @sm:grid-cols-2 @xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
        <UiSelect v-model="image.kind" :options="kindOptions" size="sm" class="w-full" :aria-label="$t('catalog.field.kind')" />
        <input v-model="image.label" class="input input-sm w-full" maxlength="100" :placeholder="$t('editor.artist_image.label_placeholder')" :aria-label="$t('catalog.field.label')">
        <span class="flex flex-wrap justify-end gap-1 @sm:col-span-2 @xl:col-span-1">
          <!-- Another avatar or banner becomes the main one only from here; one that doesn't fit says why. -->
          <UiButton
            v-if="mainKind"
            :icon="Star"
            icon-class="size-3.5"
            size="sm"
            class="gap-1 ring-1 ring-inset ring-line shadow-xs active:translate-y-px"
            :disabled="!!mainProblem"
            :title="mainProblem || undefined"
            @click="makeMainImage(doc.images, image)"
          >{{ $t(mainKind === 'avatar' ? 'editor.artist_image.use_as_avatar' : 'editor.image.use_as_banner') }}</UiButton>
          <UiButton :icon="ArrowUp" :label="$t('catalog.form.move_up')" icon-class="size-3.5" size="sm" class="ring-1 ring-inset ring-line shadow-xs active:translate-y-px" :disabled="first" @click="emit('move', -1)" />
          <UiButton :icon="ArrowDown" :label="$t('catalog.form.move_down')" icon-class="size-3.5" size="sm" class="ring-1 ring-inset ring-line shadow-xs active:translate-y-px" :disabled="last" @click="emit('move', 1)" />
          <UiButton variant="danger-soft" :icon="Trash2" :label="$t('common.delete')" icon-class="size-3.5" size="sm" class="ring-1 ring-inset ring-danger/20 shadow-xs active:translate-y-px" @click="removeArtistImage(doc, imageId)" />
        </span>
      </div>
      <input v-model="image.caption" class="input input-sm w-full" maxlength="500" :placeholder="$t('editor.image.caption_placeholder')">
      <p v-for="error in errors" :key="error.path" class="text-11 text-danger">{{ error.message }}</p>
    </div>
  </li>
</template>

<script setup lang="ts">
import type { CatalogImage } from '~/types/catalog'
import type { ArtistDocument, RowId } from '~/types/document'
import { ArrowDown, ArrowUp, GripVertical, Star, Trash2 } from '@lucide/vue'
import { removeArtistImage } from '~/utils/artistImages'
import { sameId } from '~/utils/documentRows'
import { isSquare } from '~/utils/imageCrop'
import { makeMainImage } from '~/utils/mainImages'

/**
 * One row of the artist editor's gallery. The section orders the rows: `grab` when the handle is pressed (the row then
 * becomes draggable), `dragging` while this row is dragged, `dropEdge` where a dragged row would land.
 */
const props = defineProps<{ imageId: RowId, first: boolean, last: boolean, dragging?: boolean, dropEdge?: 'before' | 'after' | null }>()
const emit = defineEmits<{ move: [delta: number], grab: [] }>()

const editor = useEntityEditor()
const { t } = useI18n()
const artistImageKindOptions = useArtistImageKindOptions()
const { limits, bannerFits } = useImageUpload()

const doc = computed(() => editor.doc.value as unknown as ArtistDocument)
const image = computed(() => doc.value.images.find(row => sameId(row.id, props.imageId)) ?? null)
const file = computed(() => image.value ? editor.references.images?.[String(image.value.image_id)] as CatalogImage | undefined : undefined)
const errors = computed(() => editor.errorsIn(`images.${props.imageId}`))
const kindOptions = computed(() => artistImageKindOptions())
/** Another avatar or banner can become the main one, when it is the right shape and size. */
const mainKind = computed(() => image.value?.kind === 'avatar' || image.value?.kind === 'banner' ? image.value.kind : null)
const mainProblem = computed(() => {
  if (!mainKind.value || !file.value) return mainKind.value ? t('editor.image.missing') : ''
  const { width, height } = file.value
  if (mainKind.value === 'banner') return bannerFits(width, height) ? '' : t('editor.image.banner_rules', { width: limits.value.bannerMinWidth, height: limits.value.bannerMinHeight })
  return Math.min(width, height) >= limits.value.avatarMinSize && isSquare(width, height, limits.value.tolerance) ? '' : t('editor.artist_image.avatar_rules', { size: limits.value.avatarMinSize })
})
</script>
