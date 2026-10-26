<script setup lang="ts">
import type { AdminLogEntry } from '~/types/admin'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const route = useRoute()
const router = useRouter()
const { $api } = useNuxtApp()
const { data: files, pending, error, refresh } = await useAsyncData('admin-log-files', () => $api<{ name: string, size: number, modified_at: string }[]>('/v1/admin/system/logs'))
const file = computed(() => String(route.query.file || files.value?.[0]?.name || ''))
const level = computed(() => String(route.query.level || ''))
const select = (query: Record<string, string>) => router.push({ query: { file: file.value || undefined, level: level.value || undefined, ...query } })
const { data: log, pending: logPending, error: logError, refresh: refreshLog } = await useAsyncData(
  () => `admin-log-${file.value}-${level.value}`,
  () => file.value ? $api<{ size: number, truncated: boolean, entries: AdminLogEntry[] }>(`/v1/admin/system/logs/${file.value}`, { query: { level: level.value || undefined } }) : Promise.resolve(null),
  { watch: [file, level] },
)
const levels = ['debug', 'info', 'notice', 'warning', 'error', 'critical', 'alert', 'emergency']
const levelClass = (value: string) => ['error', 'critical', 'alert', 'emergency'].includes(value) ? 'text-red-700' : value === 'warning' ? 'text-amber-700' : 'text-slate-500'
const size = (bytes: number) => bytes > 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.ceil(bytes / 1024)} KB`
useHead({ title: '应用日志' })
</script>

<template>
  <div class="mx-auto max-w-6xl space-y-5 p-4 sm:p-8">
    <header>
      <h1 class="text-3xl font-bold">运维</h1>
      <p class="mt-2 text-sm text-slate-600">读取 storage/logs 下的日志，每次最多读取文件末尾 256 KB，邮件地址和调用参数已脱敏。</p>
    </header>
    <AdminSystemNav />
    <AdminListState :pending="pending" :error="error" :empty="!files?.length" @retry="refresh()">
      <div class="flex flex-wrap items-end gap-2 text-sm">
        <select :value="file" aria-label="日志文件" class="rounded-lg border border-slate-300 bg-white px-3 py-2" @change="select({ file: ($event.target as HTMLSelectElement).value })">
          <option v-for="item in files" :key="item.name" :value="item.name">{{ item.name }} ({{ size(item.size) }})</option>
        </select>
        <select :value="level" aria-label="级别" class="rounded-lg border border-slate-300 bg-white px-3 py-2" @change="select({ level: ($event.target as HTMLSelectElement).value })">
          <option value="">全部级别</option>
          <option v-for="item in levels" :key="item" :value="item">{{ item }}</option>
        </select>
        <button type="button" class="rounded-lg border bg-white px-3 py-2" @click="refreshLog()">刷新</button>
      </div>
      <p v-if="log?.truncated" class="mt-3 text-xs text-slate-500">文件较大，只显示末尾部分。</p>
      <section class="mt-3 rounded-xl border border-slate-200 bg-white">
        <AdminListState :pending="logPending" :error="logError" :empty="!log?.entries.length" @retry="refreshLog()">
          <ol class="divide-y divide-slate-100">
            <li v-for="(entry, index) in log?.entries" :key="index" class="px-5 py-2.5 text-xs">
              <p><span class="tabular-nums text-slate-500">{{ entry.time }}</span> <span class="font-semibold uppercase" :class="levelClass(entry.level)">{{ entry.level }}</span> <span class="break-all">{{ entry.message }}</span></p>
              <details v-if="entry.context"><summary class="mt-1 cursor-pointer text-slate-500">详细信息</summary><pre class="mt-1 max-h-80 overflow-auto whitespace-pre-wrap break-all rounded bg-slate-50 p-2">{{ entry.context }}</pre></details>
            </li>
          </ol>
        </AdminListState>
      </section>
    </AdminListState>
  </div>
</template>
