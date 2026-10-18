<template>
  <div class="space-y-2">
    <div v-if="draft.restoredAt.value" class="flex flex-wrap items-center gap-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-2.5 text-sm text-sky-800">
      <History :size="16" class="shrink-0" />
      <span class="min-w-0 flex-1">{{ $t('editor.restored', { at: ago(draft.restoredAt.value) }) }}</span>
      <button type="button" class="btn btn-ghost btn-xs" @click="discard">{{ $t('editor.restored_discard') }}</button>
    </div>
    <p class="flex flex-wrap items-center gap-1.5 text-xs text-gray-400">
      <span class="inline-block h-2 w-2 rounded-full" :class="dotClass" />
      {{ label }}
      <NuxtLink v-if="draft.revisionId.value" :to="`/revisions/${draft.revisionId.value}`" class="hover:underline">#{{ draft.revisionId.value }}</NuxtLink>
      <span class="text-gray-300">·</span>
      <span>{{ $t('editor.local_hint') }}</span>
    </p>
  </div>
</template>

<script setup lang="ts">
import type { useRevisionDraft } from '~/composables/useRevisionDraft'
import { History } from '@lucide/vue'

const props = defineProps<{ draft: ReturnType<typeof useRevisionDraft> }>()
/** The editor starts over without the restored edits. */
const emit = defineEmits<{ discard: [] }>()

const { t } = useI18n()
const { confirm } = useConfirm()
const { ago } = useRelativeTime()

const discard = async () => {
  if (!await confirm({ title: t('editor.restored_discard_confirm'), confirmText: t('editor.restored_discard') })) return
  await props.draft.discard()
  emit('discard')
}

const label = computed(() => ({
  idle: t('editor.state_idle'),
  dirty: t('editor.state_dirty'),
  saving: t('editor.state_saving'),
  saved: t('editor.state_saved', { at: ago(props.draft.savedAt.value) }),
  error: t('editor.state_error'),
}[props.draft.saveState.value]))

const dotClass = computed(() => ({
  idle: 'bg-gray-300', dirty: 'bg-amber-400', saving: 'bg-sky-400 animate-pulse', saved: 'bg-emerald-500', error: 'bg-rose-500',
}[props.draft.saveState.value]))
</script>
