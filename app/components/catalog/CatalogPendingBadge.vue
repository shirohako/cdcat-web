<template>
  <span
    class="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
    :class="overlay ? 'bg-warning/90 text-[oklch(0.22_0.04_65)] backdrop-blur-sm' : 'border border-warning/30 bg-warning/10 text-warning'"
    :title="$t('pending.badge_title')"
  >
    <Hourglass :size="11" class="shrink-0" />{{ $t('pending.badge') }}
  </span>
</template>

<script setup lang="ts">
// Marks catalog content that went live at submission and awaits review (docs/catalog/editing.md#待审内容).
import { Hourglass } from '@lucide/vue'

defineProps<{ overlay?: boolean }>()
</script>
