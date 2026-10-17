<template>
  <span
    class="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
    :class="overlay ? 'bg-amber-500/90 text-white backdrop-blur-sm' : 'border border-amber-200 bg-amber-50 text-amber-700'"
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
