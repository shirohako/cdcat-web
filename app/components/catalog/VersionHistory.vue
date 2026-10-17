<template>
  <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
    <aside class="lg:col-span-1">
      <div class="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <h2 class="border-b border-gray-100 px-4 py-3 text-sm font-bold text-gray-900">{{ $t('versions.list') }}</h2>
        <div v-if="pending" class="flex justify-center py-8"><span class="loading loading-spinner" /></div>
        <ul v-else class="max-h-[70vh] divide-y divide-gray-50 overflow-y-auto">
          <li v-for="version in versions" :key="version.version">
            <button
              type="button"
              class="w-full px-4 py-2.5 text-left transition-colors hover:bg-gray-50"
              :class="{ 'bg-indigo-50/70': version.version === selected }"
              @click="selected = version.version"
            >
              <p class="flex items-center gap-2 text-sm">
                <span class="font-mono font-semibold text-gray-700">v{{ version.version }}</span>
                <span class="rounded px-1.5 py-0.5 text-[10px] font-semibold" :class="causeStyle(version.cause)">{{ enumLabel('version_cause', version.cause) }}</span>
                <span v-if="version.is_deleted" class="badge badge-error badge-xs">{{ $t('versions.deleted') }}</span>
              </p>
              <p class="mt-0.5 truncate text-xs text-gray-500">{{ version.reason || summaryText(version) }}</p>
              <p class="mt-0.5 text-[11px] text-gray-400">
                {{ version.actor ? (version.actor.nickname || version.actor.username) : $t('versions.system') }} · {{ ago(version.created_at) }}
              </p>
            </button>
          </li>
        </ul>
        <div v-if="lastPage > 1" class="border-t border-gray-100 px-4 py-2">
          <CommonPagination :page="page" :total-pages="lastPage" :disabled="pending" @update:page="page = $event" />
        </div>
      </div>
    </aside>

    <section class="lg:col-span-2">
      <div class="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <div class="flex flex-wrap items-center gap-2 border-b border-gray-100 px-5 py-3 text-sm">
          <h2 class="font-bold text-gray-900">{{ $t('versions.changes') }}</h2>
          <template v-if="selected !== null">
            <select v-model="from" class="select select-sm h-8 text-xs ml-auto">
              <option :value="null">{{ $t('versions.previous') }}</option>
              <option v-for="version in versions.filter(item => item.version < selected!)" :key="version.version" :value="version.version">v{{ version.version }}</option>
            </select>
            <span class="text-gray-400">→ v{{ selected }}</span>
            <NuxtLink v-if="selectedVersion?.revision_id" :to="`/revisions/${selectedVersion.revision_id}`" class="hover:underline text-xs text-gray-500">{{ $t('versions.revision', { id: selectedVersion.revision_id }) }}</NuxtLink>
            <NuxtLink v-if="canRestore && selected !== latest" :to="`/admin/content/${resource}/${id}?restore=${selected}`" class="btn btn-xs btn-outline">{{ $t('versions.restore') }}</NuxtLink>
          </template>
        </div>
        <div class="px-5 py-4">
          <div v-if="diffPending" class="flex justify-center py-8"><span class="loading loading-spinner" /></div>
          <p v-else-if="diffError" class="py-6 text-center text-sm text-gray-400">{{ localizeError(diffError) }}</p>
          <CatalogDiffView v-else-if="diff" :type="type" :changes="diff.changes" :references="diff.references" :documents="[snapshot]" />
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { CatalogType, ContentVersion, VersionCause, VersionDiff } from '~/types/catalog'
import { CATALOG_RESOURCES } from '~/types/catalog'

const props = defineProps<{ type: CatalogType, id: number }>()

const { $api } = useNuxtApp()
const { t } = useI18n()
const { hasPermission } = useAuth()
const { ago } = useRelativeTime()
const { enumLabel } = useCatalogDisplay()
const { localizeError } = useLocalizedApiError()
const resource = CATALOG_RESOURCES[props.type]
const canRestore = computed(() => hasPermission('revisions.rollback'))

const page = ref(1)
const { data, pending } = useAsyncData(
  () => `versions:${props.type}:${props.id}:${page.value}`,
  () => $api<{ versions: ContentVersion[], pagination: { last_page: number } }>(`/v1/${resource}/${props.id}/versions`, { params: { page: page.value } }),
  { watch: [page] },
)
const versions = computed(() => data.value?.versions ?? [])
const lastPage = computed(() => data.value?.pagination.last_page ?? 1)
const latest = computed(() => page.value === 1 ? versions.value[0]?.version ?? null : null)

// ?version=N opens that version, e.g. from a revision; it may be on a later page of the list.
const route = useRoute()
const selected = ref<number | null>(Number(route.query.version) || null)
const from = ref<number | null>(null)
watch(versions, (list) => {
  if (selected.value === null) selected.value = list[0]?.version ?? null
}, { immediate: true })
watch(selected, () => { from.value = null })
const selectedVersion = computed(() => versions.value.find(version => version.version === selected.value) ?? null)

const diff = ref<VersionDiff | null>(null)
/** The selected version's document, to name the rows that changed. */
const snapshot = ref<Record<string, unknown> | null>(null)
const diffPending = ref(false)
const diffError = ref<unknown>(null)
watch([selected, from], async ([version, base]) => {
  if (version === null) return
  diffPending.value = true
  diffError.value = null
  try {
    const [changes, detail] = await Promise.all([
      $api<VersionDiff>(`/v1/${resource}/${props.id}/versions/${version}/diff`, { params: base === null ? {} : { from: base } }),
      $api<ContentVersion>(`/v1/${resource}/${props.id}/versions/${version}`),
    ])
    diff.value = changes
    snapshot.value = detail.snapshot ?? null
  } catch (error) {
    diffError.value = error
    diff.value = null
  } finally {
    diffPending.value = false
  }
}, { immediate: true })

const summaryText = (version: ContentVersion) => {
  if (!version.summary) return ''
  const parts = version.summary.fields ? [t('versions.fields_changed', { count: version.summary.fields })] : []
  for (const [name, counts] of Object.entries(version.summary.collections)) {
    parts.push(`${name} +${counts.added} −${counts.removed} ~${counts.changed}`)
  }
  return parts.join(' · ')
}

const causeStyle = (cause: VersionCause) => ({
  create: 'bg-emerald-100 text-emerald-700',
  edit: 'bg-sky-100 text-sky-700',
  delete: 'bg-rose-100 text-rose-700',
  restore: 'bg-amber-100 text-amber-700',
  merge: 'bg-violet-100 text-violet-700',
  purge: 'bg-gray-800 text-white',
}[cause as string] ?? 'bg-gray-100 text-gray-600')
</script>
