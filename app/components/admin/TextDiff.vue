<script setup lang="ts">
import { diffLines } from 'diff'

/** A line-by-line diff of two texts; unchanged runs longer than a few lines are folded. */
const props = defineProps<{ before: string, after: string }>()
const { t } = useAdminI18n()
const CONTEXT = 3

type Row = { kind: 'added' | 'removed' | 'same' | 'fold', text: string }
const rows = computed<Row[]>(() => {
  const result: Row[] = []
  for (const part of diffLines(props.before ?? '', props.after ?? '')) {
    const lines = part.value.replace(/\n$/, '').split('\n')
    if (part.added || part.removed) {
      for (const line of lines) result.push({ kind: part.added ? 'added' : 'removed', text: line })
    }
    else if (lines.length > CONTEXT * 2 + 1) {
      for (const line of lines.slice(0, CONTEXT)) result.push({ kind: 'same', text: line })
      result.push({ kind: 'fold', text: t('admin_pages.articles.diff_folded', { count: lines.length - CONTEXT * 2 }) })
      for (const line of lines.slice(-CONTEXT)) result.push({ kind: 'same', text: line })
    }
    else {
      for (const line of lines) result.push({ kind: 'same', text: line })
    }
  }
  return result
})
const changed = computed(() => rows.value.some(row => row.kind === 'added' || row.kind === 'removed'))
const tone: Record<Row['kind'], string> = {
  added: 'bg-emerald-50 text-emerald-900', removed: 'bg-rose-50 text-rose-900 line-through decoration-rose-300', same: 'text-slate-600', fold: 'bg-slate-50 text-center text-slate-400 italic',
}
</script>

<template>
  <p v-if="!changed" class="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">{{ t('admin_pages.no_changes') }}</p>
  <div v-else class="max-h-[32rem] overflow-auto rounded-lg border border-slate-200 font-mono text-xs leading-5">
    <div v-for="(row, index) in rows" :key="index" class="flex gap-2 px-3" :class="tone[row.kind]">
      <span class="w-3 shrink-0 select-none text-slate-400">{{ row.kind === 'added' ? '+' : row.kind === 'removed' ? '−' : '' }}</span>
      <span class="whitespace-pre-wrap break-all">{{ row.text || ' ' }}</span>
    </div>
  </div>
</template>
