<template>
  <CatalogSection :title="$t('editor.album.section.editions')" :icon="Package" tone="emerald">
    <div class="space-y-4 p-3 sm:p-5">
      <p class="text-xs text-gray-500">{{ $t('editor.editions.hint') }}</p>
      <ul v-if="levelErrors.length" class="space-y-0.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
        <li v-for="error in levelErrors" :key="error.path">{{ error.message }}</li>
      </ul>
      <p v-if="unticked.length" class="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
        {{ $t('editor.editions.unticked', { discs: unticked.map(disc => $t('editor.album.disc_n', { n: disc.position })).join('、') }) }}
      </p>

      <div v-if="!products.length" class="rounded-xl border border-dashed border-gray-300 px-4 py-5 text-center text-sm text-gray-500">
        {{ $t('editor.editions.none') }}
      </div>

      <div v-for="(product, index) in products" :key="product.id" class="rounded-xl border p-4" :class="errorsOf(product.id).length ? 'border-rose-200 bg-rose-50/30' : 'border-gray-200'">
        <div class="mb-3 flex flex-wrap items-center gap-2">
          <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-bold text-emerald-700">{{ index + 1 }}</span>
          <input v-model="product.name" class="input input-sm min-w-40 flex-1 font-medium" :placeholder="$t('editor.editions.name_placeholder')">
          <select v-model="product.edition_type" class="select select-sm w-32">
            <option v-for="value in enums.edition_type ?? []" :key="value" :value="value">{{ enumLabel('edition_type', value) }}</option>
          </select>
          <select v-model="product.medium" class="select select-sm w-32">
            <option v-for="value in enums.product_medium ?? []" :key="value" :value="value">{{ enumLabel('product_medium', value) }}</option>
          </select>
          <span class="rounded bg-gray-100 px-2 py-1 font-mono text-[11px] text-gray-600" :title="$t('editor.editions.format_hint')">{{ formatOf(product.disc_ids) || '—' }}</span>
          <span class="ml-auto flex gap-0.5">
            <button type="button" class="btn btn-ghost btn-xs px-1.5" :disabled="index === 0" :title="$t('catalog.form.move_up')" @click="moveRow(album.products, product, -1)"><ArrowUp :size="12" /></button>
            <button type="button" class="btn btn-ghost btn-xs px-1.5" :disabled="index === products.length - 1" :title="$t('catalog.form.move_down')" @click="moveRow(album.products, product, 1)"><ArrowDown :size="12" /></button>
            <button type="button" class="btn btn-ghost btn-xs px-1.5 text-gray-400 hover:text-error" :aria-label="$t('common.delete')" @click="removeProduct(album, product.id)"><Trash2 :size="12" /></button>
          </span>
        </div>

        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label class="block">
            <span class="mb-1 block text-[11px] text-gray-500">{{ $t('catalog.field.catalog_number') }}</span>
            <input v-model="product.catalog_number" class="input input-sm w-full font-mono" placeholder="KICA-1234~5">
          </label>
          <label class="block">
            <span class="mb-1 block text-[11px] text-gray-500">{{ $t('catalog.field.barcode') }}</span>
            <input v-model="product.barcode" class="input input-sm w-full font-mono" inputmode="numeric" maxlength="32">
          </label>
          <div>
            <span class="mb-1 block text-[11px] text-gray-500">{{ $t('catalog.field.release_date') }}</span>
            <EditorDateInput v-model:date="product.release_date" v-model:precision="product.release_date_precision" />
          </div>
          <label class="block">
            <span class="mb-1 block text-[11px] text-gray-500">{{ $t('catalog.field.region') }}</span>
            <CommonRegionSelect :model-value="product.region ?? ''" class="select-sm" @update:model-value="product.region = $event || null" />
          </label>
          <div class="flex gap-2">
            <label class="block min-w-0 flex-1">
              <span class="mb-1 block text-[11px] text-gray-500">{{ $t('catalog.field.price') }}</span>
              <input v-model="product.price" class="input input-sm w-full" inputmode="decimal" placeholder="3300">
            </label>
            <label class="block w-20">
              <span class="mb-1 block text-[11px] text-gray-500">{{ $t('catalog.field.currency') }}</span>
              <input v-model="product.currency" class="input input-sm w-full font-mono uppercase" maxlength="3" placeholder="JPY" list="editor-currencies">
            </label>
          </div>
          <template v-if="product.edition_type === 'limited'">
            <label class="block">
              <span class="mb-1 block text-[11px] text-gray-500">{{ $t('catalog.field.limited_rule') }}</span>
              <select v-model="product.limited_rule" class="select select-sm w-full">
                <option :value="null">—</option>
                <option v-for="value in enums.limited_rule ?? []" :key="value" :value="value">{{ enumLabel('limited_rule', value) }}</option>
              </select>
            </label>
            <label class="block">
              <span class="mb-1 block text-[11px] text-gray-500">{{ $t('catalog.field.limited_name') }}</span>
              <input v-model="product.limited_name" class="input input-sm w-full" :placeholder="$t('editor.editions.limited_name_placeholder')">
            </label>
          </template>
          <div class="flex items-end gap-4 pb-1.5 text-sm text-gray-700">
            <label class="flex items-center gap-1.5"><input v-model="product.is_hires" type="checkbox" class="checkbox checkbox-sm">Hi-Res</label>
            <label class="flex items-center gap-1.5"><input v-model="product.is_available" type="checkbox" class="checkbox checkbox-sm">{{ $t('catalog.field.is_available') }}</label>
          </div>
        </div>

        <div class="mt-3 border-t border-gray-100 pt-3">
          <p class="mb-1.5 text-[11px] font-semibold text-gray-500">{{ $t('editor.editions.discs') }}</p>
          <div class="flex flex-wrap gap-2">
            <label v-for="disc in mainDiscs" :key="disc.id" class="flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs" :class="ticked(product.disc_ids, disc.id) ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-gray-200 text-gray-500'">
              <input type="checkbox" class="checkbox checkbox-xs" :checked="ticked(product.disc_ids, disc.id)" @change="setProductDisc(product, disc.id, ($event.target as HTMLInputElement).checked)">
              {{ $t('editor.album.disc_n', { n: disc.position }) }} · {{ enumLabel('disc_format', disc.format) }}<span v-if="disc.title" class="max-w-32 truncate text-gray-400"> · {{ disc.title }}</span>
            </label>
          </div>
        </div>
        <p v-for="error in errorsOf(product.id)" :key="error.path" class="mt-2 text-[11px] text-error">{{ error.message }}</p>
      </div>

      <datalist id="editor-currencies">
        <option v-for="code in ['JPY', 'CNY', 'USD', 'EUR', 'TWD', 'HKD', 'KRW', 'GBP']" :key="code" :value="code" />
      </datalist>
      <button type="button" class="btn btn-sm gap-1" @click="addProduct(album)"><Plus :size="14" />{{ $t('editor.editions.add') }}</button>
    </div>
  </CatalogSection>
</template>

<script setup lang="ts">
import type { RowId } from '~/types/document'
import { ArrowDown, ArrowUp, Package, Plus, Trash2 } from '@lucide/vue'
import { addProduct, findDisc, mainDiscs as mainDiscsOf, removeProduct, setProductDisc, sortedProducts, untickedDiscs } from '~/utils/albumDocument'
import { moveRow, sameId } from '~/utils/documentRows'

const editor = useAlbumEditor()
const { schema } = useCatalogSchema()
const { enumLabel } = useCatalogDisplay()

const album = computed(() => editor.album.value)
const enums = computed(() => schema.value?.enums ?? {})
const products = computed(() => sortedProducts(album.value))
const mainDiscs = computed(() => mainDiscsOf(album.value))
const unticked = computed(() => untickedDiscs(album.value))
const levelErrors = computed(() => editor.errorsIn('products').filter(error => error.path.split('.').length === 3))
const errorsOf = (id: RowId) => editor.errorsIn(`products.${id}`)
const ticked = (ids: RowId[], discId: RowId) => ids.some(id => sameId(id, discId))

const SHORT: Record<string, string> = { cd: 'CD', sacd: 'SACD', dvd: 'DVD', bd: 'BD', vinyl: 'LP', cassette: 'CT', digital: 'DL', other: '?' }

/** The edition's format as shops print it, e.g. 2CD+BD. */
const formatOf = (discIds: RowId[]) => {
  const counts = new Map<string, number>()
  for (const id of discIds) {
    const disc = findDisc(album.value, id)
    if (disc) counts.set(disc.format, (counts.get(disc.format) ?? 0) + 1)
  }
  return [...counts].map(([format, count]) => `${count > 1 ? count : ''}${SHORT[format] ?? format}`).join('+')
}
</script>
