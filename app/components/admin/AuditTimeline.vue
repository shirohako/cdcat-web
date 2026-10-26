<script setup lang="ts">
import type { AdminAuditEntry } from '~/types/admin'
defineProps<{ entries: AdminAuditEntry[] }>()
const result = (value: string) => auditResultLabels[value] ?? value
const format = (date: string) => new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date))
</script>

<template>
  <ol v-if="entries.length" class="space-y-4 border-l border-slate-200 pl-4">
    <li v-for="entry in entries" :key="entry.id" class="text-sm">
      <p class="font-medium">{{ entry.actor_name || '—' }} · {{ auditActionLabel(entry.action) }}</p>
      <p v-if="entry.reason" class="mt-1 whitespace-pre-wrap text-slate-600">{{ entry.reason }}</p>
      <p class="mt-1 text-xs text-slate-500"><time :datetime="entry.created_at">{{ format(entry.created_at) }}</time> · {{ result(entry.result) }}</p>
    </li>
  </ol>
  <p v-else class="text-sm text-slate-500">暂无操作记录</p>
</template>
