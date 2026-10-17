<template>
  <div class="space-y-2">
    <div v-if="draft.backup.value" class="flex flex-wrap items-center gap-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-2.5 text-sm text-sky-800">
      <span>{{ $t('editor.backup_found', { at: exact(draft.backup.value.at) }) }}</span>
      <div class="flex gap-2">
        <button type="button" class="btn btn-xs" @click="draft.restoreBackup()">{{ $t('editor.restore_backup') }}</button>
        <button type="button" class="btn btn-ghost btn-xs" @click="draft.dismissBackup()">{{ $t('editor.dismiss_backup') }}</button>
      </div>
    </div>
    <div v-if="draft.conflict.value" class="flex flex-wrap items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
      <span>{{ $t('editor.draft_conflict') }}</span>
      <div class="flex gap-2">
        <button type="button" class="btn btn-xs" @click="draft.keepMine()">{{ $t('editor.keep_mine') }}</button>
        <button type="button" class="btn btn-ghost btn-xs" @click="draft.useServer()">{{ $t('editor.use_server') }}</button>
      </div>
    </div>
    <p class="flex items-center gap-1.5 text-xs text-gray-400">
      <span class="inline-block h-2 w-2 rounded-full" :class="dotClass" />
      {{ label }}
      <NuxtLink v-if="draft.revisionId.value" :to="`/revisions/${draft.revisionId.value}`" class="hover:underline">#{{ draft.revisionId.value }}</NuxtLink>
    </p>
  </div>
</template>

<script setup lang="ts">
import type { useRevisionDraft } from '~/composables/useRevisionDraft'

const props = defineProps<{ draft: ReturnType<typeof useRevisionDraft> }>()

const { t } = useI18n()
const { exact, ago } = useRelativeTime()

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
