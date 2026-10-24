<template>
  <div class="space-y-3 text-sm">
    <div v-if="plan.blockers.length" class="rounded-lg border border-danger/25 bg-danger/10 px-3 py-2 text-danger">
      <p class="font-semibold">{{ $t('revision_page.plan.blocked') }}</p>
      <ul class="mt-1 list-inside list-disc space-y-0.5">
        <li v-for="blocker in plan.blockers" :key="blocker">{{ blocker }}</li>
      </ul>
    </div>
    <div v-if="plan.delete.length">
      <p class="mb-1.5 font-semibold text-title">{{ $t('revision_page.plan.delete', { count: plan.delete.length }) }}</p>
      <ul class="space-y-1">
        <li v-for="entry in plan.delete" :key="`${entry.type}:${entry.id}`" class="flex min-w-0 items-center gap-2 text-body">
          <span class="shrink-0 rounded bg-danger/10 px-1.5 py-0.5 text-[11px] text-danger">{{ enumLabel('catalog_type', entry.type) }}</span>
          <NuxtLink v-if="entityPath(entry.type, entry.id)" :to="entityPath(entry.type, entry.id)!" class="min-w-0 truncate transition-colors hover:text-primary">{{ entry.label }}</NuxtLink>
          <span v-if="counts(entry)" class="shrink-0 text-xs text-faint">{{ counts(entry) }}</span>
        </li>
      </ul>
    </div>
    <div v-if="plan.keep.length">
      <p class="mb-1.5 font-semibold text-title">{{ $t('revision_page.plan.keep', { count: plan.keep.length }) }}</p>
      <ul class="space-y-1.5">
        <li v-for="entry in plan.keep" :key="`${entry.type}:${entry.id}`" class="text-body">
          <p class="flex min-w-0 items-center gap-2">
            <span class="shrink-0 rounded bg-success/10 px-1.5 py-0.5 text-[11px] text-success">{{ enumLabel('catalog_type', entry.type) }}</span>
            <NuxtLink v-if="entityPath(entry.type, entry.id)" :to="entityPath(entry.type, entry.id)!" class="min-w-0 truncate transition-colors hover:text-primary">{{ entry.label }}</NuxtLink>
            <span class="shrink-0 text-xs text-meta">{{ entry.action === 'move' ? $t('revision_page.plan.move', { id: entry.move_to }) : $t('revision_page.plan.release') }}</span>
          </p>
          <p class="ml-1 text-xs text-faint">{{ $t('revision_page.plan.because', { names: entry.reasons.map(reason => reason.label).join('、') }) }}</p>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
// What rejecting or withdrawing a revision whose content went live removes and keeps
// (GET /revisions/{id}/pending-content, docs/catalog/editing.md#删除计划).
import type { RemovalPlan } from '~/types/revision'
import { entityPath } from '~/utils/revisionLinks'

defineProps<{ plan: RemovalPlan }>()

const { enumLabel } = useCatalogDisplay()
const counts = (entry: RemovalPlan['delete'][number]) => entry.counts.filter(count => count.count > 0).map(count => `${count.label} ${count.count}`).join('、')
</script>
