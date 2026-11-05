<template>
  <div class="space-y-3">
    <div class="flex flex-wrap items-baseline justify-between gap-x-3">
      <p class="text-sm font-medium text-body">{{ $t('catalog.field.prices') }}</p>
      <p v-if="rows.length > 1" class="text-[11px] text-meta">{{ $t('editor.editions.price_order_hint') }}</p>
    </div>
    <p v-if="!rows.length" class="text-xs text-meta">{{ $t('editor.editions.no_prices') }}</p>
    <section v-for="group in groups" :key="group.kind" class="space-y-2">
      <div class="flex items-center gap-2">
        <h4 class="text-xs font-semibold text-title">{{ kindLabel(group.kind) }}</h4>
        <span class="text-xs text-meta tabular-nums">{{ group.rows.length }}</span>
        <EditorAddButton small class="ml-auto" @click="add(group.kind)">{{ $t('common.add') }}</EditorAddButton>
      </div>
      <ul class="space-y-2">
        <li
          v-for="row in group.rows"
          :key="row.id"
          class="relative grid grid-cols-2 gap-2 transition-opacity md:grid-cols-[1rem_minmax(0,8rem)_4.5rem_8rem_minmax(0,1fr)_7.75rem] md:items-center"
          :class="dragged !== null && sameId(dragged, row.id) && 'opacity-40'"
          :draggable="grabbed !== null && sameId(grabbed, row.id)"
          @dragstart="startDrag(row, $event)"
          @dragover="overRow(row, $event)"
          @drop.prevent="dropOn(row)"
          @dragend="endDrag"
        >
          <!-- Where the row being dragged would land, in the middle of the gap between two rows. -->
          <span v-if="dropEdge(row)" class="pointer-events-none absolute inset-x-0 h-0.5 rounded-full bg-primary" :class="dropEdge(row) === 'before' ? '-top-[5px]' : '-bottom-[5px]'" />
          <!-- Dragging starts from the handle only, so text in the fields stays selectable. Touch uses the arrows and the
               kind list, so it has no handle; its cell stays, or the fields would slip a column. -->
          <span class="hidden w-4 cursor-grab touch-none items-center justify-center self-stretch text-faint transition-colors hover:text-body active:cursor-grabbing md:flex [@media(hover:none)]:invisible" :class="rows.length < 2 && 'invisible'" aria-hidden="true" @pointerdown="grab(row)">
            <GripVertical :size="14" />
          </span>
          <input v-model="row.price.amount" class="input input-sm w-full tabular-nums" inputmode="decimal" placeholder="3300" :aria-label="$t('editor.editions.price_amount')" @change="row.price.amount = plainAmount(row.price.amount)">
          <input v-model="row.price.currency" class="input input-sm w-full font-mono uppercase" maxlength="3" placeholder="JPY" list="editor-currencies" :aria-label="$t('catalog.field.currency')">
          <UiSelect v-model="row.price.tax_included" :options="taxOptions" size="sm" class="w-full" :aria-label="$t('editor.editions.price_tax')" />
          <input v-model="row.price.note" class="input input-sm w-full" maxlength="100" :placeholder="$t('editor.editions.price_note_placeholder')" :aria-label="$t('editor.editions.price_note')">
          <div class="col-span-2 flex justify-end gap-1 md:col-span-1">
            <template v-if="group.rows.length > 1">
              <UiButton :icon="ArrowUp" :label="$t('catalog.form.move_up')" icon-class="size-3" size="xs" class="ring-1 ring-inset ring-line shadow-xs active:translate-y-px" :disabled="group.rows[0] === row" @click="move(row, -1)" />
              <UiButton :icon="ArrowDown" :label="$t('catalog.form.move_down')" icon-class="size-3" size="xs" class="ring-1 ring-inset ring-line shadow-xs active:translate-y-px" :disabled="group.rows.at(-1) === row" @click="move(row, 1)" />
            </template>
            <UiSelect :model-value="row.price.kind" :options="kindOptions" @update:model-value="kind => kind && setKind(row, kind)">
              <template #trigger="{ toggle, attrs, setRef }">
                <!-- UiSelect places its list against this wrapper: UiButton's own root is a tooltip, not an element. -->
                <span :ref="setRef" class="inline-flex">
                  <UiButton v-bind="attrs" :icon="ArrowLeftRight" :label="$t('editor.editions.change_price_kind')" icon-class="size-3" size="xs" class="ring-1 ring-inset ring-line shadow-xs active:translate-y-px" @click="toggle" />
                </span>
              </template>
            </UiSelect>
            <UiButton variant="danger-soft" :icon="Trash2" :label="$t('editor.editions.remove_price')" icon-class="size-3" size="xs" class="ring-1 ring-inset ring-danger/20 shadow-xs active:translate-y-px" @click="remove(row)" />
          </div>
        </li>
      </ul>
    </section>
    <div v-if="unusedKinds.length" class="flex flex-wrap items-center gap-1.5 text-xs text-meta" :class="rows.length && 'border-t border-dashed border-line pt-3'">
      <span>{{ $t(rows.length ? 'editor.editions.add_other_kind' : 'editor.editions.add_price') }}</span>
      <EditorAddButton v-for="kind in unusedKinds" :key="kind" small @click="add(kind)">{{ kindLabel(kind) }}</EditorAddButton>
    </div>
    <datalist id="editor-currencies">
      <option v-for="code in ['JPY', 'CNY', 'USD', 'EUR', 'TWD', 'HKD', 'KRW', 'GBP']" :key="code" :value="code" />
    </datalist>
  </div>
</template>

<script setup lang="ts">
import type { PriceKind, ProductPrice } from '~/types/document'
import type { UiSelectOption } from '~/components/ui/Select.vue'
import { ArrowDown, ArrowLeftRight, ArrowUp, GripVertical, Trash2 } from '@lucide/vue'
import { newKey } from '~/utils/documentKeys'
import { plainAmount } from '~/utils/priceAmount'
import { sameId } from '~/utils/documentRows'

/**
 * An edition's prices, edited in place and grouped by kind in the order the album page shows them. A row is ordered by
 * handle or arrows inside its group; dragging it onto another group, or picking from its kind list, changes its kind.
 */
const prices = defineModel<ProductPrice[]>({ required: true })
const { schema } = useCatalogSchema()
const { kindOrder, kindLabel, taxLabel, sorted } = usePriceDisplay()

const kindOptions = computed<UiSelectOption<PriceKind>[]>(() => ((schema.value?.enums.price_kind ?? ['list', 'event', 'shop', 'other']) as PriceKind[]).map(value => ({ value, label: kindLabel(value) })))
const taxOptions = computed<UiSelectOption<boolean | null>[]>(() => [true, false, null].map(value => ({ value, label: taxLabel(value) })))

/** Prices are saved without ids, so each gets one here for as long as the object lives. */
const ids = new WeakMap<ProductPrice, string>()
const idOf = (price: ProductPrice) => {
  const raw = toRaw(price)
  if (!ids.has(raw)) ids.set(raw, newKey('p'))
  return ids.get(raw)!
}
const rows = computed(() => sorted(prices.value).map(price => ({ id: idOf(price), price })))
type PriceRow = (typeof rows.value)[number]

/** The rows by kind; `rows` is sorted by kind, and a kind without prices has no group. */
const groups = computed(() => {
  const list: { kind: PriceKind, rows: PriceRow[] }[] = []
  for (const row of rows.value) {
    const group = list.at(-1)
    if (group?.kind === row.price.kind) group.rows.push(row)
    else list.push({ kind: row.price.kind, rows: [row] })
  }
  return list
})
const unusedKinds = computed(() => kindOrder.filter(kind => !rows.value.some(row => row.price.kind === kind)))

/** Puts the row before the one at `index` of the shown list. Dropped on a row of another kind, it takes that kind; the sort then keeps it at the edge of its group. */
const place = (row: PriceRow, index: number, over?: PriceRow) => {
  const list = rows.value.filter(item => item !== row)
  list.splice(rows.value.slice(0, Math.max(0, index)).filter(item => item !== row).length, 0, row)
  if (over) row.price.kind = over.price.kind
  prices.value = sorted(list.map(item => item.price))
}
const { grabbed, dragged, grab, move, startDrag, overRow, dropOn, endDrag, dropEdge } = useRowDrag(() => rows.value, place)

/** Moves the row to the end of the kind it now has. */
const setKind = (row: PriceRow, kind: PriceKind) => {
  if (row.price.kind === kind) return
  row.price.kind = kind
  prices.value = sorted([...prices.value.filter(price => price !== row.price), row.price])
}

/** A new price takes the currency of the last one and opens at the end of its group. */
const add = (kind: PriceKind) => {
  prices.value.push({ kind, note: null, amount: '', currency: rows.value.at(-1)?.price.currency ?? 'JPY', tax_included: null })
}
const remove = (row: PriceRow) => {
  const index = prices.value.indexOf(row.price)
  if (index >= 0) prices.value.splice(index, 1)
}
</script>
