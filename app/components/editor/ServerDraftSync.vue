<template>
  <div v-if="draft.syncState.value !== 'off' || remote" class="space-y-2">
    <p v-if="draft.syncState.value !== 'off'" class="flex flex-wrap items-center gap-1.5 text-xs text-meta">
      <span class="inline-block size-1.5 rounded-full" :class="dotClass" />
      <span>{{ stateText }}</span>
      <template v-if="expiresIn !== null && draft.syncState.value !== 'error'">
        <span class="text-faint">·</span>
        <span>{{ $t('editor.server.expires', { count: expiresIn }, expiresIn) }}</span>
      </template>
      <UiButton
        v-if="draft.syncState.value === 'unsaved' || draft.syncState.value === 'error'"
        size="xs"
        :icon="CloudUpload"
        class="ring-1 ring-inset ring-line shadow-xs active:translate-y-px"
        @click="draft.saveToServer()"
      >{{ $t('editor.server.save') }}</UiButton>
    </p>

    <div v-if="remote" class="rounded-xl border px-4 py-3 text-sm text-body" :class="conflict ? 'border-warning/30 bg-warning/10' : 'border-info/25 bg-info/10'">
      <div class="flex flex-wrap items-start gap-3">
        <component :is="conflict ? TriangleAlert : Sparkles" :size="16" class="mt-0.5 shrink-0" :class="conflict ? 'text-warning' : 'text-info'" />
        <div class="min-w-0 flex-1 space-y-0.5">
          <p class="font-semibold" :class="conflict ? 'text-warning' : 'text-info'">{{ $t('editor.server.newer', { version: remote.meta.version }) }}</p>
          <p class="text-xs text-meta">
            {{ $t(remote.meta.updated_via === 'mcp' ? 'editor.server.by_mcp' : 'editor.server.by_web') }}<template v-if="remote.meta.updated_at"> · {{ ago(remote.meta.updated_at) }}</template>
            <template v-if="conflict"> · {{ $t('editor.server.conflict_hint') }}</template>
          </p>
        </div>
        <div class="flex shrink-0 flex-wrap gap-2">
          <UiButton size="sm" :loading="loading" class="ring-1 ring-inset ring-line shadow-xs active:translate-y-px" @click="load">{{ $t('editor.server.load') }}</UiButton>
          <UiButton v-if="conflict" size="sm" :disabled="loading" class="ring-1 ring-inset ring-line shadow-xs active:translate-y-px" @click="keep">{{ $t('editor.server.keep') }}</UiButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { useRevisionDraft } from '~/composables/useRevisionDraft'
import { CloudUpload, Sparkles, TriangleAlert } from '@lucide/vue'

/**
 * A member's draft saved to CDCat (docs/catalog/editing.md#草稿): whether this copy is there and when CDCat deletes it,
 * edits not saved there yet, and a newer version saved meanwhile — on another device, or by a model through the
 * drafts MCP server — to load, or to overwrite with this one.
 */
const props = defineProps<{ draft: ReturnType<typeof useRevisionDraft> }>()
/** The editor shows the version loaded from CDCat. */
const emit = defineEmits<{ reloaded: [] }>()

const { t } = useI18n()
const { confirm } = useConfirm()
const { ago } = useRelativeTime()
const { localizeError } = useLocalizedApiError()
const loading = ref(false)

const remote = computed(() => props.draft.remote.value)
/** Edits here that CDCat has not taken, with a newer version there. */
const conflict = computed(() => props.draft.syncState.value === 'conflict' || (!!remote.value && props.draft.syncState.value === 'unsaved'))

const stateText = computed(() => {
  const version = props.draft.serverVersion.value
  switch (props.draft.syncState.value) {
    case 'syncing': return t('editor.server.saving')
    case 'synced': return t('editor.server.synced', { version })
    case 'unsaved': return t('editor.server.unsaved', { version })
    case 'conflict': return t('editor.server.conflict')
    case 'error': return t('editor.server.error', { message: localizeError(props.draft.lastError.value) })
    default: return ''
  }
})
const dotClass = computed(() => ({
  off: 'bg-faint', syncing: 'bg-info animate-pulse', synced: 'bg-success', unsaved: 'bg-warning', conflict: 'bg-warning', error: 'bg-danger',
}[props.draft.syncState.value]))

/** Whole days until CDCat deletes the draft, counted from its last save there. */
const expiresIn = computed(() => {
  const at = props.draft.serverMeta.value?.expires_at
  if (!at || props.draft.serverVersion.value === null) return null
  return Math.max(0, Math.ceil((new Date(at).getTime() - Date.now()) / 86_400_000))
})

const load = async () => {
  if (conflict.value && !await confirm({ variant: 'confirm', title: t('editor.server.load_confirm'), description: t('editor.server.load_confirm_hint'), confirmText: t('editor.server.load') })) return
  loading.value = true
  try {
    await props.draft.pullRemote()
    emit('reloaded')
  }
  finally {
    loading.value = false
  }
}
const keep = async () => {
  if (!await confirm({ variant: 'confirm', title: t('editor.server.keep_confirm'), description: t('editor.server.keep_confirm_hint'), confirmText: t('editor.server.keep_short') })) return
  loading.value = true
  try { await props.draft.keepMine() }
  finally { loading.value = false }
}
</script>
