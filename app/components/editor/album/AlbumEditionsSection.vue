<template>
  <CatalogSection :title="$t('editor.album.section.editions')" :icon="Package" :description="$t('editor.editions.hint')">
    <div class="space-y-4 p-3 sm:p-5">
      <ul v-if="levelErrors.length" class="space-y-0.5 rounded-lg border border-danger/25 bg-danger/10 px-3 py-2 text-xs text-danger">
        <li v-for="error in levelErrors" :key="error.path">{{ error.message }}</li>
      </ul>
      <p v-if="unticked.length" class="rounded-lg border border-warning/25 bg-warning/10 px-3 py-2 text-xs text-warning">
        {{ $t('editor.editions.unticked', { discs: unticked.map(disc => $t('editor.album.disc_n', { n: disc.position })).join(separator) }) }}
      </p>

      <div v-if="!products.length" class="rounded-xl border border-dashed border-line px-4 py-5 text-center text-sm text-meta">
        {{ $t('editor.editions.none') }}
      </div>

      <ul v-else class="space-y-2">
        <li
          v-for="(product, index) in products"
          :key="product.id"
          class="group flex items-start gap-3 rounded-xl p-3 transition-colors"
          :class="errorsOf(product.id).length ? 'bg-danger/10 ring-1 ring-inset ring-danger/25' : 'bg-sunken hover:bg-card-hover'"
        >
          <span class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">{{ index + 1 }}</span>
          <div class="min-w-0 flex-1 cursor-pointer" @click="edit(product)">
            <p class="flex flex-wrap items-center gap-1.5">
              <span class="truncate text-sm font-semibold text-title">{{ product.name || enumLabel('edition_type', product.edition_type) }}</span>
              <span class="rounded-md bg-btn px-1.5 py-0.5 text-[11px] text-btn-content">{{ enumLabel('edition_type', product.edition_type) }}</span>
              <span class="rounded-md bg-btn px-1.5 py-0.5 font-mono text-[11px] text-btn-content" :title="$t('editor.editions.format_hint')">{{ formatOf(product.disc_ids) || '—' }}</span>
              <span v-if="product.is_hires" class="rounded-md bg-amber-50 px-1.5 py-0.5 text-[11px] text-amber-700 dark:bg-amber-400/15 dark:text-amber-300">Hi-Res</span>
            </p>
            <p class="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-meta">
              <span v-if="product.catalog_number" class="font-mono text-body">{{ product.catalog_number }}</span>
              <span v-if="product.barcode" class="font-mono">{{ product.barcode }}</span>
              <span v-if="product.release_date">{{ formatDate(product.release_date, product.release_date_precision) }}</span>
              <span v-if="product.region">{{ product.region }}</span>
              <span v-if="product.price">{{ product.price }} {{ product.currency ?? '' }}</span>
              <span v-if="product.edition_type === 'limited' && (product.limited_name || product.limited_rule)">{{ product.limited_name || enumLabel('limited_rule', product.limited_rule!) }}</span>
              <span v-if="!product.is_available" class="text-faint">{{ $t('editor.dialog.unavailable') }}</span>
            </p>
            <p v-for="error in errorsOf(product.id)" :key="error.path" class="mt-1 text-[11px] text-danger">{{ error.message }}</p>
          </div>
          <span class="flex shrink-0 gap-0.5">
            <UiButton :icon="ArrowUp" :label="$t('catalog.form.move_up')" icon-class="size-3" size="xs" class="ring-1 ring-inset ring-line shadow-xs active:translate-y-px" :disabled="index === 0" @click="moveRow(album.products, product, -1)" />
            <UiButton :icon="ArrowDown" :label="$t('catalog.form.move_down')" icon-class="size-3" size="xs" class="ring-1 ring-inset ring-line shadow-xs active:translate-y-px" :disabled="index === products.length - 1" @click="moveRow(album.products, product, 1)" />
            <UiButton :icon="PencilLine" :label="$t('common.edit')" icon-class="size-3" size="xs" class="ring-1 ring-inset ring-line shadow-xs active:translate-y-px" @click="edit(product)" />
            <UiButton variant="danger-soft" :icon="Trash2" :label="$t('common.delete')" icon-class="size-3" size="xs" class="ring-1 ring-inset ring-danger/20 shadow-xs active:translate-y-px" @click="removeProduct(album, product.id)" />
          </span>
        </li>
      </ul>

      <EditorAddButton @click="edit(null)">{{ $t('editor.editions.add') }}</EditorAddButton>
    </div>

    <EditorModal v-model="dialog" :title="$t(editing ? 'editor.dialog.edition_edit' : 'editor.editions.add')" :description="$t('editor.editions.hint')" :icon="Package" wide @submit="save">
      <div v-if="form" class="space-y-5">
        <div class="grid gap-4 sm:grid-cols-[minmax(0,1fr)_9rem_9rem]">
          <label class="block">
            <span class="mb-1 block text-sm font-medium text-body">{{ $t('editor.dialog.edition_name') }}</span>
            <input v-model="form.name" data-autofocus class="input input-sm w-full" :placeholder="$t('editor.editions.name_placeholder')">
          </label>
          <label class="block">
            <span class="mb-1 block text-sm font-medium text-body">{{ $t('catalog.field.edition_type') }}</span>
            <UiSelect v-model="form.edition_type" :options="editionTypeOptions" size="sm" class="w-full" />
          </label>
          <label class="block">
            <span class="mb-1 block text-sm font-medium text-body">{{ $t('catalog.field.medium') }}</span>
            <UiSelect v-model="form.medium" :options="mediumOptions" size="sm" class="w-full" />
          </label>
        </div>

        <div v-if="form.edition_type === 'limited'" class="grid gap-4 sm:grid-cols-2">
          <label class="block">
            <span class="mb-1 block text-sm font-medium text-body">{{ $t('catalog.field.limited_rule') }}</span>
            <UiSelect v-model="form.limited_rule" :options="limitedRuleOptions" size="sm" class="w-full" />
          </label>
          <label class="block">
            <span class="mb-1 block text-sm font-medium text-body">{{ $t('catalog.field.limited_name') }}</span>
            <input v-model="form.limited_name" class="input input-sm w-full" :placeholder="$t('editor.editions.limited_name_placeholder')">
          </label>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <label class="block">
            <span class="mb-1 block text-sm font-medium text-body">{{ $t('catalog.field.catalog_number') }}</span>
            <input v-model="form.catalog_number" class="input input-sm w-full font-mono" placeholder="KICA-1234~5">
          </label>
          <label class="block">
            <span class="mb-1 block text-sm font-medium text-body">{{ $t('catalog.field.barcode') }}</span>
            <input v-model="form.barcode" class="input input-sm w-full font-mono" inputmode="numeric" maxlength="32">
          </label>
          <div>
            <span class="mb-1 block text-sm font-medium text-body">{{ $t('catalog.field.release_date') }}</span>
            <EditorDateInput v-model:date="form.release_date" v-model:precision="form.release_date_precision" />
            <span class="mt-1 block text-[11px] text-meta">{{ $t('editor.dialog.edition_date_hint') }}</span>
          </div>
          <label class="block">
            <span class="mb-1 block text-sm font-medium text-body">{{ $t('catalog.field.region') }}</span>
            <CommonRegionSelect :model-value="form.region ?? ''" class="select-sm w-full" @update:model-value="form.region = $event || null" />
          </label>
          <div class="flex gap-2">
            <label class="block min-w-0 flex-1">
              <span class="mb-1 block text-sm font-medium text-body">{{ $t('catalog.field.price') }}</span>
              <input v-model="form.price" class="input input-sm w-full" inputmode="decimal" placeholder="3300">
            </label>
            <label class="block w-24">
              <span class="mb-1 block text-sm font-medium text-body">{{ $t('catalog.field.currency') }}</span>
              <input v-model="form.currency" class="input input-sm w-full font-mono uppercase" maxlength="3" placeholder="JPY" list="editor-currencies">
            </label>
          </div>
          <div class="flex items-end gap-5 pb-1.5 text-sm text-body">
            <label class="flex items-center gap-1.5"><input v-model="form.is_hires" type="checkbox" class="checkbox checkbox-sm">Hi-Res</label>
            <label class="flex items-center gap-1.5"><input v-model="form.is_available" type="checkbox" class="checkbox checkbox-sm">{{ $t('catalog.field.is_available') }}</label>
          </div>
        </div>

        <div>
          <p class="mb-1.5 flex items-center gap-2 text-sm font-medium text-body">
            {{ $t('editor.editions.discs') }}
            <span class="rounded bg-btn px-1.5 py-0.5 font-mono text-[11px] font-normal text-btn-content">{{ formatOf(form.disc_ids) || '—' }}</span>
          </p>
          <div class="flex flex-wrap gap-2">
            <label v-for="disc in mainDiscs" :key="disc.id" class="flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition-colors" :class="ticked(form.disc_ids, disc.id) ? 'border-primary/40 bg-primary/10 text-primary' : 'border-line text-meta hover:bg-card-hover'">
              <input type="checkbox" class="checkbox checkbox-xs" :checked="ticked(form.disc_ids, disc.id)" @change="setProductDisc(form, disc.id, ($event.target as HTMLInputElement).checked)">
              {{ $t('editor.album.disc_n', { n: disc.position }) }} · {{ enumLabel('disc_format', disc.format) }}<span v-if="disc.title" class="max-w-32 truncate text-faint"> · {{ disc.title }}</span>
            </label>
          </div>
        </div>
      </div>
      <datalist id="editor-currencies">
        <option v-for="code in ['JPY', 'CNY', 'USD', 'EUR', 'TWD', 'HKD', 'KRW', 'GBP']" :key="code" :value="code" />
      </datalist>
      <template #footer>
        <UiButton size="sm" class="ring-1 ring-inset ring-line shadow-xs active:translate-y-px" @click="dialog = false">{{ $t('common.cancel') }}</UiButton>
        <UiButton type="submit" variant="primary" size="sm" class="shadow-xs active:translate-y-px">{{ $t(editing ? 'common.save' : 'common.add') }}</UiButton>
      </template>
    </EditorModal>
  </CatalogSection>
</template>

<script setup lang="ts">
import type { AlbumProductRow } from '~/utils/albumDocument'
import type { RowId } from '~/types/document'
import type { UiSelectOption } from '~/components/ui/Select.vue'
import { ArrowDown, ArrowUp, Package, PencilLine, Trash2 } from '@lucide/vue'
import { blankProduct, findDisc, mainDiscs as mainDiscsOf, removeProduct, setProductDisc, sortedProducts, untickedDiscs } from '~/utils/albumDocument'
import { moveRow, sameId } from '~/utils/documentRows'

const editor = useAlbumEditor()
const { schema } = useCatalogSchema()
const { enumLabel, formatDate } = useCatalogDisplay()
const { separator } = useListPunctuation()

const album = computed(() => editor.album.value)
const enums = computed(() => schema.value?.enums ?? {})
const editionTypeOptions = computed<UiSelectOption<string>[]>(() => (enums.value.edition_type ?? []).map(value => ({ value, label: enumLabel('edition_type', value) })))
const mediumOptions = computed<UiSelectOption<string>[]>(() => (enums.value.product_medium ?? []).map(value => ({ value, label: enumLabel('product_medium', value) })))
const limitedRuleOptions = computed<UiSelectOption<string | null>[]>(() => [
  { value: null, label: '—' },
  ...(enums.value.limited_rule ?? []).map(value => ({ value, label: enumLabel('limited_rule', value) })),
])
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

// ---- the dialog: edits a copy, written back on save ----

const dialog = ref(false)
const editing = ref<AlbumProductRow | null>(null)
const form = ref<AlbumProductRow | null>(null)

const edit = (product: AlbumProductRow | null) => {
  editing.value = product
  form.value = product ? JSON.parse(JSON.stringify(product)) : blankProduct(album.value)
  dialog.value = true
}

const save = () => {
  if (!form.value) return
  const values = { ...form.value, name: form.value.name?.trim() || null, currency: form.value.currency?.trim().toUpperCase() || null }
  if (values.edition_type !== 'limited') Object.assign(values, { limited_rule: null, limited_name: null })
  if (editing.value) Object.assign(editing.value, { ...values, id: editing.value.id, sort_order: editing.value.sort_order })
  else album.value.products.push(values)
  dialog.value = false
}
</script>
