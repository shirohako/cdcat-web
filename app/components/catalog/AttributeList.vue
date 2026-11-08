<template>
  <!-- rows: each attribute as a CatalogInfoRow, for inside a CatalogInfoTable -->
  <template v-if="rows">
    <CatalogInfoRow v-for="group in groups" :key="group.key">
      <template #label>
        <UiTooltip :text="hint(group.key)" placement="right">
          <span>{{ attributeName(group.key) }}</span>
        </UiTooltip>
      </template>
      <span class="flex flex-wrap gap-x-2 gap-y-1">
        <template v-for="attribute in group.values" :key="attribute.id">
          <NuxtLink v-if="attributeLink(attribute)" :to="attributeLink(attribute)!" class="text-title transition-colors hover:text-primary">
            {{ attributeText(attribute) }}
          </NuxtLink>
          <span v-else>{{ attributeText(attribute) }}</span>
        </template>
      </span>
    </CatalogInfoRow>
  </template>
  <!-- panel: rows of the artist page's names-and-relations block (bold label left, above it on phones), divided like its other rows
       and on its two columns (subgrid) -->
  <dl v-else-if="groups.length" :class="panel ? 'divide-y divide-line sm:col-span-2 sm:grid sm:grid-cols-subgrid' : 'space-y-2 text-sm'">
    <div v-for="group in groups" :key="group.key" :class="panel ? 'grid gap-2 py-3 sm:col-span-2 sm:grid-cols-subgrid sm:gap-y-0' : 'flex gap-3'">
      <dt :class="panel ? 'whitespace-nowrap text-sm font-semibold leading-6 text-title' : 'w-24 shrink-0 text-xs leading-5 text-meta'">
        <UiTooltip :text="hint(group.key)" placement="right">
          <span>{{ attributeName(group.key) }}</span>
        </UiTooltip>
      </dt>
      <dd class="flex min-w-0 flex-wrap gap-x-2 gap-y-1 text-body" :class="panel && 'leading-6'">
        <template v-for="attribute in group.values" :key="attribute.id">
          <NuxtLink v-if="attributeLink(attribute)" :to="attributeLink(attribute)!" class="transition-colors hover:text-primary">
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

const props = defineProps<{ attributes: CatalogAttribute[], rows?: boolean, panel?: boolean }>()

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
