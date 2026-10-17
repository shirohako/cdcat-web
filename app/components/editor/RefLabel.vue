<template>
  <span class="inline-flex min-w-0 items-center gap-1.5">
    <img v-if="image" :src="image" alt="" class="h-5 w-5 shrink-0 rounded object-cover">
    <NuxtLink v-if="typeof id === 'number'" :to="`/${CATALOG_RESOURCES[type as CatalogType] ?? type}/${id}`" target="_blank" class="truncate hover:underline">{{ name }}</NuxtLink>
    <span v-else class="truncate">{{ name }}</span>
    <span v-if="typeof id === 'string'" class="shrink-0 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">{{ $t('editor.new') }}</span>
  </span>
</template>

<script setup lang="ts">
import type { CatalogReferences, CatalogType } from '~/types/catalog'
import { CATALOG_RESOURCES } from '~/types/catalog'

/** The name of a referenced aggregate: an id from the references map, or "@ref" of a new item in this revision. */
const props = defineProps<{
  type: string
  id: number | string | null
  references: CatalogReferences
  /** Names of new items by ref, e.g. { r1: 'New artist' } */
  pending?: Record<string, string>
}>()

const row = computed(() => typeof props.id === 'number' ? props.references[props.type]?.[String(props.id)] as Record<string, unknown> | undefined : undefined)
const name = computed(() => {
  if (props.id === null) return '—'
  if (typeof props.id === 'string') return props.pending?.[props.id.replace(/^@/, '')] ?? props.id
  return String(row.value?.title ?? row.value?.name ?? `#${props.id}`)
})
const image = computed(() => (row.value?.image_url as string | undefined) ?? null)
</script>
