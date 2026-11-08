<template>
  <li v-if="image" class="relative flex flex-wrap gap-3 rounded-xl border p-3 transition-opacity sm:flex-nowrap sm:gap-4" :class="[errors.length ? 'border-danger/25 bg-danger/10' : 'border-line', dragging && 'opacity-40']">
    <!-- Where the row being dragged would land, in the middle of the gap between two rows. -->
    <span v-if="dropEdge" class="pointer-events-none absolute inset-x-2 h-0.5 rounded-full bg-primary" :class="dropEdge === 'before' ? '-top-1.25' : '-bottom-1.25'" />
    <!-- Dragging starts from the handle only, so text in the fields can still be selected; the buttons move rows by keyboard and touch, so touch has no handle. -->
    <span class="-ml-1 flex w-4 shrink-0 cursor-grab touch-none items-center justify-center self-stretch text-faint transition-colors hover:text-body active:cursor-grabbing [@media(hover:none)]:hidden" aria-hidden="true" @pointerdown="emit('grab')">
      <GripVertical :size="16" />
    </span>
    <!-- The whole image at its own shape (scans are often far from square), its size underneath. -->
    <figure class="mx-auto w-28 shrink-0 sm:mx-0 sm:w-36">
      <a :href="file?.url" target="_blank" rel="noopener" class="block" draggable="false">
        <img v-if="file" :src="file.thumbnail_url" alt="" class="mx-auto max-h-52 max-w-full rounded-lg bg-sunken object-contain ring-1 ring-line" loading="lazy">
        <span v-else class="flex aspect-square w-full items-center justify-center rounded-lg bg-sunken p-2 text-center text-11 text-danger">{{ $t('editor.image.missing') }}</span>
      </a>
      <figcaption v-if="file" class="mt-1.5 text-center text-11 tabular-nums text-meta">{{ file.width }} × {{ file.height }}</figcaption>
    </figure>
    <div class="@container min-w-0 flex-1 basis-full space-y-2 sm:basis-0">
      <!-- Kind, label and scope share one line when the form is wide enough, the row's buttons at its end; narrower, two lines. -->
      <div class="grid gap-2 @sm:grid-cols-2 @2xl:grid-cols-[minmax(0,1fr)_7rem_minmax(0,1fr)_auto]">
        <UiSelect v-model="image.kind" :options="kindOptions" size="sm" class="w-full" :aria-label="$t('catalog.field.kind')" />
        <input v-model="image.label" class="input input-sm w-full" :list="`editor-image-labels-${image.kind}`" maxlength="100" :placeholder="$t('editor.image.label_placeholder')" :aria-label="$t('catalog.field.label')">
        <UiSelect :model-value="scope" :options="scopeOptions" size="sm" class="w-full" :aria-label="$t('editor.image.scope')" @change="setScope" />
        <span class="flex flex-wrap justify-end gap-1">
          <!-- Another cover or banner becomes the main one only from here; one that doesn't fit says why. -->
          <UiButton
            v-if="mainKind"
            :icon="Star"
            icon-class="size-3.5"
            size="sm"
            class="gap-1 ring-1 ring-inset ring-line shadow-xs active:translate-y-px"
            :disabled="!!mainProblem"
            :title="mainProblem || undefined"
            @click="useAsMain(album, image)"
          >{{ $t(`editor.image.use_as_${mainKind}`) }}</UiButton>
          <UiButton :icon="ArrowUp" :label="$t('catalog.form.move_up')" icon-class="size-3.5" size="sm" class="ring-1 ring-inset ring-line shadow-xs active:translate-y-px" :disabled="first" @click="emit('move', -1)" />
          <UiButton :icon="ArrowDown" :label="$t('catalog.form.move_down')" icon-class="size-3.5" size="sm" class="ring-1 ring-inset ring-line shadow-xs active:translate-y-px" :disabled="last" @click="emit('move', 1)" />
          <UiButton variant="danger-soft" :icon="Trash2" :label="$t('common.delete')" icon-class="size-3.5" size="sm" class="ring-1 ring-inset ring-danger/20 shadow-xs active:translate-y-px" @click="removeImage(album, imageId)" />
        </span>
      </div>
      <input v-model="image.caption" class="input input-sm w-full" maxlength="500" :placeholder="$t('editor.image.caption_placeholder')">
      <details :open="hasAttributes">
        <summary class="cursor-pointer text-11 font-medium text-meta transition-colors hover:text-primary">{{ $t('catalog.collection.image_attributes') }}<span v-if="hasAttributes"> ({{ attributeCount }})</span></summary>
        <EditorAttributeRows v-model="album.image_attributes" compact subject="album_image" :owner="{ field: 'album_image_id', id: imageId }" :references="editor.references" class="mt-2" />
      </details>
      <p v-for="error in errors" :key="error.path" class="text-11 text-danger">{{ error.message }}</p>
    </div>
  </li>
</template>

<script setup lang="ts">
import type { CatalogImage } from '~/types/catalog'
import type { RowId } from '~/types/document'
import type { UiSelectOption } from '~/components/ui/Select.vue'
import { ArrowDown, ArrowUp, GripVertical, Star, Trash2 } from '@lucide/vue'
import { removeImage, sortedDiscs, sortedProducts, useAsMain } from '~/utils/albumDocument'
import { byOrder, sameId } from '~/utils/documentRows'

/**
 * One row of the album editor's image list. The section orders the rows: `grab` when the handle is pressed (the
 * row then becomes draggable), `dragging` while this row is dragged, `dropEdge` where a dragged row would land.
 */
const props = defineProps<{ imageId: RowId, first: boolean, last: boolean, dragging?: boolean, dropEdge?: 'before' | 'after' | null }>()
const emit = defineEmits<{ move: [delta: number], grab: [] }>()

const editor = useAlbumEditor()
const { enumLabel } = useCatalogDisplay()
const { t } = useI18n()
const imageKindOptions = useImageKindOptions()
const { limits, coverProblem, bannerFits } = useImageUpload()

const album = computed(() => editor.album.value)
const image = computed(() => album.value.images.find(row => sameId(row.id, props.imageId)) ?? null)
const products = computed(() => sortedProducts(album.value))
const bonuses = computed(() => byOrder(album.value.bonuses))
const discs = computed(() => sortedDiscs(album.value))
const file = computed(() => image.value ? editor.references.images?.[String(image.value.image_id)] as CatalogImage | undefined : undefined)
const errors = computed(() => editor.errorsIn(`images.${props.imageId}`))
const kindOptions = computed(() => imageKindOptions())
/** A cover or banner of the gallery can become the main one, when it is the right shape and size. */
const mainKind = computed(() => image.value?.kind === 'cover' || image.value?.kind === 'banner' ? image.value.kind : null)
const mainProblem = computed(() => {
  if (!mainKind.value || !file.value) return mainKind.value ? t('editor.image.missing') : ''
  if (mainKind.value === 'banner') return bannerFits(file.value.width, file.value.height) ? '' : t('editor.image.banner_rules', { width: limits.value.bannerMinWidth, height: limits.value.bannerMinHeight })
  return coverProblem(file.value.width, file.value.height) ? t('editor.image.cover_rules', { size: limits.value.coverMinSize }) : ''
})
const scopeOptions = computed<UiSelectOption<string>[]>(() => [
  { value: 'album', label: t('editor.image.scope_album') },
  ...products.value.map(product => ({ value: `p:${product.id}`, label: product.name || product.catalog_number || enumLabel('edition_type', product.edition_type), group: t('catalog.collection.products') })),
  ...bonuses.value.map(bonus => ({ value: `b:${bonus.id}`, label: bonus.name || '…', group: t('catalog.collection.bonuses') })),
  ...discs.value.map(disc => ({ value: `d:${disc.id}`, label: t('editor.album.disc_n', { n: disc.position }), group: t('catalog.collection.discs') })),
])
const attributeCount = computed(() => album.value.image_attributes.filter(row => sameId(row.album_image_id, props.imageId)).length)
const hasAttributes = computed(() => attributeCount.value > 0)

const scope = computed(() => !image.value ? 'album'
  : image.value.product_id !== null ? `p:${image.value.product_id}`
    : image.value.bonus_id !== null ? `b:${image.value.bonus_id}`
      : image.value.disc_id !== null ? `d:${image.value.disc_id}` : 'album')

/** An image belongs to the album, or to one edition, bonus or disc. */
const setScope = (value: string) => {
  const [kind, id] = value.split(':') as [string, string | undefined]
  const find = (rows: Array<{ id: string | number }>) => rows.find(row => String(row.id) === id)?.id ?? null
  if (!image.value) return
  image.value.product_id = kind === 'p' ? find(products.value) : null
  image.value.bonus_id = kind === 'b' ? find(bonuses.value) : null
  image.value.disc_id = kind === 'd' ? find(discs.value) : null
}
</script>
