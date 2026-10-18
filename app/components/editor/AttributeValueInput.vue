<template>
  <div>
    <template v-if="!definition"><input class="input input-sm w-full" disabled></template>
    <select v-else-if="definition.value_type === 'choice'" v-model="model" class="select select-sm w-full">
      <option :value="null" disabled>—</option>
      <option v-for="choice in definition.choices ?? []" :key="choice.value" :value="choice.value">{{ localizedContent(choice.names, choice.value) }}</option>
    </select>
    <input v-else-if="definition.value_type === 'boolean'" v-model="model" type="checkbox" class="checkbox checkbox-sm mt-1.5">
    <input v-else-if="definition.value_type === 'integer'" v-model.number="model" type="number" step="1" class="input input-sm w-full">
    <input v-else-if="definition.value_type === 'decimal'" v-model="model" inputmode="decimal" class="input input-sm w-full">
    <div v-else-if="definition.value_type === 'date'" class="flex gap-2">
      <input :value="dated.date" type="date" class="input input-sm flex-1" @input="model = { ...dated, date: ($event.target as HTMLInputElement).value }">
      <select :value="dated.precision" class="select select-sm w-24" @change="model = { ...dated, precision: ($event.target as HTMLSelectElement).value }">
        <option v-for="precision in DATE_PRECISIONS" :key="precision" :value="precision">{{ $t(`catalog.precision.${precision}`) }}</option>
      </select>
    </div>
    <div v-else-if="definition.value_type === 'reference'" class="space-y-1">
      <div v-if="reference" class="flex items-center gap-2 text-sm">
        <EditorRefLabel :id="reference.id" :type="reference.type" :references="localReferences" />
        <button type="button" class="btn btn-ghost btn-xs" @click="model = null">×</button>
      </div>
      <div v-else class="flex gap-2">
        <select v-model="referenceType" class="select select-sm w-28">
          <option v-for="type in definition.reference_types ?? []" :key="type" :value="type">{{ enumLabel('catalog_type', type) }}</option>
        </select>
        <EditorEntityPicker :kind="referenceType as PickerKind" class="flex-1" @select="pick" />
      </div>
    </div>
    <input v-else v-model="model" :type="definition.value_type === 'url' ? 'url' : 'text'" class="input input-sm w-full" maxlength="500">
  </div>
</template>

<script setup lang="ts">
import type { AttributeDefinition, CatalogReferences } from '~/types/catalog'
import type { PickedEntity, PickerKind } from './EntityPicker.vue'
import { DATE_PRECISIONS } from '~/types/entry'

const props = defineProps<{ definition: AttributeDefinition | null, references: CatalogReferences }>()
const model = defineModel<unknown>()
const emit = defineEmits<{ picked: [type: string, id: number, row: Record<string, unknown>] }>()

const { localizedContent } = useLocaleFormatting()
const { enumLabel } = useCatalogDisplay()

const dated = computed(() => (model.value && typeof model.value === 'object' ? model.value : { date: '', precision: 'day' }) as { date: string, precision: string })
const reference = computed(() => model.value && typeof model.value === 'object' && 'type' in model.value ? model.value as { type: string, id: number } : null)
const referenceType = ref(props.definition?.reference_types?.[0] ?? 'work')
const picked = ref<Record<string, Record<string, Record<string, unknown>>>>({})
const localReferences = computed(() => ({ ...props.references, ...Object.fromEntries(Object.entries(picked.value).map(([type, rows]) => [type, { ...(props.references[type] ?? {}), ...rows }])) }))

const pick = (item: PickedEntity) => {
  picked.value = { ...picked.value, [referenceType.value]: { ...(picked.value[referenceType.value] ?? {}), [item.id]: { name: item.label, image_url: item.image_url } } }
  model.value = { type: referenceType.value, id: item.id }
  emit('picked', referenceType.value, item.id, { name: item.label, image_url: item.image_url })
}
</script>
