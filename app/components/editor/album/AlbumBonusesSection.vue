<template>
  <CatalogSection :title="$t('editor.album.section.bonuses')" :icon="Gift" tone="pink" :description="$t('editor.bonuses.hint')">
    <div class="space-y-4 p-3 sm:p-5">
      <p v-if="!bonuses.length" class="text-sm text-gray-400">{{ $t('editor.bonuses.none') }}</p>

      <ul v-else class="space-y-2">
        <li
          v-for="(bonus, index) in bonuses"
          :key="bonus.id"
          class="flex items-start gap-3 rounded-xl border bg-white p-3 transition-colors"
          :class="errorsOf(bonus.id).length ? 'border-rose-200 bg-rose-50/30' : 'border-pink-100 hover:border-pink-200'"
        >
          <span class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pink-50 text-pink-500"><Gift :size="13" /></span>
          <div class="min-w-0 flex-1 cursor-pointer" @click="edit(bonus)">
            <p class="flex flex-wrap items-center gap-1.5">
              <span class="truncate text-sm font-semibold text-gray-900">{{ bonus.name || '—' }}</span>
              <span class="rounded-md bg-pink-50 px-1.5 py-0.5 text-[11px] text-pink-700">{{ enumLabel('bonus_type', bonus.type) }}</span>
              <span v-if="bonus.is_digital" class="rounded-md bg-sky-50 px-1.5 py-0.5 text-[11px] text-sky-700">{{ $t('editor.dialog.digital') }}</span>
            </p>
            <p class="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500">
              <span v-if="bonus.shop">{{ bonus.shop }}</span>
              <span v-if="bonus.availability">{{ enumLabel('limited_rule', bonus.availability) }}</span>
              <span v-if="bonus.event_id" class="inline-flex items-center gap-1"><CalendarDays :size="11" />{{ eventName(bonus.event_id) }}</span>
              <span v-if="bonus.product_ids.length">{{ bonus.product_ids.map(productNameOf).join(' / ') }}</span>
              <span v-for="disc in discsOf(bonus.id)" :key="disc.id" class="inline-flex items-center gap-1 text-pink-700"><Disc3 :size="11" />{{ $t('editor.album.disc_n', { n: disc.position }) }}</span>
            </p>
            <p v-for="error in errorsOf(bonus.id)" :key="error.path" class="mt-1 text-[11px] text-error">{{ error.message }}</p>
          </div>
          <span class="flex shrink-0 gap-0.5">
            <button type="button" class="btn btn-ghost btn-xs px-1.5" :disabled="index === 0" :title="$t('catalog.form.move_up')" @click="moveRow(album.bonuses, bonus, -1)"><ArrowUp :size="12" /></button>
            <button type="button" class="btn btn-ghost btn-xs px-1.5" :disabled="index === bonuses.length - 1" :title="$t('catalog.form.move_down')" @click="moveRow(album.bonuses, bonus, 1)"><ArrowDown :size="12" /></button>
            <button type="button" class="btn btn-ghost btn-xs px-1.5" :aria-label="$t('common.edit')" @click="edit(bonus)"><PencilLine :size="12" /></button>
            <button type="button" class="btn btn-ghost btn-xs px-1.5 text-gray-400 hover:text-error" :aria-label="$t('common.delete')" @click="remove(bonus.id)"><Trash2 :size="12" /></button>
          </span>
        </li>
      </ul>

      <EditorAddButton @click="edit(null)">{{ $t('editor.bonuses.add') }}</EditorAddButton>
    </div>

    <EditorModal v-model="dialog" :title="$t(editing ? 'editor.dialog.bonus_edit' : 'editor.bonuses.add')" :description="$t('editor.bonuses.hint')" :icon="Gift" tone="rose" wide @submit="save">
      <div v-if="form" class="space-y-5">
        <div class="grid gap-4 sm:grid-cols-[minmax(0,1fr)_11rem]">
          <label class="block">
            <span class="mb-1 block text-sm font-medium text-gray-700">{{ $t('catalog.field.name') }}</span>
            <input v-model="form.name" data-autofocus class="input input-sm w-full" :class="{ 'input-error': tried && !form.name.trim() }" :placeholder="$t('editor.bonuses.name_placeholder')">
            <span v-if="tried && !form.name.trim()" class="mt-1 block text-xs text-error">{{ $t('editor.dialog.name_required') }}</span>
          </label>
          <label class="block">
            <span class="mb-1 block text-sm font-medium text-gray-700">{{ $t('catalog.field.type') }}</span>
            <select v-model="form.type" class="select select-sm w-full">
              <option v-for="value in enums.bonus_type ?? []" :key="value" :value="value">{{ enumLabel('bonus_type', value) }}</option>
            </select>
          </label>
        </div>

        <div class="grid gap-4 sm:grid-cols-3">
          <label class="block">
            <span class="mb-1 block text-sm font-medium text-gray-700">{{ $t('catalog.field.shop') }}</span>
            <input v-model="form.shop" class="input input-sm w-full" maxlength="100" :placeholder="$t('editor.bonuses.shop_placeholder')">
          </label>
          <label class="block">
            <span class="mb-1 block text-sm font-medium text-gray-700">{{ $t('catalog.field.availability') }}</span>
            <select v-model="form.availability" class="select select-sm w-full">
              <option :value="null">—</option>
              <option v-for="value in enums.limited_rule ?? []" :key="value" :value="value">{{ enumLabel('limited_rule', value) }}</option>
            </select>
          </label>
          <div>
            <span class="mb-1 block text-sm font-medium text-gray-700">{{ $t('catalog.field.event_id') }}</span>
            <EditorPickedRef v-if="form.event_id" :id="form.event_id" type="events" :references="editor.references" :icon="CalendarDays" @remove="form.event_id = null" />
            <EditorEntityPicker v-else kind="event" @select="pickEvent" />
          </div>
        </div>

        <label class="flex items-center gap-1.5 text-sm text-gray-700"><input v-model="form.is_digital" type="checkbox" class="checkbox checkbox-sm">{{ $t('editor.bonuses.is_digital') }}</label>

        <div v-if="products.length > 1">
          <p class="text-sm font-medium text-gray-700">{{ $t('editor.bonuses.editions') }}</p>
          <p class="mb-1.5 text-[11px] text-gray-400">{{ $t('editor.bonuses.editions_hint') }}</p>
          <div class="flex flex-wrap gap-2">
            <label v-for="product in products" :key="product.id" class="flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition-colors" :class="has(form.product_ids, product.id) ? 'border-pink-300 bg-pink-50 text-pink-800' : 'border-gray-200 text-gray-500 hover:border-gray-300'">
              <input type="checkbox" class="checkbox checkbox-xs" :checked="has(form.product_ids, product.id)" @change="toggleProduct(product.id)">
              {{ productName(product) }}
            </label>
          </div>
        </div>

        <div>
          <p class="text-sm font-medium text-gray-700">{{ $t('editor.bonuses.discs') }}</p>
          <p class="mb-1.5 text-[11px] text-gray-400">{{ $t('editor.bonuses.discs_hint') }}</p>
          <div class="flex flex-wrap items-center gap-2">
            <span v-for="disc in linkedDiscs" :key="disc.id" class="inline-flex items-center gap-1 rounded-lg bg-pink-50 px-2 py-1 text-xs text-pink-800">
              <Disc3 :size="11" />{{ $t('editor.album.disc_n', { n: disc.position }) }} · {{ enumLabel('disc_format', disc.format) }}<span v-if="disc.title" class="max-w-28 truncate text-pink-500"> · {{ disc.title }}</span>
              <button type="button" class="ml-0.5 text-pink-400 hover:text-pink-700" :title="$t('editor.bonuses.unlink_disc')" @click="unlinkDisc(disc.id)"><X :size="11" /></button>
            </span>
            <span v-for="(disc, index) in newDiscs" :key="disc.key" class="inline-flex items-center gap-1 rounded-lg border border-dashed border-pink-300 bg-white px-1.5 py-0.5 text-xs text-pink-800">
              <Disc3 :size="11" />{{ $t('editor.dialog.new_disc') }}
              <select v-model="disc.format" class="select select-xs h-6 min-h-0 w-20 border-0 bg-transparent text-xs" :aria-label="$t('catalog.field.format')">
                <option v-for="value in enums.disc_format ?? []" :key="value" :value="value">{{ enumLabel('disc_format', value) }}</option>
              </select>
              <button type="button" class="text-pink-400 hover:text-pink-700" :aria-label="$t('common.delete')" @click="newDiscs.splice(index, 1)"><X :size="11" /></button>
            </span>
            <EditorAddButton small @click="newDiscs.push({ key: newKey('nd'), format: 'cd' })">{{ $t('editor.bonuses.add_disc') }}</EditorAddButton>
            <select v-if="freeDiscs.length" class="select select-sm h-7 w-44 text-xs" @change="useDisc">
              <option value="">{{ $t('editor.bonuses.use_disc') }}</option>
              <option v-for="disc in freeDiscs" :key="disc.id" :value="String(disc.id)">{{ $t('editor.album.disc_n', { n: disc.position }) }}{{ disc.title ? ` · ${disc.title}` : '' }}</option>
            </select>
          </div>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <label class="block">
            <span class="mb-1 block text-sm font-medium text-gray-700">{{ $t('catalog.field.description') }}</span>
            <textarea v-model="form.description" rows="3" class="textarea textarea-sm w-full text-sm" />
          </label>
          <label class="block">
            <span class="mb-1 block text-sm font-medium text-gray-700">{{ $t('catalog.field.note') }}</span>
            <textarea v-model="form.note" rows="3" class="textarea textarea-sm w-full text-sm" maxlength="500" />
          </label>
        </div>
      </div>
      <template #footer>
        <button type="button" class="btn btn-ghost btn-sm" @click="dialog = false">{{ $t('common.cancel') }}</button>
        <button type="submit" class="btn btn-primary btn-sm">{{ $t(editing ? 'common.save' : 'common.add') }}</button>
      </template>
    </EditorModal>
  </CatalogSection>
</template>

<script setup lang="ts">
import type { PickedEntity } from '~/components/editor/EntityPicker.vue'
import type { AlbumBonusRow, AlbumProductRow } from '~/utils/albumDocument'
import type { RowId } from '~/types/document'
import { ArrowDown, ArrowUp, CalendarDays, Disc3, Gift, PencilLine, Trash2, X } from '@lucide/vue'
import { addDisc, blankBonus, mainDiscs, removeBonus, setDiscBonus, sortedDiscs, sortedProducts } from '~/utils/albumDocument'
import { newKey } from '~/utils/documentKeys'
import { byOrder, moveRow, sameId } from '~/utils/documentRows'

const editor = useAlbumEditor()
const { t } = useI18n()
const { confirm } = useConfirm()
const { schema } = useCatalogSchema()
const { enumLabel } = useCatalogDisplay()

const album = computed(() => editor.album.value)
const enums = computed(() => schema.value?.enums ?? {})
const bonuses = computed(() => byOrder(album.value.bonuses))
const products = computed(() => sortedProducts(album.value))
const errorsOf = (id: RowId) => editor.errorsIn(`bonuses.${id}`)
const has = (ids: RowId[], id: RowId) => ids.some(item => sameId(item, id))
const discsOf = (bonusId: RowId) => sortedDiscs(album.value).filter(disc => sameId(disc.bonus_id, bonusId))

const productName = (product: AlbumProductRow) => product.name || product.catalog_number || enumLabel('edition_type', product.edition_type)
const productNameOf = (id: RowId) => {
  const product = products.value.find(item => sameId(item.id, id))
  return product ? productName(product) : '—'
}
const eventName = (id: number) => String((editor.references.events?.[String(id)] as { name?: string } | undefined)?.name ?? `#${id}`)

const remove = async (bonusId: RowId) => {
  if (discsOf(bonusId).length && !await confirm({ title: t('editor.bonuses.remove_confirm') })) return
  removeBonus(album.value, bonusId)
}

// ---- the dialog: edits a copy; disc changes are made on save ----

const dialog = ref(false)
const editing = ref<AlbumBonusRow | null>(null)
const form = ref<AlbumBonusRow | null>(null)
/** Existing discs that will belong to the bonus, and new bonus discs to add. */
const linked = ref<RowId[]>([])
const newDiscs = ref<Array<{ key: string, format: string }>>([])
const tried = ref(false)

const linkedDiscs = computed(() => sortedDiscs(album.value).filter(disc => has(linked.value, disc.id)))
/** Main discs that could become this bonus's discs; at least one main disc stays. */
const freeDiscs = computed(() => {
  const free = mainDiscs(album.value).filter(disc => !has(linked.value, disc.id))
  return free.length > 1 ? free : []
})

const edit = (bonus: AlbumBonusRow | null) => {
  editing.value = bonus
  form.value = bonus ? JSON.parse(JSON.stringify(bonus)) : blankBonus(album.value)
  linked.value = bonus ? discsOf(bonus.id).map(disc => disc.id) : []
  newDiscs.value = []
  tried.value = false
  dialog.value = true
}

const toggleProduct = (productId: RowId) => {
  if (!form.value) return
  form.value.product_ids = has(form.value.product_ids, productId) ? form.value.product_ids.filter(id => !sameId(id, productId)) : [...form.value.product_ids, productId]
}
const unlinkDisc = (discId: RowId) => { linked.value = linked.value.filter(id => !sameId(id, discId)) }
const useDisc = (event: Event) => {
  const select = event.target as HTMLSelectElement
  const disc = freeDiscs.value.find(item => String(item.id) === select.value)
  select.value = ''
  if (disc) linked.value = [...linked.value, disc.id]
}

const pickEvent = (event: PickedEntity) => {
  editor.remember('events', event.id, { id: event.id, name: event.label })
  if (form.value) form.value.event_id = event.id
}

const save = () => {
  tried.value = true
  if (!form.value || !form.value.name.trim()) return
  const values = { ...form.value, name: form.value.name.trim(), shop: form.value.shop?.trim() || null }
  let bonusId: RowId
  if (editing.value) {
    bonusId = editing.value.id
    Object.assign(editing.value, { ...values, id: bonusId, sort_order: editing.value.sort_order })
  } else {
    bonusId = values.id
    album.value.bonuses.push(values)
  }
  for (const disc of discsOf(bonusId)) {
    if (!has(linked.value, disc.id)) setDiscBonus(album.value, disc.id, null)
  }
  for (const id of linked.value) {
    if (!sameId(album.value.discs.find(disc => sameId(disc.id, id))?.bonus_id, bonusId)) setDiscBonus(album.value, id, bonusId)
  }
  for (const disc of newDiscs.value) addDisc(album.value, { bonus_id: bonusId, format: disc.format })
  if (newDiscs.value.length) editor.notify(t('editor.bonuses.disc_added'))
  dialog.value = false
}
</script>
