<template>
  <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
    <aside class="lg:col-span-1">
      <div class="card overflow-hidden">
        <h2 class="border-b border-line px-4 py-3 text-sm font-bold text-title">{{ $t('versions.list') }}</h2>
        <SkeletonStatus v-if="loading" class="divide-y divide-line">
          <div v-for="row in 6" :key="row" class="space-y-1.5 px-4 py-2.5">
            <div class="skeleton h-3.5 w-1/3 rounded-full" />
            <div class="skeleton h-2.5 w-3/4 rounded-full" />
          </div>
        </SkeletonStatus>
        <ul v-else class="max-h-[70vh] divide-y divide-line overflow-y-auto transition-opacity" :class="{ 'pointer-events-none opacity-60': refetching }" :inert="refetching">
          <li v-for="version in versions" :key="version.version">
            <button
              type="button"
              class="w-full px-4 py-2.5 text-left transition-colors duration-150 ease-out"
              :class="version.version === selected ? 'bg-primary/10' : 'hover:bg-card-hover'"
              @click="selected = version.version"
            >
              <p class="flex items-center gap-2 text-sm">
                <span class="font-mono font-semibold text-title">v{{ version.version }}</span>
                <span class="rounded px-1.5 py-0.5 text-[10px] font-semibold" :class="causeStyle(version.cause)">{{ enumLabel('version_cause', version.cause) }}</span>
                <span v-if="version.is_deleted" class="badge badge-error badge-xs">{{ $t('versions.deleted') }}</span>
              </p>
              <p class="mt-0.5 truncate text-xs text-meta">{{ version.reason || summaryText(version) }}</p>
              <p class="mt-0.5 text-[11px] text-faint">
                {{ version.actor ? (version.actor.nickname || version.actor.username) : $t('versions.system') }} · {{ ago(version.created_at) }}
              </p>
            </button>
          </li>
        </ul>
        <div v-if="lastPage > 1" class="border-t border-line px-4 py-2">
          <CommonPagination :page="page" :total-pages="lastPage" :disabled="refetching" @update:page="page = $event" />
        </div>
      </div>
    </aside>

    <section class="lg:col-span-2">
      <div class="card overflow-hidden">
        <div class="flex flex-wrap items-center gap-2 border-b border-line px-5 py-3 text-sm">
          <h2 class="font-bold text-title">{{ $t('versions.changes') }}</h2>
          <template v-if="selected !== null">
            <UiSelect v-model="from" :options="fromOptions" size="sm" class="h-8 text-xs ml-auto" />
            <span class="text-faint">→ v{{ selected }}</span>
            <NuxtLink v-if="selectedVersion?.revision_id" :to="`/revisions/${selectedVersion.revision_id}`" class="link text-xs">{{ $t('versions.revision', { id: selectedVersion.revision_id }) }}</NuxtLink>
            <UiButton v-if="canRestore && selected !== latest" :to="`/admin/content/${resource}/${id}?restore=${selected}`" variant="outline" size="xs">{{ $t('versions.restore') }}</UiButton>
          </template>
        </div>
        <div class="px-5 py-4">
          <SkeletonStatus v-if="diffPending && !diff" class="space-y-2.5 py-2">
            <div v-for="line in 5" :key="line" class="skeleton h-3 rounded-full" :class="['w-2/3', 'w-full', 'w-1/2', 'w-5/6', 'w-3/5'][line - 1]" />
          </SkeletonStatus>
          <p v-else-if="diffError" class="py-6 text-center text-sm text-faint">{{ localizeError(diffError) }}</p>
          <CatalogDiffView
            v-else-if="diff"
            class="transition-opacity"
            :class="{ 'opacity-60': diffPending }"
            :type="type" :changes="diff.changes" :references="diff.references" :documents="[snapshot]"
          />
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { CatalogType, ContentVersion, VersionCause, VersionDiff } from '~/types/catalog'
import { CATALOG_RESOURCES } from '~/types/catalog'
import type { UiSelectOption } from '~/components/ui/Select.vue'

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
const { data, loading, refetching } = usePageData(
  () => `versions:${props.type}:${props.id}:${page.value}`,
  ({ signal, background }) => $api<{ versions: ContentVersion[], pagination: { last_page: number } }>(`/v1/${resource}/${props.id}/versions`, {
    params: { page: page.value },
    signal,
    progress: !background,
  }),
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
const fromOptions = computed<UiSelectOption<number | null>[]>(() => [
  { value: null, label: t('versions.previous') },
  ...versions.value.filter(item => selected.value !== null && item.version < selected.value).map(version => ({ value: version.version, label: `v${version.version}` })),
])
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
  create: 'bg-success/15 text-success',
  edit: 'bg-info/15 text-info',
  delete: 'bg-danger/15 text-danger',
  restore: 'bg-warning/15 text-warning',
  merge: 'bg-primary/15 text-primary',
  purge: 'bg-title text-page',
}[cause as string] ?? 'bg-btn text-btn-content')
</script>
