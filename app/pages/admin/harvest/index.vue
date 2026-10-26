<script setup lang="ts">
import type { HarvestOverview } from '~/types/harvest'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const { $api } = useNuxtApp()
const { t } = useAdminI18n()
const harvestError = useHarvestError()
const { hasPermission } = useAuth()
const route = useRoute()
const router = useRouter()
const { data, pending, error, refresh } = await useAsyncData('admin-harvest-overview', () => $api<HarvestOverview>('/v1/admin/harvest/overview'))

const tabs = ['candidates', 'coverage', 'names', 'tasks', 'submissions'] as const
type Tab = typeof tabs[number]
const tab = computed<Tab>({
  get: () => tabs.includes(route.query.tab as Tab) ? route.query.tab as Tab : 'candidates',
  // The other filters belong to the candidate list; the event is shared with coverage and the name map.
  set: value => router.push({ query: { tab: value === 'candidates' ? undefined : value, event_id: route.query.event_id || undefined } }),
})

// A new key reloads a list after merging or an upload.
const version = ref(0)
const reload = () => {
  void refresh()
  version.value++
}
const processing = ref(false)
const processNotice = ref('')
const processError = ref('')
const processNow = async () => {
  if (processing.value) return
  processing.value = true
  processError.value = ''
  try {
    const result = await $api<{ records: number, candidates: number }>('/v1/admin/harvest/process', { method: 'POST' })
    processNotice.value = t('admin_pages.harvest.processed', { records: result.records, candidates: result.candidates })
    reload()
  } catch (e) {
    processError.value = harvestError(e)
  } finally {
    processing.value = false
  }
}
const statuses = ['pending', 'excluded', 'approved', 'linked', 'rejected'] as const
useHead({ title: computed(() => t('admin_pages.harvest.title')) })
</script>

<template>
  <div class="mx-auto max-w-7xl space-y-5 p-4 sm:p-8">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold">{{ t('admin_pages.harvest.title') }}</h1>
        <p class="mt-2 max-w-3xl text-sm text-slate-600">{{ t('admin_pages.harvest.description') }}</p>
      </div>
      <div v-if="data" class="flex flex-wrap items-center gap-2 text-xs">
        <span v-for="status in statuses" :key="status" class="rounded-full bg-slate-100 px-2 py-1 tabular-nums" :class="{ 'bg-amber-100 text-amber-800': status === 'pending' && data.candidates.pending }">
          {{ t(`admin_pages.harvest.status.${status}`) }} {{ data.candidates[status] ?? 0 }}
        </span>
        <span class="text-slate-500">{{ t('admin_pages.harvest.images', { count: data.images.count, size: formatBytes(data.images.bytes) }) }}</span>
      </div>
    </header>

    <AdminListState :pending="pending && !data" :error="error" @retry="refresh()">
      <div v-if="data?.unprocessed" class="flex flex-wrap items-center gap-3 rounded-lg border border-sky-200 bg-sky-50 px-4 py-2 text-sm text-sky-900">
        {{ t('admin_pages.harvest.unprocessed', { count: data.unprocessed }) }}
        <button type="button" class="rounded border border-sky-300 bg-white px-2 py-1" :disabled="processing" @click="processNow">{{ t('admin_pages.harvest.process_now') }}</button>
        <span v-if="processError" class="text-red-700">{{ processError }}</span>
      </div>
      <p v-if="processNotice" role="status" class="text-sm text-emerald-700">{{ processNotice }}</p>
    </AdminListState>

    <div v-if="hasPermission('harvest.submit')" class="grid gap-4 lg:grid-cols-2">
      <AdminHarvestImportPanel @imported="reload" />
      <AdminHarvestTokensPanel />
    </div>

    <nav class="flex gap-1 overflow-x-auto border-b border-slate-200 text-sm" role="tablist">
      <button v-for="item in tabs" :key="item" type="button" role="tab" :aria-selected="tab === item" class="-mb-px whitespace-nowrap border-b-2 px-4 py-2 font-medium" :class="tab === item ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-900'" @click="tab = item">
        {{ t(`admin_pages.harvest.tabs.${item}`) }}
      </button>
    </nav>

    <AdminHarvestCandidatesPanel v-if="tab === 'candidates'" :key="`candidates-${version}`" :sources="data?.sources ?? []" />
    <AdminHarvestCoveragePanel v-else-if="tab === 'coverage'" :key="`coverage-${version}`" />
    <AdminHarvestNamesPanel v-else-if="tab === 'names'" :key="`names-${version}`" />
    <AdminHarvestTasksPanel v-else-if="tab === 'tasks'" :key="`tasks-${version}`" :sources="data?.sources ?? []" />
    <AdminHarvestSubmissionsPanel v-else :key="`submissions-${version}`" />
  </div>
</template>
