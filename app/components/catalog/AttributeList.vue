<template>
  <dl v-if="groups.length" class="space-y-2 text-sm">
    <div v-for="group in groups" :key="group.key" class="flex gap-3">
      <dt class="w-24 shrink-0 text-xs leading-5 text-gray-400">
        <span class="tooltip tooltip-right" :data-tip="hint(group.key)">{{ attributeName(group.key) }}</span>
      </dt>
      <dd class="flex min-w-0 flex-wrap gap-x-2 gap-y-1 text-gray-700">
        <template v-for="attribute in group.values" :key="attribute.id">
          <NuxtLink v-if="attributeLink(attribute)" :to="attributeLink(attribute)!" class="hover:text-indigo-600 hover:underline">
            {{ attributeText(attribute) }}
          </NuxtLink>
          <span v-else>{{ attributeText(attribute) }}</span>
        </template>
      </dd>
    </div>
  </dl>
</template>

<script setup lang="ts">
import type { CatalogAttribute } from '~/types/catalog'

const props = defineProps<{ attributes: CatalogAttribute[] }>()

const { attributeName, attributeDefinition } = useCatalogSchema()
const { attributeText, attributeLink } = useCatalogDisplay()
const { localizedContent } = useLocaleFormatting()

/** Values of one attribute together, in their stored order. */
const groups = computed(() => {
  const map = new Map<string, CatalogAttribute[]>()
  for (const attribute of [...props.attributes].sort((a, b) => a.sort_order - b.sort_order)) {
    map.set(attribute.key, [...(map.get(attribute.key) ?? []), attribute])
  }
  return [...map.entries()].map(([key, values]) => ({ key, values }))
})

const hint = (key: string) => localizedContent(attributeDefinition(key)?.description ?? null, '') || undefined
</script>
