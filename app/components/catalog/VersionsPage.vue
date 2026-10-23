<template>
  <div class="min-h-screen bg-base-100">
    <div class="container mx-auto max-w-6xl px-4 py-8 md:px-8 2xl:max-w-7xl">
      <div class="mb-6 flex flex-wrap items-center gap-3">
        <NuxtLink :to="backLink" class="btn btn-ghost btn-sm gap-1"><ArrowLeft :size="14" />{{ $t('common.go_back') }}</NuxtLink>
        <div class="min-w-0">
          <p class="text-xs text-gray-400">{{ $t('versions.title') }} · {{ enumLabel('catalog_type', type) }}</p>
          <h1 class="truncate text-xl font-bold text-gray-900">{{ name || `#${id}` }}</h1>
        </div>
      </div>
      <CatalogVersionHistory :id="id" :type="type" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CatalogType, ContentVersion } from '~/types/catalog'
import { CATALOG_RESOURCES } from '~/types/catalog'
import { ArrowLeft } from '@lucide/vue'

const props = defineProps<{ type: CatalogType }>()

const route = useRoute()
const { $api } = useNuxtApp()
const { t } = useI18n()
const { enumLabel } = useCatalogDisplay()
const id = Number(route.params.id)
const resource = CATALOG_RESOURCES[props.type]

/** The name in the latest version, so the page works for deleted items too. */
const { data: latest } = useAsyncData(`versions:${props.type}:${id}:latest`, async () => {
  const list = await $api<{ versions: ContentVersion[] }>(`/v1/${resource}/${id}/versions`, { params: { per_page: 1 } })
  const version = list.versions[0]
  return version ? await $api<ContentVersion>(`/v1/${resource}/${id}/versions/${version.version}`) : null
})
const snapshot = computed(() => latest.value?.snapshot as Record<string, unknown> | null | undefined)
const name = computed(() => String(snapshot.value?.title ?? snapshot.value?.name ?? (props.type === 'lyric' && snapshot.value?.language ? snapshot.value.language : '')))
const backLink = computed(() => props.type === 'lyric' && snapshot.value?.track_id ? `/tracks/${snapshot.value.track_id}` : `/${resource}/${id}`)

useHead({ title: computed(() => `${t('versions.title')} · ${name.value || `#${id}`}`) })
</script>
