<script setup lang="ts">
import type { HarvestPagination, HarvestSubmission } from '~/types/harvest'

const { $api } = useNuxtApp()
const harvestSubmissionCountsLabels: Record<string, string> = {
  records: '记录',
  new: '新增',
  changed: '有变化',
  unchanged: '无变化',
  stale: '比站内旧',
  invalid: '格式不对',
  unknown_event: '活动对不上',
  unknown_task: '任务对不上',
  images_new: '新图片',
  images_known: '已有图片',
  images_invalid: '图片有问题',
}
const harvestSubmissionViaLabels: Record<string, string> = { upload: '后台上传', api: '采集器提交', command: '命令导入' }

const page = ref(1)
const { data, pending, error, refresh } = await useAsyncData(
  () => `admin-harvest-submissions-${page.value}`,
  () => $api<{ submissions: HarvestSubmission[], pagination: HarvestPagination }>('/v1/admin/harvest/submissions', { query: { page: page.value } }),
  { watch: [page] },
)
const keys = ['new', 'changed', 'unchanged', 'stale', 'invalid', 'unknown_event', 'unknown_task', 'images_new', 'images_known', 'images_invalid'] as const
const problems: readonly string[] = ['stale', 'invalid', 'unknown_event', 'unknown_task', 'images_invalid']
const time = (value: string | null) => value ? new Intl.DateTimeFormat('zh-CN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : '—'
</script>

<template>
  <div class="space-y-3">
    <section class="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <AdminListState :pending="pending" :error="error" :empty="!data?.submissions.length" @retry="refresh()">
        <table class="w-full min-w-180 text-left text-sm">
          <tbody class="divide-y divide-slate-100">
            <tr v-for="submission in data?.submissions" :key="submission.id" class="align-top">
              <td class="px-4 py-3 tabular-nums text-slate-500">#{{ submission.id }}</td>
              <td class="px-4 py-3">
                {{ harvestSubmissionViaLabels[submission.via] }}
                <span class="block text-xs text-slate-500">{{ time(submission.created_at) }}<template v-if="submission.user"> · {{ submission.user.nickname || submission.user.username }}</template></span>
              </td>
              <td class="px-4 py-3 text-xs text-slate-500">
                <span v-if="submission.file_name" class="block break-all">{{ submission.file_name }}</span>
                <span v-if="submission.harvester_instance">采集器 {{ submission.harvester_instance.slice(0, 8) }}<template v-if="submission.harvester_version"> · v{{ submission.harvester_version }}</template></span>
              </td>
              <td class="px-4 py-3 text-xs tabular-nums text-slate-600">
                <span class="mr-3 inline-block font-medium">记录 {{ submission.records }}</span>
                <template v-for="key in keys" :key="key">
                  <span v-if="submission.counts[key]" class="mr-3 inline-block" :class="{ 'text-amber-800': problems.includes(key) }">{{ harvestSubmissionCountsLabels[key] }} {{ submission.counts[key] }}</span>
                </template>
                <details v-if="submission.errors.length" class="mt-1 text-amber-800">
                  <summary class="cursor-pointer">{{ submission.errors.length }} 个问题</summary>
                  <ul class="mt-1 list-disc space-y-0.5 pl-4">
                    <li v-for="(message, index) in submission.errors" :key="index">{{ message }}</li>
                  </ul>
                </details>
              </td>
            </tr>
          </tbody>
        </table>
      </AdminListState>
    </section>
    <CommonPagination v-if="(data?.pagination.last_page ?? 1) > 1" v-model:page="page" :total-pages="data!.pagination.last_page" />
  </div>
</template>
