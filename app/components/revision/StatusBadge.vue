<template>
  <span class="inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium" :class="TONES[status].badge">
    <span class="h-1.5 w-1.5 rounded-full" :class="TONES[status].dot" />{{ $t(`revision_page.status.${status}`) }}
  </span>
</template>

<script setup lang="ts">
import type { RevisionStatus } from '~/types/revision'

defineProps<{ status: RevisionStatus }>()

const TONES: Record<RevisionStatus, { badge: string, dot: string }> = {
  pending: { badge: 'border-warning/30 bg-warning/10 text-warning', dot: 'bg-warning' },
  // Its own orange, so it stays apart from pending.
  changes_requested: { badge: 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-400/30 dark:bg-orange-400/10 dark:text-orange-300', dot: 'bg-orange-500' },
  approved: { badge: 'border-success/30 bg-success/10 text-success', dot: 'bg-success' },
  rejected: { badge: 'border-danger/30 bg-danger/10 text-danger', dot: 'bg-danger' },
  withdrawn: { badge: 'border-line text-meta', dot: 'bg-faint' },
}
</script>
