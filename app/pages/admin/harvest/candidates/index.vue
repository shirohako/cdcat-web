<script setup lang="ts">
import type { HarvestOverview } from '~/types/harvest'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const { $api } = useNuxtApp()
// The source filter lists the sources the overview counts.
const { data } = await useAsyncData('admin-harvest-overview', () => $api<HarvestOverview>('/v1/admin/harvest/overview'), { lazy: true })
useHead({ title: '待审核候选' })
</script>

<template>
  <div class="mx-auto max-w-7xl p-4 sm:p-8">
    <AdminHarvestCandidatesPanel :sources="data?.sources ?? []">
      <h1 class="text-2xl font-bold">待审核候选</h1>
      <p class="mt-1 max-w-3xl text-sm text-slate-500">逐条审核后才会建成专辑。筛选条件会带到审核页，上一条和下一条在同样的筛选里走。</p>
    </AdminHarvestCandidatesPanel>
  </div>
</template>
