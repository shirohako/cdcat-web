<template>
  <div class="space-y-2">
    <div v-for="row in shown" :key="row.id" class="flex flex-wrap items-center gap-2">
      <input v-model.trim="row.url" type="url" class="input input-sm min-w-64 flex-1" placeholder="https://" @change="detect(row)">
      <select v-model="row.link_provider_id" class="select select-sm w-44">
        <option :value="null" disabled>{{ $t('catalog.field.link_provider_id') }}</option>
        <option v-for="provider in providers" :key="provider.id" :value="provider.id">{{ providerName(provider.name) }}</option>
      </select>
      <button type="button" class="btn btn-ghost btn-sm px-2" :aria-label="$t('common.delete')" @click="remove(row)"><Trash2 :size="14" /></button>
    </div>
    <button type="button" class="btn btn-ghost btn-xs gap-1" @click="add"><Plus :size="12" />{{ $t('editor.add_link') }}</button>
  </div>
</template>

<script setup lang="ts">
import type { LinkRow, RowId } from '~/types/document'
import { Plus, Trash2 } from '@lucide/vue'
import { newKey } from '~/utils/documentKeys'
import { byOrder, nextOrder, sameId } from '~/utils/documentRows'

/** Link rows; with `owner` the model is a collection such as track_links and only that track's rows are shown. */
const props = defineProps<{ owner?: { field: string, id: RowId } }>()
const rows = defineModel<LinkRow[]>({ required: true })
const { schema } = useCatalogSchema()
const providers = computed(() => schema.value?.link_providers ?? [])
const providerName = (name: string) => name.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')

const mine = (row: LinkRow) => !props.owner || sameId((row as unknown as Record<string, RowId>)[props.owner.field], props.owner.id)
const shown = computed(() => byOrder(rows.value.filter(mine)))

const add = () => rows.value.push({
  id: newKey('l'), link_provider_id: null, url: '', sort_order: nextOrder(shown.value),
  ...(props.owner ? { [props.owner.field]: props.owner.id } : {}),
} as LinkRow)

const remove = (row: LinkRow) => {
  const index = rows.value.indexOf(row)
  if (index >= 0) rows.value.splice(index, 1)
}

/** Picks the provider whose URL pattern matches, e.g. https://vgmdb.net/* */
const detect = (row: LinkRow) => {
  if (row.link_provider_id || !row.url) return
  const match = providers.value.find((provider) => {
    if (!provider.url_pattern) return false
    const pattern = new RegExp(`^${provider.url_pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')}`, 'i')
    return pattern.test(row.url) || pattern.test(row.url.replace(/^http:/, 'https:'))
  })
  row.link_provider_id = match?.id ?? providers.value.find(provider => provider.name === 'other')?.id ?? null
}
</script>
