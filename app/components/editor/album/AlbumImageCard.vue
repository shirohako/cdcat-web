<template>
  <li v-if="image" class="flex gap-3 rounded-xl border p-3" :class="errors.length ? 'border-rose-200 bg-rose-50/40' : 'border-gray-200'">
    <a :href="file?.url" target="_blank" rel="noopener" class="block h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-gray-100">
      <img v-if="file" :src="file.thumbnail_url" alt="" class="h-full w-full object-cover" loading="lazy">
    </a>
    <div class="min-w-0 flex-1 space-y-2">
      <div class="flex flex-wrap items-center gap-2">
        <select v-model="image.kind" class="select select-sm w-36" :aria-label="$t('catalog.field.kind')">
          <option v-for="value in kinds" :key="value" :value="value" :disabled="value === 'cover' && !isCover && hasCover">{{ enumLabel('image_kind', value) }}</option>
        </select>
        <input v-model="image.label" class="input input-sm w-28" :list="`editor-image-labels-${image.kind}`" maxlength="100" :placeholder="$t('editor.image.label_placeholder')">
        <select :value="scope" class="select select-sm w-44" :aria-label="$t('editor.image.scope')" @change="setScope(($event.target as HTMLSelectElement).value)">
          <option value="album">{{ $t('editor.image.scope_album') }}</option>
          <optgroup v-if="products.length" :label="$t('catalog.collection.products')">
            <option v-for="product in products" :key="product.id" :value="`p:${product.id}`">{{ product.name || product.catalog_number || enumLabel('edition_type', product.edition_type) }}</option>
          </optgroup>
          <optgroup v-if="bonuses.length" :label="$t('catalog.collection.bonuses')">
            <option v-for="bonus in bonuses" :key="bonus.id" :value="`b:${bonus.id}`">{{ bonus.name || '…' }}</option>
          </optgroup>
          <optgroup :label="$t('catalog.collection.discs')">
            <option v-for="disc in discs" :key="disc.id" :value="`d:${disc.id}`">{{ $t('editor.album.disc_n', { n: disc.position }) }}</option>
          </optgroup>
        </select>
        <span class="ml-auto flex gap-0.5">
          <button type="button" class="btn btn-ghost btn-xs px-1.5" :disabled="first" :title="$t('catalog.form.move_up')" @click="emit('move', -1)"><ArrowUp :size="12" /></button>
          <button type="button" class="btn btn-ghost btn-xs px-1.5" :disabled="last" :title="$t('catalog.form.move_down')" @click="emit('move', 1)"><ArrowDown :size="12" /></button>
          <button type="button" class="btn btn-ghost btn-xs px-1.5 text-gray-400 hover:text-error" :aria-label="$t('common.delete')" @click="removeImage(album, imageId)"><Trash2 :size="12" /></button>
        </span>
      </div>
      <input v-model="image.caption" class="input input-sm w-full" maxlength="500" :placeholder="$t('editor.image.caption_placeholder')">
      <details :open="hasAttributes">
        <summary class="cursor-pointer text-[11px] font-medium text-gray-500">{{ $t('catalog.collection.image_attributes') }}<span v-if="hasAttributes"> ({{ attributeCount }})</span></summary>
        <EditorAttributeRows v-model="album.image_attributes" compact subject="album_image" :owner="{ field: 'album_image_id', id: imageId }" :references="editor.references" class="mt-2" />
      </details>
      <p v-if="file" class="text-[10px] text-gray-400">{{ file.width }} × {{ file.height }}</p>
      <p v-for="error in errors" :key="error.path" class="text-[11px] text-error">{{ error.message }}</p>
    </div>
  </li>
</template>

<script setup lang="ts">
import type { CatalogImage } from '~/types/catalog'
import type { RowId } from '~/types/document'
import { ArrowDown, ArrowUp, Trash2 } from '@lucide/vue'
import { coverOf, removeImage, sortedDiscs, sortedProducts } from '~/utils/albumDocument'
import { byOrder, sameId } from '~/utils/documentRows'

const props = defineProps<{ imageId: RowId, first: boolean, last: boolean }>()
const emit = defineEmits<{ move: [delta: number] }>()

const editor = useAlbumEditor()
const { schema } = useCatalogSchema()
const { enumLabel } = useCatalogDisplay()

const album = computed(() => editor.album.value)
const image = computed(() => album.value.images.find(row => sameId(row.id, props.imageId)) ?? null)
const kinds = computed(() => schema.value?.enums?.image_kind ?? [])
const products = computed(() => sortedProducts(album.value))
const bonuses = computed(() => byOrder(album.value.bonuses))
const discs = computed(() => sortedDiscs(album.value))
const file = computed(() => image.value ? editor.references.images?.[String(image.value.image_id)] as CatalogImage | undefined : undefined)
const errors = computed(() => editor.errorsIn(`images.${props.imageId}`))
const hasCover = computed(() => !!coverOf(album.value))
const isCover = computed(() => image.value?.kind === 'cover')
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
