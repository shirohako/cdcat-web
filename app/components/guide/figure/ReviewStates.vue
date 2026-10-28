<script setup lang="ts">
/**
 * 提交之后: where a submission goes, with the status names the revision page uses. Submitting puts a new album live,
 * awaiting review; from there it is approved, sent back for changes (and resubmitted), rejected, or withdrawn.
 */
defineProps<{ text: Record<string, string> }>()
const { t } = useI18n()

const OUTCOMES = [
  { status: 'approved', icon: 'lucide:circle-check', tone: 'text-success bg-success/12', note: '' },
  { status: 'changes_requested', icon: 'lucide:corner-up-left', tone: 'text-warning bg-warning/12', note: 'edit_again' },
  { status: 'rejected', icon: 'lucide:circle-x', tone: 'text-danger bg-danger/10', note: 'removed' },
  { status: 'withdrawn', icon: 'lucide:undo-2', tone: 'text-meta bg-sunken', note: 'removed' },
]
</script>

<template>
  <div aria-hidden="true">
    <div class="grid items-center gap-3 sm:grid-cols-[minmax(0,0.8fr)_auto_minmax(0,1.2fr)]">
      <div class="rounded-lg bg-card p-3 ring-1 ring-line">
        <p class="flex items-center gap-2 text-xs font-semibold text-title">
          <span class="grid size-6 place-items-center rounded-full bg-primary text-on-primary"><Icon name="lucide:send" class="size-3.5" /></span>
          {{ text.submit }}
        </p>
        <p class="mt-2 flex items-center gap-1.5 text-[11px] text-body">
          <span class="rounded-full bg-warning/15 px-1.5 py-px text-[10px] font-semibold text-warning">{{ t('pending.badge') }}</span>
          {{ text.live }}
        </p>
        <p class="mt-1.5 text-[11px] text-meta">{{ t('revision_page.status.pending') }}</p>
      </div>
      <Icon name="lucide:arrow-right" class="hidden size-5 text-faint sm:block" />
      <ul class="space-y-1.5">
        <li v-for="outcome in OUTCOMES" :key="outcome.status" class="flex items-center gap-2 rounded-lg bg-card px-2.5 py-1.5 ring-1 ring-line">
          <span class="grid size-6 shrink-0 place-items-center rounded-full" :class="outcome.tone"><Icon :name="outcome.icon" class="size-3.5" /></span>
          <span class="shrink-0 text-xs font-semibold text-title">{{ t(`revision_page.status.${outcome.status}`) }}</span>
          <span v-if="outcome.note" class="min-w-0 truncate text-[11px] text-meta">{{ text[outcome.note] }}</span>
        </li>
      </ul>
    </div>
    <p class="mt-2.5 flex items-center justify-center gap-1.5 text-[11px] text-meta">
      <Icon name="lucide:bell" class="size-3.5" />{{ text.notify }}
    </p>
  </div>
</template>
