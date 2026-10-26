<script setup lang="ts">
import type { PickedEntity } from '~/components/editor/EntityPicker.vue'
import type { HarvestEventRow } from '~/types/harvest'

/**
 * Picks an event by id (as a string, for the route query): the events candidates are linked to,
 * with their counts, and with `search` any other event of the catalog.
 */
const model = defineModel<string>({ required: true })
withDefaults(defineProps<{
  /** An "all events" choice (''); without it the select asks to pick one. */
  allowAll?: boolean
  /** A "linked to no event" choice ('none'). */
  allowNone?: boolean
  search?: boolean
}>(), { allowAll: true, allowNone: false, search: false })

const { $api } = useNuxtApp()
const { t } = useAdminI18n()
const { data } = await useAsyncData('admin-harvest-events', () => $api<{ events: HarvestEventRow[] }>('/v1/admin/harvest/events'), { lazy: true })
/** Events picked by searching, which the list may not have. */
const found = ref<PickedEntity[]>([])
const options = computed(() => {
  const rows = (data.value?.events ?? []).map(row => ({ id: String(row.event.id), label: t('admin_pages.harvest.events.option', { name: row.event.name, count: row.candidates }) }))
  const known = new Set(rows.map(row => row.id))
  return [...rows, ...found.value.filter(event => !known.has(String(event.id))).map(event => ({ id: String(event.id), label: event.label }))]
})
const pick = (event: PickedEntity) => {
  if (!found.value.some(item => item.id === event.id)) found.value.push(event)
  model.value = String(event.id)
}
</script>

<template>
  <div class="flex flex-wrap items-center gap-2">
    <select v-model="model" :aria-label="t('admin_pages.harvest.events.pick')" class="max-w-72 rounded-lg border border-slate-300 px-2 py-1.5">
      <option v-if="allowAll" value="">{{ t('admin_pages.harvest.events.all') }}</option>
      <option v-else value="" disabled>{{ t('admin_pages.harvest.events.pick') }}</option>
      <option v-if="allowNone" value="none">{{ t('admin_pages.harvest.no_event') }}</option>
      <option v-for="option in options" :key="option.id" :value="option.id">{{ option.label }}</option>
      <!-- An event from the address that the list does not have. -->
      <option v-if="model && model !== 'none' && !options.some(option => option.id === model)" :value="model">#{{ model }}</option>
    </select>
    <EditorEntityPicker v-if="search" kind="event" class="w-56" :placeholder="t('admin_pages.harvest.events.other')" @select="pick" />
  </div>
</template>
