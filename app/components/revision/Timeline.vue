<template>
  <ol class="relative space-y-4 border-l border-line pl-5">
    <li v-for="(event, index) in events" :key="index" class="relative">
      <span class="absolute -left-[1.6rem] top-1 h-2.5 w-2.5 rounded-full ring-4 ring-card" :class="DOTS[event.action] ?? 'bg-faint'" />
      <p class="text-sm text-title">
        <span class="font-medium">{{ $te(`revision_page.event.${event.action}`) ? $t(`revision_page.event.${event.action}`) : event.action }}</span>
        <span v-if="event.actor" class="text-meta"> · {{ event.actor.nickname || event.actor.username }}</span>
      </p>
      <p class="text-xs text-faint" :title="exact(event.created_at)">{{ ago(event.created_at) }}</p>
      <p v-if="event.comment" class="mt-1 whitespace-pre-line rounded-lg bg-sunken px-3 py-2 text-sm text-body">{{ event.comment }}</p>
    </li>
  </ol>
</template>

<script setup lang="ts">
import type { RevisionEvent } from '~/types/revision'

defineProps<{ events: RevisionEvent[] }>()
const { ago, exact } = useRelativeTime()

const DOTS: Record<string, string> = {
  submitted: 'bg-info', approved: 'bg-success', auto_approved: 'bg-success', rejected: 'bg-danger',
  changes_requested: 'bg-orange-500', withdrawn: 'bg-faint', flagged: 'bg-warning', checked: 'bg-success/70', rebased: 'bg-primary',
  applied: 'bg-warning/70', discarded: 'bg-danger/70',
}
</script>
