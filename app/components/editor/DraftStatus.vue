<template>
  <div v-if="compact" class="flex flex-wrap items-center gap-2 text-xs">
    <UiTooltip :text="$t('editor.local_hint')">
      <span tabindex="0" class="inline-flex cursor-help items-center gap-1.5 rounded-full bg-sunken px-2.5 py-0.5 text-meta ring-1 ring-line">
        <span class="inline-block size-1.5 rounded-full" :class="dotClass" />{{ label }}
      </span>
    </UiTooltip>
    <span v-if="draft.restoredAt.value" class="inline-flex items-center gap-1.5 rounded-full bg-info/10 py-0.5 pl-2.5 pr-1 text-info ring-1 ring-info/20">
      <History :size="12" class="shrink-0" />{{ $t('editor.restored', { at: ago(draft.restoredAt.value) }) }}
      <button type="button" class="rounded-full bg-info/15 px-2 font-semibold hover:bg-info/25 ring-1 ring-inset ring-info/25 shadow-xs transition active:translate-y-px" @click="discard">{{ $t('editor.restored_discard') }}</button>
    </span>
  </div>
  <div v-else class="space-y-2">
    <div v-if="draft.restoredAt.value" class="flex flex-wrap items-center gap-3 rounded-xl border border-info/25 bg-info/10 px-4 py-2.5 text-sm text-body">
      <History :size="16" class="shrink-0 text-info" />
      <span class="min-w-0 flex-1">{{ $t('editor.restored', { at: ago(draft.restoredAt.value) }) }}</span>
      <button type="button" class="btn btn-xs bg-info/15 text-info hover:bg-info/25 ring-1 ring-inset ring-info/25 shadow-xs transition active:translate-y-px" @click="discard">{{ $t('editor.restored_discard') }}</button>
    </div>
    <p class="flex flex-wrap items-center gap-1.5 text-xs text-meta">
      <span class="inline-block h-2 w-2 rounded-full" :class="dotClass" />
      {{ label }}
      <NuxtLink v-if="draft.revisionId.value" :to="`/revisions/${draft.revisionId.value}`" class="rounded bg-btn px-1.5 py-0.5 font-medium text-btn-content shadow-xs ring-1 ring-inset ring-line transition hover:bg-btn-hover active:translate-y-px">#{{ draft.revisionId.value }}</NuxtLink>
      <span class="text-faint">·</span>
      <span>{{ $t('editor.local_hint') }}</span>
    </p>
  </div>
</template>

<script setup lang="ts">
import type { useRevisionDraft } from '~/composables/useRevisionDraft'
import { History } from '@lucide/vue'

const props = defineProps<{
  draft: ReturnType<typeof useRevisionDraft>
  /** One line for a header: the save state as a pill (what "local" means in its tooltip), the restored edits beside it */
  compact?: boolean
}>()
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
  idle: 'bg-faint', dirty: 'bg-warning', saving: 'bg-info animate-pulse', saved: 'bg-success', error: 'bg-danger',
}[props.draft.saveState.value]))
</script>
