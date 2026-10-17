<template>
  <div class="space-y-4">
    <section v-for="item in items" :key="item.ref" class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <header class="flex flex-wrap items-center gap-2 border-b border-gray-100 bg-gray-50/60 px-4 py-2.5">
        <span class="rounded-md border px-2 py-0.5 text-[11px] font-semibold" :class="ACTION_TONES[item.action]">{{ $t(`revision_page.action.${item.action}`) }}</span>
        <span class="text-xs text-gray-500">{{ enumLabel('catalog_type', item.resource_type) }}</span>
        <NuxtLink v-if="link(item)" :to="link(item)!" class="min-w-0 truncate text-sm font-medium text-gray-900 hover:underline">{{ name(item) }}</NuxtLink>
        <span v-else class="min-w-0 truncate text-sm font-medium text-gray-900">{{ name(item) }}</span>
        <span v-if="item.restore_of_version" class="text-xs text-gray-500">{{ $t('revision_page.restores', { version: item.restore_of_version }) }}</span>
        <span
          v-if="item.applied_at && !approved"
          class="rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700"
          :title="$t('revision_page.applied_hint')"
        >{{ $t('revision_page.applied') }}</span>
        <NuxtLink
          v-if="item.result_version && item.resource_id"
          :to="`${versionsPath(item)}?version=${item.result_version}`"
          class="ml-auto text-xs text-gray-500 hover:underline"
        >{{ $t('revision_page.version_link', { version: item.result_version }) }}</NuxtLink>
      </header>
      <div class="px-4 py-3">
        <p v-if="item.action === 'delete'" class="text-sm text-rose-700">{{ $t('revision_page.deleted') }}</p>
        <p v-else-if="!item.changes.length" class="text-sm text-gray-400">{{ $t('revision_page.no_changes') }}</p>
        <CatalogDiffView v-else :type="item.resource_type" :changes="item.changes" :references="references" :documents="[item.document]" />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { CatalogReferences } from '~/types/catalog'
import type { RevisionItem } from '~/types/revision'
import { CATALOG_RESOURCES } from '~/types/catalog'
import { entityPath } from '~/utils/revisionLinks'

/** The items of a revision with their changes, as the submitter and reviewers see them. */
const props = defineProps<{ items: RevisionItem[], references: CatalogReferences, approved?: boolean }>()

const { t } = useI18n()
const { enumLabel } = useCatalogDisplay()

const ACTION_TONES: Record<string, string> = {
  create: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  update: 'border-sky-200 bg-sky-50 text-sky-700',
  delete: 'border-rose-200 bg-rose-50 text-rose-700',
}

const name = (item: RevisionItem) => {
  const row = item.resource_id ? props.references[item.resource_type]?.[String(item.resource_id)] as { title?: string, name?: string } | undefined : undefined
  const fromDocument = item.document ? (item.document.title ?? item.document.name) as string | undefined : undefined
  return row?.title ?? row?.name ?? fromDocument ?? (item.resource_id ? `#${item.resource_id}` : t('revision_page.new_entity'))
}
const link = (item: RevisionItem) => item.action === 'delete' ? null : entityPath(item.resource_type, item.resource_id)
const versionsPath = (item: RevisionItem) => `/${CATALOG_RESOURCES[item.resource_type]}/${item.resource_id}/versions`
</script>
