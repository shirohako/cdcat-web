<script setup lang="ts">
import { CheckCircle2, CircleAlert } from '@lucide/vue'

const { notice } = useDiscussionNotice()
</script>

<template>
  <Transition enter-from-class="translate-y-2 opacity-0" leave-to-class="translate-y-2 opacity-0" enter-active-class="transition" leave-active-class="transition">
    <p
      v-if="notice" :key="notice.id" role="status"
      class="fixed bottom-6 right-6 z-50 flex max-w-sm items-start gap-2 rounded-xl bg-popover px-4 py-3 text-sm text-body shadow-overlay ring-1 ring-line"
    >
      <component :is="notice.tone === 'error' ? CircleAlert : CheckCircle2" :size="16" class="mt-0.5 shrink-0" :class="notice.tone === 'error' ? 'text-danger' : 'text-success'" />
      {{ notice.message }}
    </p>
  </Transition>
</template>
