<template>
  <span class="inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium" :class="TONES[status].badge">
    <span class="h-1.5 w-1.5 rounded-full" :class="TONES[status].dot" />{{ $t(`revision_page.status.${status}`) }}
  </span>
</template>

<script setup lang="ts">
import type { RevisionStatus } from '~/types/revision'

defineProps<{ status: RevisionStatus }>()

const TONES: Record<RevisionStatus, { badge: string, dot: string }> = {
  pending: { badge: 'border-amber-200 bg-amber-50 text-amber-700', dot: 'bg-amber-500' },
  changes_requested: { badge: 'border-orange-200 bg-orange-50 text-orange-700', dot: 'bg-orange-500' },
  approved: { badge: 'border-emerald-200 bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' },
  rejected: { badge: 'border-rose-200 bg-rose-50 text-rose-700', dot: 'bg-rose-500' },
  withdrawn: { badge: 'border-gray-200 bg-white text-gray-500', dot: 'bg-gray-300' },
}
</script>
