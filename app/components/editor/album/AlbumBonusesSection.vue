<template>
  <CatalogSection :title="$t('editor.album.section.bonuses')" :icon="Gift" tone="pink">
    <div class="space-y-4 p-3 sm:p-5">
      <p class="text-xs text-gray-500">{{ $t('editor.bonuses.hint') }}</p>
      <p v-if="!bonuses.length" class="text-sm text-gray-400">{{ $t('editor.bonuses.none') }}</p>

      <div v-for="(bonus, index) in bonuses" :key="bonus.id" class="rounded-xl border p-4" :class="errorsOf(bonus.id).length ? 'border-rose-200 bg-rose-50/30' : 'border-pink-100'">
        <div class="mb-3 flex flex-wrap items-center gap-2">
          <input v-model="bonus.name" class="input input-sm min-w-48 flex-1 font-medium" :class="{ 'input-error': editor.errorAt('bonuses', bonus.id, 'name') }" :placeholder="$t('editor.bonuses.name_placeholder')">
          <select v-model="bonus.type" class="select select-sm w-40">
            <option v-for="value in enums.bonus_type ?? []" :key="value" :value="value">{{ enumLabel('bonus_type', value) }}</option>
          </select>
          <span class="ml-auto flex gap-0.5">
            <button type="button" class="btn btn-ghost btn-xs px-1.5" :disabled="index === 0" :title="$t('catalog.form.move_up')" @click="moveRow(album.bonuses, bonus, -1)"><ArrowUp :size="12" /></button>
            <button type="button" class="btn btn-ghost btn-xs px-1.5" :disabled="index === bonuses.length - 1" :title="$t('catalog.form.move_down')" @click="moveRow(album.bonuses, bonus, 1)"><ArrowDown :size="12" /></button>
            <button type="button" class="btn btn-ghost btn-xs px-1.5 text-gray-400 hover:text-error" :aria-label="$t('common.delete')" @click="remove(bonus.id)"><Trash2 :size="12" /></button>
          </span>
        </div>

        <div class="grid gap-3 sm:grid-cols-3">
          <label class="block">
            <span class="mb-1 block text-[11px] text-gray-500">{{ $t('catalog.field.shop') }}</span>
            <input v-model="bonus.shop" class="input input-sm w-full" maxlength="100" :placeholder="$t('editor.bonuses.shop_placeholder')">
          </label>
          <label class="block">
            <span class="mb-1 block text-[11px] text-gray-500">{{ $t('catalog.field.availability') }}</span>
            <select v-model="bonus.availability" class="select select-sm w-full">
              <option :value="null">—</option>
              <option v-for="value in enums.limited_rule ?? []" :key="value" :value="value">{{ enumLabel('limited_rule', value) }}</option>
            </select>
          </label>
          <div>
            <span class="mb-1 block text-[11px] text-gray-500">{{ $t('catalog.field.event_id') }}</span>
            <div v-if="bonus.event_id" class="flex items-center gap-1.5 text-sm">
              <EditorRefLabel :id="bonus.event_id" type="events" :references="editor.references" />
              <button type="button" class="btn btn-ghost btn-xs px-1" :aria-label="$t('common.delete')" @click="bonus.event_id = null"><X :size="12" /></button>
            </div>
            <EditorEntityPicker v-else kind="event" @select="pickEvent(bonus, $event)" />
          </div>
        </div>

        <label class="mt-3 flex items-center gap-1.5 text-sm text-gray-700"><input v-model="bonus.is_digital" type="checkbox" class="checkbox checkbox-sm">{{ $t('editor.bonuses.is_digital') }}</label>

        <div v-if="products.length > 1" class="mt-3">
          <p class="mb-1.5 text-[11px] font-semibold text-gray-500">{{ $t('editor.bonuses.editions') }}</p>
          <div class="flex flex-wrap gap-2">
            <label v-for="product in products" :key="product.id" class="flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs" :class="has(bonus.product_ids, product.id) ? 'border-pink-300 bg-pink-50 text-pink-800' : 'border-gray-200 text-gray-500'">
              <input type="checkbox" class="checkbox checkbox-xs" :checked="has(bonus.product_ids, product.id)" @change="toggleProduct(bonus, product.id)">
              {{ productName(product) }}
            </label>
          </div>
          <p class="mt-1 text-[11px] text-gray-400">{{ $t('editor.bonuses.editions_hint') }}</p>
        </div>

        <div class="mt-3">
          <p class="mb-1.5 text-[11px] font-semibold text-gray-500">{{ $t('editor.bonuses.discs') }}</p>
          <div class="flex flex-wrap items-center gap-2">
            <span v-for="disc in discsOf(bonus.id)" :key="disc.id" class="inline-flex items-center gap-1 rounded-lg bg-pink-50 px-2 py-1 text-xs text-pink-800">
              <Disc3 :size="11" />{{ $t('editor.album.disc_n', { n: disc.position }) }} · {{ enumLabel('disc_format', disc.format) }}
              <button type="button" class="ml-0.5 text-pink-400 hover:text-pink-700" :title="$t('editor.bonuses.unlink_disc')" @click="setDiscBonus(album, disc.id, null)"><X :size="11" /></button>
            </span>
            <button type="button" class="btn btn-ghost btn-xs gap-1" @click="addBonusDisc(bonus.id)"><Plus :size="11" />{{ $t('editor.bonuses.add_disc') }}</button>
            <select v-if="freeDiscs.length" class="select select-sm h-7 w-44 text-xs" @change="useDisc(bonus.id, $event)">
              <option value="">{{ $t('editor.bonuses.use_disc') }}</option>
              <option v-for="disc in freeDiscs" :key="disc.id" :value="String(disc.id)">{{ $t('editor.album.disc_n', { n: disc.position }) }}{{ disc.title ? ` · ${disc.title}` : '' }}</option>
            </select>
          </div>
          <p class="mt-1 text-[11px] text-gray-400">{{ $t('editor.bonuses.discs_hint') }}</p>
        </div>

        <div class="mt-3 grid gap-3 sm:grid-cols-2">
          <label class="block">
            <span class="mb-1 block text-[11px] text-gray-500">{{ $t('catalog.field.description') }}</span>
            <textarea v-model="bonus.description" rows="2" class="textarea textarea-sm min-h-0 w-full text-sm" />
          </label>
          <label class="block">
            <span class="mb-1 block text-[11px] text-gray-500">{{ $t('catalog.field.note') }}</span>
            <textarea v-model="bonus.note" rows="2" class="textarea textarea-sm min-h-0 w-full text-sm" maxlength="500" />
          </label>
        </div>
        <p v-for="error in errorsOf(bonus.id)" :key="error.path" class="mt-2 text-[11px] text-error">{{ error.message }}</p>
      </div>

      <button type="button" class="btn btn-sm gap-1" @click="addBonus(album)"><Plus :size="14" />{{ $t('editor.bonuses.add') }}</button>
    </div>
  </CatalogSection>
</template>

<script setup lang="ts">
import type { PickedEntity } from '~/components/editor/EntityPicker.vue'
import type { AlbumBonusRow, AlbumProductRow } from '~/utils/albumDocument'
import type { RowId } from '~/types/document'
import { ArrowDown, ArrowUp, Disc3, Gift, Plus, Trash2, X } from '@lucide/vue'
import { addBonus, addDisc, mainDiscs, removeBonus, setDiscBonus, sortedDiscs, sortedProducts } from '~/utils/albumDocument'
import { byOrder, moveRow, sameId } from '~/utils/documentRows'

const editor = useAlbumEditor()
const { t } = useI18n()
const { schema } = useCatalogSchema()
const { enumLabel } = useCatalogDisplay()

const album = computed(() => editor.album.value)
const enums = computed(() => schema.value?.enums ?? {})
const bonuses = computed(() => byOrder(album.value.bonuses))
const products = computed(() => sortedProducts(album.value))
/** Main discs that could become a bonus's disc; the last main disc stays a main disc. */
const freeDiscs = computed(() => mainDiscs(album.value).length > 1 ? mainDiscs(album.value) : [])
const errorsOf = (id: RowId) => editor.errorsIn(`bonuses.${id}`)
const has = (ids: RowId[], id: RowId) => ids.some(item => sameId(item, id))
const discsOf = (bonusId: RowId) => sortedDiscs(album.value).filter(disc => sameId(disc.bonus_id, bonusId))

const productName = (product: AlbumProductRow) => product.name || product.catalog_number || enumLabel('edition_type', product.edition_type)

const toggleProduct = (bonus: AlbumBonusRow, productId: RowId) => {
  bonus.product_ids = has(bonus.product_ids, productId) ? bonus.product_ids.filter(id => !sameId(id, productId)) : [...bonus.product_ids, productId]
}

const addBonusDisc = (bonusId: RowId) => {
  addDisc(album.value, { bonus_id: bonusId, format: 'cd' })
  editor.notify(t('editor.bonuses.disc_added'))
}

const useDisc = (bonusId: RowId, event: Event) => {
  const select = event.target as HTMLSelectElement
  const disc = freeDiscs.value.find(item => String(item.id) === select.value)
  select.value = ''
  if (disc) setDiscBonus(album.value, disc.id, bonusId)
}

const remove = (bonusId: RowId) => {
  if (discsOf(bonusId).length && !confirm(t('editor.bonuses.remove_confirm'))) return
  removeBonus(album.value, bonusId)
}

const pickEvent = (bonus: AlbumBonusRow, event: PickedEntity) => {
  editor.remember('events', event.id, { id: event.id, name: event.label })
  bonus.event_id = event.id
}
</script>
