<script setup lang="ts">
import type { EventImportRun, EventImportSummary } from '~/types/eventImport'

/**
 * The latest import of one kind on an event's 导入 tab (docs/events/README.md#流程): a floor plan or booths, its status,
 * and what the preview found, with the button that applies it.
 */
const props = defineProps<{ run: EventImportRun | null, kind: 'map' | 'booths', busy: boolean }>()
defineEmits<{ apply: [run: EventImportRun] }>()

const working = computed(() => props.run && ['queued', 'running', 'applying'].includes(props.run.status))
const summary = computed(() => props.run?.summary ?? null)
const map = computed(() => summary.value?.map ?? null)
const problems = computed(() => Boolean(map.value && (map.value.circles_without_space_count || map.value.empty_spaces_count || map.value.warnings.length)))

const bundleLine = (run: EventImportRun) => {
  const { file, edition, created_at: createdAt, auto_apply: fromHarvester } = run.params
  if (!file) return ''
  return `导入包：${edition?.name ?? '—'} · ${file.name}（${`${(file.bytes / 1024 / 1024).toFixed(1)} MB`}）· ${createdAt ? new Date(createdAt).toLocaleString() : '—'} 生成${fromHarvester ? ' · 采集器上传，无问题时自动应用' : ''}`
}
const linkedBooths = (artists: NonNullable<EventImportSummary['artists']>) => (artists.handle ?? 0) + (artists.url ?? 0) + (artists.name ?? 0) + (artists.previous ?? 0)
</script>

<template>
  <section class="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex flex-wrap items-center gap-3">
        <h2 class="font-semibold">{{ kind === 'map' ? '平面图' : '摊位' }}<span v-if="run" class="ml-2 font-mono text-xs font-normal text-slate-500">导入 #{{ run.id }}</span></h2>
        <template v-if="run">
          <span class="rounded-full px-2.5 py-0.5 text-xs font-medium" :class="eventImportStatusClass(run.status)">{{ eventImportStatusLabels[run.status] }}</span>
          <span class="text-xs text-slate-500">{{ new Date(run.created_at).toLocaleString() }} · {{ run.creator?.nickname || run.creator?.username }}</span>
        </template>
      </div>
      <UiButton v-if="run?.status === 'ready'" variant="primary" :disabled="busy" @click="$emit('apply', run)">应用导入</UiButton>
    </div>
    <p v-if="!run" class="text-sm text-slate-500">{{ kind === 'map' ? '还没有导入过平面图。' : '还没有导入过摊位。' }}</p>
    <template v-else>
      <p v-if="bundleLine(run)" class="text-xs text-slate-500">{{ bundleLine(run) }}</p>
      <p v-if="run.status === 'collecting'" class="text-sm text-slate-600">还缺第 {{ run.missing_volumes.join('、') }} 卷：上传它们后开始预览。</p>
      <p v-if="working" class="text-sm text-slate-500">正在处理，页面会自动刷新…</p>
      <p v-if="run.error" role="alert" class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{{ run.error }}</p>

      <template v-if="summary">
        <div class="grid gap-3" :class="summary.circles ? 'sm:grid-cols-3' : 'sm:grid-cols-2'">
          <div v-if="summary.circles" class="rounded-lg bg-slate-50 p-4">
            <p class="text-xs font-medium text-slate-500">摊位</p>
            <p class="mt-1 text-2xl font-bold tabular-nums">{{ summary.circles.total }}</p>
            <p class="mt-1 text-xs text-slate-600">新增 {{ summary.circles.new }} · 更新 {{ summary.circles.updated }} · 移除 {{ summary.circles.removed }} · 仅目录参加 {{ summary.circles.catalog_only }} · 有 cut {{ summary.circles.with_cut }}</p>
          </div>
          <div class="rounded-lg bg-slate-50 p-4">
            <p class="text-xs font-medium text-slate-500">会场桌子</p>
            <template v-if="map">
              <p class="mt-1 text-2xl font-bold tabular-nums">{{ map.spaces }}</p>
              <p class="mt-1 text-xs text-slate-600">{{ map.halls.map(h => `${h.name} ${h.spaces}`).join(' · ') }}</p>
            </template>
            <p v-else class="mt-1 text-sm text-slate-500">本站还没有平面图：摊位先导入，导入平面图时再放到桌子上。</p>
          </div>
          <div v-if="kind === 'map' && map" class="rounded-lg bg-slate-50 p-4">
            <p class="text-xs font-medium text-slate-500">本站已有的现场摊位</p>
            <p class="mt-1 text-2xl font-bold tabular-nums">{{ map.booths ?? 0 }}</p>
            <p class="mt-1 text-xs text-slate-600">{{ map.booths ? '应用后按摊位号放到桌子上' : '还没有摊位：导入摊位时再对桌子' }}</p>
          </div>
          <div v-if="summary.artists" class="rounded-lg bg-slate-50 p-4">
            <p class="text-xs font-medium text-slate-500">自动关联艺术家</p>
            <p class="mt-1 text-2xl font-bold tabular-nums">{{ linkedBooths(summary.artists) }}</p>
            <p class="mt-1 text-xs text-slate-600">X 账号 {{ summary.artists.handle ?? 0 }} · 链接 {{ summary.artists.url ?? 0 }} · 同名 {{ summary.artists.name ?? 0 }} · 沿用别的届次 {{ summary.artists.previous ?? 0 }}</p>
            <p class="mt-1 text-xs text-slate-600">保留手动 {{ summary.artists.manual ?? 0 }} · 已核对 {{ summary.artists.confirmed ?? 0 }} · 只有建议 {{ summary.artists.suggested ?? 0 }} · 没找到 {{ summary.artists.none ?? 0 }} · 名字可疑 {{ summary.artists.suspect ?? 0 }}</p>
          </div>
        </div>
        <div v-if="map && problems" class="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p v-if="map.circles_without_space_count">{{ map.circles_without_space_count }} 个摊位在平面图上找不到桌子： <span class="font-mono text-xs">{{ map.circles_without_space.join(', ') }}</span></p>
          <p v-if="map.empty_spaces_count">{{ map.empty_spaces_count }} 张桌子没有摊位： <span class="font-mono text-xs">{{ map.empty_spaces.join(', ') }}</span></p>
          <p v-for="warning in map.warnings" :key="warning">{{ warning }}</p>
        </div>
        <p v-else-if="map && (kind === 'booths' || map.booths)" class="text-sm text-emerald-700">所有现场摊位都对上了桌子。</p>
        <div v-if="Object.keys(summary.event).length">
          <p class="text-xs font-medium text-slate-500">活动信息变更</p>
          <table class="mt-1 text-sm">
            <tbody>
              <tr v-for="(change, field) in summary.event" :key="field">
                <td class="pr-4 text-slate-500">{{ field }}</td>
                <td class="pr-2 text-slate-400 line-through">{{ change[0] ?? '—' }}</td>
                <td class="break-all">{{ change[1] }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <ul v-if="summary.notes.length" class="list-disc pl-5 text-sm text-slate-600">
          <li v-for="note in summary.notes" :key="note">{{ note }}</li>
        </ul>
      </template>
    </template>
  </section>
</template>
