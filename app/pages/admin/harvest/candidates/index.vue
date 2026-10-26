<script setup lang="ts">
import type { HarvestOverview } from '~/types/harvest'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const { $api } = useNuxtApp()
const { t } = useAdminI18n()
// The source filter lists the sources the overview counts.
const { data } = await useAsyncData('admin-harvest-overview', () => $api<HarvestOverview>('/v1/admin/harvest/overview'), { lazy: true })
useHead({ title: computed(() => t('admin_pages.harvest.candidates.title')) })
</script>

<template>
  <div class="mx-auto max-w-7xl space-y-5 p-4 sm:p-8">
    <header>
      <h1 class="text-3xl font-bold">{{ t('admin_pages.harvest.candidates.title') }}</h1>
      <p class="mt-2 max-w-3xl text-sm text-slate-600">{{ t('admin_pages.harvest.candidates.description') }}</p>
    </header>
    <AdminHarvestCandidatesPanel :sources="data?.sources ?? []" />
  </div>
</template>
