<template>
  <ol class="relative space-y-4 border-l border-gray-200 pl-5">
    <li v-for="(event, index) in events" :key="index" class="relative">
      <span class="absolute -left-[1.6rem] top-1 h-2.5 w-2.5 rounded-full ring-4 ring-white" :class="DOTS[event.action] ?? 'bg-gray-300'" />
      <p class="text-sm text-gray-800">
        <span class="font-medium">{{ $te(`revision_page.event.${event.action}`) ? $t(`revision_page.event.${event.action}`) : event.action }}</span>
        <span v-if="event.actor" class="text-gray-500"> · {{ event.actor.nickname || event.actor.username }}</span>
      </p>
      <p class="text-xs text-gray-400" :title="exact(event.created_at)">{{ ago(event.created_at) }}</p>
      <p v-if="event.comment" class="mt-1 whitespace-pre-line rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700">{{ event.comment }}</p>
    </li>
  </ol>
</template>

<script setup lang="ts">
import type { RevisionEvent } from '~/types/revision'

defineProps<{ events: RevisionEvent[] }>()
const { ago, exact } = useRelativeTime()

const DOTS: Record<string, string> = {
  submitted: 'bg-sky-500', approved: 'bg-emerald-500', auto_approved: 'bg-emerald-500', rejected: 'bg-rose-500',
  changes_requested: 'bg-orange-500', withdrawn: 'bg-gray-400', flagged: 'bg-amber-500', checked: 'bg-emerald-400', rebased: 'bg-indigo-400',
}
</script>
