<template>
  <div class="space-y-2">
    <!-- Grouped by category as on the page; rows move only inside their category, so the order here is the order shown. -->
    <div v-for="group in groups" :key="group.category">
      <p class="mb-1 text-[11px] font-semibold text-meta">{{ $t(`catalog.link_category.${group.category}`) }}</p>
      <ul class="space-y-1.5">
        <EditorListRow
          v-for="(row, index) in group.rows"
          :key="row.id"
          :invalid="!row.url"
          :sortable="group.rows.length > 1"
          :draggable="grabbed !== null && sameId(grabbed, row.id)"
          :dragging="dragged !== null && sameId(dragged, row.id)"
          :drop-edge="sameCategory(row) ? dropEdge(row) : null"
          @grab="grab(row)"
          @dragstart="startDrag(row, $event)"
          @dragover="sameCategory(row) && overRow(row, $event)"
          @drop.prevent="sameCategory(row) ? dropOn(row) : endDrag()"
          @dragend="endDrag"
          @edit="edit(row)"
          @remove="remove(row)"
        >
          <span class="max-w-36 shrink-0 truncate rounded-md bg-btn px-1.5 py-0.5 text-[11px] font-medium text-btn-content">{{ providerOf(row.link_provider_id) }}</span>
          <!-- A named link shows its name, with the address small underneath. -->
          <span v-if="row.label" class="flex min-w-0 flex-col leading-tight">
            <span class="truncate text-[13px] font-medium text-title">{{ row.label }}</span>
            <span class="mt-0.5 truncate text-[11px] text-meta">{{ bare(row.url) || '—' }}</span>
          </span>
          <span v-else class="min-w-0 truncate text-sm text-body">{{ bare(row.url) || '—' }}</span>
          <template #actions>
            <template v-if="group.rows.length > 1">
              <UiButton :icon="ChevronUp" :label="$t('catalog.form.move_up')" size="xs" class="shrink-0 ring-1 ring-inset ring-line shadow-xs active:translate-y-px" :disabled="index === 0" @click="move(row, -1)" />
              <UiButton :icon="ChevronDown" :label="$t('catalog.form.move_down')" size="xs" class="shrink-0 ring-1 ring-inset ring-line shadow-xs active:translate-y-px" :disabled="index === group.rows.length - 1" @click="move(row, 1)" />
            </template>
            <UiButton v-if="row.url" :href="row.url" target="_blank" rel="noopener noreferrer" external :icon="ExternalLink" :label="$t('editor.dialog.open_link')" size="xs" class="shrink-0 ring-1 ring-inset ring-line shadow-xs active:translate-y-px" />
          </template>
        </EditorListRow>
      </ul>
    </div>
    <EditorAddButton @click="edit(null)">{{ $t('editor.add_link') }}</EditorAddButton>

    <EditorModal v-model="dialog" :title="$t(editing ? 'editor.dialog.link_edit' : 'editor.add_link')" :description="$t('editor.dialog.link_hint')" :icon="Link2" @submit="save">
      <div class="space-y-4">
        <label class="block">
          <span class="mb-1 block text-sm font-medium text-body">URL</span>
          <input
            v-model.trim="form.url"
            data-autofocus
            type="url"
            inputmode="url"
            class="input w-full"
            :class="{ 'input-error': problem }"
            placeholder="https://"
            @input="autoDetect"
          >
          <span v-if="problem" class="mt-1 block text-xs text-danger">{{ problem }}</span>
        </label>
        <label class="block">
          <span class="mb-1 block text-sm font-medium text-body">{{ $t('catalog.field.link_provider_id') }}</span>
          <UiSelect v-model="form.provider" :options="providerOptions" placeholder="—" size="sm" class="w-full" @change="pickedByHand = true" />
          <span class="mt-1 block text-[11px] text-meta">{{ $t('editor.dialog.link_provider_hint') }}</span>
        </label>
        <label class="block">
          <span class="mb-1 block text-sm font-medium text-body">{{ $t('editor.dialog.link_label') }}</span>
          <input v-model="form.label" class="input w-full" maxlength="100" :placeholder="$t('editor.dialog.link_label_placeholder')">
          <span class="mt-1 block text-[11px] text-meta">{{ $t('editor.dialog.link_label_hint') }}</span>
        </label>
      </div>
      <template #footer>
        <UiButton size="sm" class="ring-1 ring-inset ring-line shadow-xs active:translate-y-px" @click="dialog = false">{{ $t('common.cancel') }}</UiButton>
        <UiButton type="submit" variant="primary" size="sm" class="shadow-xs active:translate-y-px">{{ $t(editing ? 'common.save' : 'common.add') }}</UiButton>
      </template>
    </EditorModal>
  </div>
</template>

<script setup lang="ts">
import type { LinkRow } from '~/types/document'
import type { UiSelectOption } from '~/components/ui/Select.vue'
import { ChevronDown, ChevronUp, ExternalLink, Link2 } from '@lucide/vue'
import { newKey } from '~/utils/documentKeys'
import { byOrder, nextOrder, sameId } from '~/utils/documentRows'
import { LINK_CATEGORIES, linkCategoryRank } from '~/utils/linkProviders'

/**
 * External links of an album, artist, label, entry or series, added and edited in a dialog, each with an optional name of
 * its own. They are grouped by their site's category as on the page and ordered inside it by handle or buttons.
 */
const rows = defineModel<LinkRow[]>({ required: true })
const { t } = useI18n()
const { schema } = useCatalogSchema()
const providers = computed(() => schema.value?.link_providers ?? [])
const providerOptions = computed<UiSelectOption<number | null>[]>(() => providers.value.map(provider => ({ value: provider.id, label: provider.name })))
const providerOf = (id: number | null) => {
  const provider = providers.value.find(item => item.id === id)
  return provider ? provider.name : '—'
}
const bare = (url: string) => url.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '')

const shown = computed(() => byOrder(rows.value))

/** The row's category, a key of catalog.link_category; rows without a known site are "other". */
const categoryOf = (row: LinkRow) => {
  const category = providers.value.find(item => item.id === row.link_provider_id)?.category ?? 'other'
  return LINK_CATEGORIES.includes(category) ? category : 'other'
}
const groups = computed(() => {
  const byCategory = new Map<string, LinkRow[]>()
  for (const row of shown.value) {
    const category = categoryOf(row)
    byCategory.set(category, [...(byCategory.get(category) ?? []), row])
  }
  return [...byCategory.entries()]
    .sort(([a], [b]) => linkCategoryRank(a) - linkCategoryRank(b))
    .map(([category, list]) => ({ category, rows: list }))
})
/** All rows in the order shown, the categories one after another. */
const flat = computed(() => groups.value.flatMap(group => group.rows))

/**
 * Puts the row before the one at `index` of the shown list, kept inside its own category (past either end it stays at
 * that end), and renumbers sort_order 0..n-1 in the order shown.
 */
const place = (row: LinkRow, index: number) => {
  const category = categoryOf(row)
  const at = flat.value.slice(0, Math.max(0, index)).filter(item => item !== row && categoryOf(item) === category).length
  const order = groups.value.flatMap((group) => {
    if (group.category !== category) return group.rows
    const list = group.rows.filter(item => item !== row)
    list.splice(at, 0, row)
    return list
  })
  order.forEach((item, position) => { item.sort_order = position })
}
const { grabbed, dragged, grab, move, startDrag, overRow, dropOn, endDrag, dropEdge } = useRowDrag(() => flat.value, place)
/** Whether the row being dragged may land next to this one: only rows of its own category. */
const sameCategory = (row: LinkRow) => {
  const moving = flat.value.find(item => sameId(item.id, dragged.value))
  return !!moving && categoryOf(moving) === categoryOf(row)
}

const remove = (row: LinkRow) => {
  const index = rows.value.indexOf(row)
  if (index >= 0) rows.value.splice(index, 1)
}

/** The provider whose URL pattern matches, e.g. https://vgmdb.net/*, else "other". */
const detect = (url: string) => {
  const match = providers.value.find((provider) => {
    if (!provider.url_pattern) return false
    const pattern = new RegExp(`^${provider.url_pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')}`, 'i')
    return pattern.test(url) || pattern.test(url.replace(/^http:/, 'https:'))
  })
  return match?.id ?? providers.value.find(provider => provider.key === 'other')?.id ?? null
}

// ---- the dialog ----

const dialog = ref(false)
const editing = ref<LinkRow | null>(null)
const form = reactive({ url: '', provider: null as number | null, label: '' })
const pickedByHand = ref(false)
const tried = ref(false)

const edit = (row: LinkRow | null) => {
  editing.value = row
  form.url = row?.url ?? ''
  form.provider = row?.link_provider_id ?? null
  form.label = row?.label ?? ''
  pickedByHand.value = !!row?.link_provider_id
  tried.value = false
  dialog.value = true
}

/** Follows the URL until a provider is chosen by hand. */
const autoDetect = () => {
  if (!pickedByHand.value) form.provider = form.url ? detect(form.url) : null
}

const valid = (url: string) => {
  try {
    return ['http:', 'https:'].includes(new URL(url).protocol)
  } catch {
    return false
  }
}
const same = (a: string, b: string) => bare(a).toLowerCase() === bare(b).toLowerCase()
const problem = computed(() => {
  if (!tried.value) return null
  if (!valid(form.url)) return t('editor.dialog.link_invalid')
  if (shown.value.some(row => row !== editing.value && same(row.url, form.url))) return t('editor.dialog.link_duplicate')
  return null
})

const save = () => {
  tried.value = true
  if (problem.value) return
  const provider = form.provider ?? detect(form.url)
  const label = form.label.trim() || null
  if (editing.value) {
    editing.value.url = form.url
    editing.value.link_provider_id = provider
    editing.value.label = label
  } else {
    // Last of all, so last in its category too; the other rows keep their numbers.
    rows.value.push({ id: newKey('l'), link_provider_id: provider, url: form.url, label, sort_order: nextOrder(shown.value) })
  }
  dialog.value = false
}
</script>
