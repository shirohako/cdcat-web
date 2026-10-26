<script setup lang="ts">
const props = defineProps<{ before: Record<string, unknown>, after: Record<string, unknown> }>()
// Object key order is irrelevant. Array order remains meaningful for tracks/credits.
const normalize = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(normalize)
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, normalize(item)]))
  return value
}
const rows = computed(() => [...new Set([...Object.keys(props.before), ...Object.keys(props.after)])]
  .filter(key => JSON.stringify(normalize(props.before[key])) !== JSON.stringify(normalize(props.after[key]))))
const format = (value: unknown) => value === undefined ? '—' : JSON.stringify(value, null, 2)
</script>

<template>
  <div class="overflow-x-auto rounded-lg border border-slate-200">
    <table v-if="rows.length" class="w-full text-left text-sm">
      <thead class="bg-slate-50"><tr><th class="p-3">字段</th><th class="p-3">修改前</th><th class="p-3">修改后</th></tr></thead>
      <tbody><tr v-for="key in rows" :key="key" class="border-t border-slate-200"><th class="p-3 align-top font-medium">{{ key }}</th><td class="bg-red-50 p-3 align-top"><pre class="whitespace-pre-wrap break-all text-xs">{{ format(before[key]) }}</pre></td><td class="bg-emerald-50 p-3 align-top"><pre class="whitespace-pre-wrap break-all text-xs">{{ format(after[key]) }}</pre></td></tr></tbody>
    </table>
    <p v-else class="p-4 text-sm text-slate-500">没有变化</p>
  </div>
</template>
