<template>
  <div class="space-y-2">
    <p class="flex flex-wrap items-center gap-1.5 text-xs text-meta">
      <span class="inline-block size-1.5 rounded-full" :class="dotClass" />
      <span>{{ stateText }}</span>
      <UiButton v-if="draft.syncState.value === 'error'" size="xs" class="ring-1 ring-inset ring-line shadow-xs active:translate-y-px" @click="retry">重试</UiButton>
    </p>

    <div v-if="remote" class="rounded-xl border px-4 py-3 text-sm text-body" :class="conflict ? 'border-warning/30 bg-warning/10' : 'border-info/25 bg-info/10'">
      <div class="flex flex-wrap items-start gap-3">
        <component :is="conflict ? TriangleAlert : Sparkles" :size="16" class="mt-0.5 shrink-0" :class="conflict ? 'text-warning' : 'text-info'" />
        <div class="min-w-0 flex-1 space-y-0.5">
          <p class="font-semibold" :class="conflict ? 'text-warning' : 'text-info'">
            服务器上的草稿有新版本（第 {{ remote.meta.version }} 版）
          </p>
          <p class="text-xs text-meta">
            {{ remote.meta.updated_via === 'mcp' ? '模型经 MCP 修改' : '在审核页保存' }}<template v-if="remote.meta.updated_by">，{{ remote.meta.updated_by.nickname || remote.meta.updated_by.username }}</template><template v-if="remote.meta.updated_at"> · {{ ago(remote.meta.updated_at) }}</template>
            <template v-if="conflict">。这里也有还没同步上去的修改，载入会丢掉它们。</template>
          </p>
        </div>
        <div class="flex shrink-0 flex-wrap gap-2">
          <UiButton size="sm" :loading="loading" class="ring-1 ring-inset ring-line shadow-xs active:translate-y-px" @click="load">载入新版本</UiButton>
          <UiButton v-if="conflict" size="sm" :disabled="loading" class="ring-1 ring-inset ring-line shadow-xs active:translate-y-px" @click="keep">保留这里的，覆盖服务器</UiButton>
        </div>
      </div>

      <details v-if="remote.changes.length" class="mt-2.5 rounded-lg bg-surface/70 px-3 py-2 ring-1 ring-line" open>
        <summary class="cursor-pointer text-xs font-semibold text-title">模型改了 {{ remote.changes.length }} 处（附依据）</summary>
        <ul class="mt-2 max-h-96 space-y-2 overflow-y-auto pr-1 text-xs leading-5">
          <li v-for="(change, index) in remote.changes" :key="index" class="border-t border-line pt-2 first:border-0 first:pt-0">
            <p class="flex flex-wrap items-baseline gap-x-2">
              <span class="rounded bg-sunken px-1.5 font-mono text-[11px] text-title">{{ opLabels[change.op] ?? change.op }}</span>
              <code class="break-all text-meta">{{ where(change) }}</code>
            </p>
            <p v-if="change.op === 'set' || change.op === 'set_summary'" class="mt-0.5 break-words">
              <span class="text-faint line-through">{{ short(change.before) }}</span> → <span class="text-title">{{ short(change.after) }}</span>
            </p>
            <p v-else-if="change.after !== null && change.after !== undefined" class="mt-0.5 break-words text-title">{{ short(change.after) }}</p>
            <p v-else-if="change.before !== null && change.before !== undefined" class="mt-0.5 break-words text-faint line-through">{{ short(change.before) }}</p>
            <p v-if="change.note" class="mt-0.5 text-body">{{ change.note }}</p>
            <p v-if="change.evidence.length" class="mt-0.5 flex flex-wrap gap-x-2">
              <a v-for="url in change.evidence" :key="url" :href="url" target="_blank" rel="noopener noreferrer" class="break-all text-sky-700 hover:underline">{{ url }}</a>
            </p>
          </li>
        </ul>
      </details>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { useRevisionDraft } from '~/composables/useRevisionDraft'
import type { ServerDraftChange } from '~/utils/serverDrafts'
import { Sparkles, TriangleAlert } from '@lucide/vue'

/**
 * A harvest draft's place on the server (docs/harvest/README.md#服务器草稿): whether this copy is there, and a newer
 * version saved meanwhile — the model's MCP edits, each with the pages it checked, or another reviewer's — to load.
 */
const props = defineProps<{ draft: ReturnType<typeof useRevisionDraft> }>()
/** The editor shows the version loaded from the server. */
const emit = defineEmits<{ reloaded: [] }>()

const { confirm } = useConfirm()
const { ago } = useRelativeTime()
const loading = ref(false)

const remote = computed(() => props.draft.remote.value)
const conflict = computed(() => props.draft.syncState.value === 'conflict')
const opLabels: Record<string, string> = {
  set: '改', add: '加', remove: '删', add_item: '新建条目', remove_item: '去掉条目', set_summary: '摘要', add_source: '来源',
}

const stateText = computed(() => ({
  off: '',
  syncing: '正在存到服务器…',
  synced: props.draft.serverVersion.value ? `已存到服务器（第 ${props.draft.serverVersion.value} 版，审核人和 MCP 共用这份）` : '已存到服务器',
  conflict: '服务器上有更新的版本，这里的修改还没存上去',
  error: '没连上服务器，修改先存在本机',
}[props.draft.syncState.value]))
const dotClass = computed(() => ({
  off: 'bg-faint', syncing: 'bg-info animate-pulse', synced: 'bg-success', conflict: 'bg-warning', error: 'bg-danger',
}[props.draft.syncState.value]))

/** Where in the draft a change is: the item (when not the album) and the path. */
const where = (change: ServerDraftChange) => [change.item && change.item !== 'album' ? change.item : null, change.path].filter(Boolean).join(' · ') || '—'
const short = (value: unknown) => {
  if (value === null || value === undefined || value === '') return '（空）'
  const text = typeof value === 'string' ? value : JSON.stringify(value)
  return text.length > 160 ? `${text.slice(0, 160)}…` : text
}

const load = async () => {
  if (conflict.value && !await confirm({ title: '载入服务器上的新版本？', description: '这里还没存到服务器的修改会丢掉。', confirmText: '载入' })) return
  loading.value = true
  try {
    await props.draft.pullRemote()
    emit('reloaded')
  } finally {
    loading.value = false
  }
}
const keep = async () => {
  if (!await confirm({ title: '用这里的草稿覆盖服务器上的？', description: '服务器上的新版本（包括模型的修改）会被替换掉。', confirmText: '覆盖' })) return
  loading.value = true
  try { await props.draft.keepMine() } finally { loading.value = false }
}
const retry = () => props.draft.sync()
</script>
