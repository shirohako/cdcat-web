<template>
  <div class="min-h-screen">
    <div class="container mx-auto max-w-6xl px-4 py-8 md:px-8 2xl:max-w-7xl">
      <div class="mb-6 flex flex-wrap items-center gap-3">
        <UiButton :to="backLink" size="sm" :icon="ArrowLeft">{{ $t('common.go_back') }}</UiButton>
        <div class="min-w-0">
          <p class="text-xs text-meta">{{ $t('versions.title') }} · {{ enumLabel('catalog_type', type) }}</p>
          <h1 class="truncate text-xl font-bold text-title">{{ name || `#${id}` }}</h1>
        </div>
      </div>
      <CatalogContributors v-if="contributors?.length" :contributors="contributors" class="mb-6" />
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
/** The people whose edits made a version, above the history. */
const { data: contributors } = useAsyncData(`versions:${props.type}:${id}:contributors`,
  () => $api<{ contributors: Array<{ username: string, nickname: string | null, avatar_url: string | null }> }>(`/v1/${resource}/${id}/contributors`).then(result => result.contributors))
const snapshot = computed(() => latest.value?.snapshot as Record<string, unknown> | null | undefined)
const name = computed(() => String(snapshot.value?.title ?? snapshot.value?.name ?? (props.type === 'lyric' && snapshot.value?.language ? snapshot.value.language : '')))
const backLink = computed(() => props.type === 'lyric' && snapshot.value?.track_id ? `/tracks/${snapshot.value.track_id}` : `/${resource}/${id}`)

useSeoMeta({ title: () => `${t('versions.title')} · ${name.value || `#${id}`}`, robots: 'noindex' })
</script>
