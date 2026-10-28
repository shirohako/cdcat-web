<script setup lang="ts">
import type { HarvestOverview } from '~/types/harvest'

definePageMeta({
  layout: 'admin',
  // The name map and the coverage were tabs here; old links go to their own pages.
  middleware: ['admin', (to) => {
    const tab = String(to.query.tab ?? '')
    if (['names', 'coverage'].includes(tab)) return navigateTo({ path: `/admin/harvest/${tab}`, query: { event_id: to.query.event_id || undefined } }, { replace: true })
  }],
})

const { $api } = useNuxtApp()
const harvestError = useHarvestError()
const { hasPermission } = useAuth()
const { data, pending, error, refresh } = await useAsyncData('admin-harvest-overview', () => $api<HarvestOverview>('/v1/admin/harvest/overview'))

// The review queue, the tasks, the name map and the coverage have their own pages.

// A new key reloads a list after merging.
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
    processNotice.value = `已合并 ${result.records} 条记录，更新 ${result.candidates} 条候选`
    reload()
  } catch (e) {
    processError.value = harvestError(e)
  } finally {
    processing.value = false
  }
}
const statuses = ['pending', 'excluded', 'approved', 'linked', 'rejected'] as const
useHead({ title: '采集概况' })
</script>

<template>
  <div class="mx-auto max-w-7xl space-y-5 p-4 sm:p-8">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold">采集概况</h1>
        <p class="mt-2 max-w-3xl text-sm text-slate-600">采集器（单独的程序，在任何电脑上都能运行）按任务从公开的数据库和商店收集专辑，导出成数据包拷到服务器上导入，或者用令牌直接提交。同一张专辑的来源记录，不管来自哪个任务、哪届活动，都合并成一条候选；活动只是候选上的建议首发活动。逐条审核后才会建成专辑。</p>
      </div>
      <div v-if="data" class="flex flex-wrap items-center gap-2 text-xs">
        <NuxtLink v-for="status in statuses" :key="status" :to="{ path: '/admin/harvest/candidates', query: { status: status === 'pending' ? undefined : status } }" class="rounded-full bg-slate-100 px-2 py-1 tabular-nums hover:bg-slate-200" :class="{ 'bg-amber-100 text-amber-800 hover:bg-amber-200': status === 'pending' && data.candidates.pending }">
          {{ harvestStatusLabels[status] }} {{ data.candidates[status] ?? 0 }}
        </NuxtLink>
        <span class="text-slate-500">采集图片 {{ data.images.count }} 张（{{ formatBytes(data.images.bytes) }}）</span>
      </div>
    </header>

    <AdminListState :pending="pending && !data" :error="error" @retry="refresh()">
      <div v-if="data?.unprocessed" class="flex flex-wrap items-center gap-3 rounded-lg border border-sky-200 bg-sky-50 px-4 py-2 text-sm text-sky-900">
        {{ data.unprocessed }} 条新记录等待合并
        <UiButton size="sm" :disabled="processing" @click="processNow">立即合并</UiButton>
        <span v-if="processError" class="text-red-700">{{ processError }}</span>
      </div>
      <p v-if="processNotice" role="status" class="text-sm text-emerald-700">{{ processNotice }}</p>
    </AdminListState>

    <div class="grid gap-4 lg:grid-cols-2">
      <!-- The admin page takes no uploads: exports are copied to the server and imported there. -->
      <section class="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
        <h2 class="font-semibold">导入数据包</h2>
        <p class="text-sm text-slate-600">后台不收上传。把采集器导出的文件拷到服务器上，在网站目录里以网站的用户（这里是 www-data）运行：</p>
        <code class="block select-all break-all rounded bg-slate-100 px-3 py-2 font-mono text-xs">sudo -u www-data php artisan harvest:import 〈文件…〉 --process</code>
        <p class="text-xs text-slate-500">可以一次给多个文件，例如一次导出的全部分卷。加 --process 导入后立即合并，不加就等调度器每分钟合并。导入成功的文件会删掉（加 --keep 保留），所以文件要放在 www-data 能写的目录里，例如 /tmp。不要用 root 运行：新建的图片目录会归 root 所有，网站读不了。</p>
      </section>
      <AdminHarvestTokensPanel v-if="hasPermission('harvest.submit')" />
    </div>

    <section class="space-y-3">
      <h2 class="font-semibold">提交记录</h2>
      <AdminHarvestSubmissionsPanel :key="version" />
    </section>
  </div>
</template>
