<script setup lang="ts">
import type { HarvestOverview } from '~/types/harvest'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const { $api } = useNuxtApp()
// The source filter lists the sources the overview counts.
const { data } = await useAsyncData('admin-harvest-overview', () => $api<HarvestOverview>('/v1/admin/harvest/overview'), { lazy: true })
useHead({ title: '待审核候选' })
</script>

<template>
  <div class="mx-auto max-w-7xl space-y-5 p-4 sm:p-8">
    <header>
      <h1 class="text-3xl font-bold">待审核候选</h1>
      <p class="mt-2 max-w-3xl text-sm text-slate-600">待审核的候选，逐条审核后才会建成专辑。筛选条件会带到审核页，上一条和下一条在同样的筛选里走。</p>
    </header>
    <AdminHarvestCandidatesPanel :sources="data?.sources ?? []" />
  </div>
</template>
