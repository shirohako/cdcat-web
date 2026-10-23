<script setup lang="ts">
import type { HarvestEventDetail } from '~/types/harvest'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const { $api } = useNuxtApp()
const { t } = useAdminI18n()
const harvestError = useHarvestError()
const route = useRoute()
const router = useRouter()
const eventId = computed(() => Number(route.params.event))
const { data, pending, error, refresh } = await useAsyncData(`admin-harvest-event-${eventId.value}`, () => $api<HarvestEventDetail>(`/v1/admin/harvest/events/${eventId.value}`))

const tabs = ['candidates', 'coverage', 'names', 'sources', 'submissions'] as const
type Tab = typeof tabs[number]
const tab = computed<Tab>({
  get: () => tabs.includes(route.query.tab as Tab) ? route.query.tab as Tab : 'candidates',
  set: value => router.replace({ query: { tab: value === 'candidates' ? undefined : value } }),
})

const processing = ref(false)
const processNotice = ref('')
const processError = ref('')
const processNow = async () => {
  if (processing.value) return
  processing.value = true
  processError.value = ''
  try {
    const result = await $api<{ records: number, candidates: number }>(`/v1/admin/harvest/events/${eventId.value}/process`, { method: 'POST' })
    processNotice.value = t('admin_pages.harvest.event.processed', { records: result.records, candidates: result.candidates })
    await refresh()
  } catch (e) {
    processError.value = harvestError(e)
  } finally {
    processing.value = false
  }
}
useHead({ title: computed(() => data.value?.event.name ?? t('admin_pages.harvest.title')) })
</script>

<template>
  <div class="mx-auto max-w-7xl space-y-5 p-4 sm:p-8">
    <NuxtLink to="/admin/harvest" class="text-sm text-slate-500 hover:underline">← {{ t('admin_pages.harvest.event.back') }}</NuxtLink>
    <AdminListState :pending="pending && !data" :error="error" @retry="refresh()">
      <template v-if="data">
        <header class="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 class="text-3xl font-bold">{{ data.event.name }}</h1>
            <p class="mt-1 text-sm text-slate-500">{{ data.event.slug }} · {{ data.event.start_date }}</p>
          </div>
          <div class="flex flex-wrap items-center gap-2 text-xs">
            <span v-for="(count, status) in data.candidates" :key="status" class="rounded-full bg-slate-100 px-2 py-1 tabular-nums">{{ t(`admin_pages.harvest.status.${status}`) }} {{ count }}</span>
          </div>
        </header>
        <div v-if="data.unprocessed" class="flex flex-wrap items-center gap-3 rounded-lg border border-sky-200 bg-sky-50 px-4 py-2 text-sm text-sky-900">
          {{ t('admin_pages.harvest.event.unprocessed', { count: data.unprocessed }) }}
          <button type="button" class="rounded border border-sky-300 bg-white px-2 py-1" :disabled="processing" @click="processNow">{{ t('admin_pages.harvest.event.process_now') }}</button>
          <span v-if="processError" class="text-red-700">{{ processError }}</span>
        </div>
        <p v-if="processNotice" role="status" class="text-sm text-emerald-700">{{ processNotice }}</p>

        <nav class="flex gap-1 overflow-x-auto border-b border-slate-200 text-sm" role="tablist">
          <button v-for="item in tabs" :key="item" type="button" role="tab" :aria-selected="tab === item" class="-mb-px whitespace-nowrap border-b-2 px-4 py-2 font-medium" :class="tab === item ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-900'" @click="tab = item">
            {{ t(`admin_pages.harvest.event.tabs.${item}`) }}
          </button>
        </nav>

        <AdminHarvestSourcesPanel v-if="tab === 'sources'" :sources="data.sources" />
        <AdminHarvestCandidatesPanel v-else-if="tab === 'candidates'" :event-id="eventId" :sources="data.sources" />
        <AdminHarvestCoveragePanel v-else-if="tab === 'coverage'" :event-id="eventId" />
        <AdminHarvestNamesPanel v-else-if="tab === 'names'" :event-id="eventId" />
        <AdminHarvestSubmissionsPanel v-else :event-id="eventId" />
      </template>
    </AdminListState>
  </div>
</template>
